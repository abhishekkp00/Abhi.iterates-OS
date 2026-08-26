package com.abhiiterates.os.resource;

import com.abhiiterates.os.config.CloudinaryConfig;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.dto.AttachmentResponse;
import com.abhiiterates.os.user.User;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class AttachmentServiceImpl implements AttachmentService {

    private final ResourceRepository resourceRepository;
    private final ResourceAttachmentRepository attachmentRepository;
    private final Cloudinary cloudinary;
    private final CloudinaryConfig cloudinaryConfig;

    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    @Override
    @Transactional
    public AttachmentResponse upload(UUID resourceId, MultipartFile file, User user) {
        // Validate resource ownership
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));

        if (!resource.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Resource not found with ID: " + resourceId);
        }

        // Clean & validate filename
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (originalFileName.contains("..") || originalFileName.contains("/") || originalFileName.contains("\\")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + originalFileName);
        }

        String extension = "";
        int extIdx = originalFileName.lastIndexOf('.');
        if (extIdx >= 0) {
            extension = originalFileName.substring(extIdx).toLowerCase();
        }

        java.util.Set<String> disallowedExtensions = java.util.Set.of(
                ".exe", ".bat", ".sh", ".cmd", ".jsp", ".jspx", ".php", ".py", ".html", ".htm", ".js", ".vbs", ".jar"
        );
        if (disallowedExtensions.contains(extension)) {
            throw new IllegalArgumentException("File extension '" + extension + "' is not permitted for upload.");
        }

        String downloadUrl = null;

        // Cloudinary Cloud Storage strategy
        if (cloudinary != null && cloudinaryConfig != null && cloudinaryConfig.isConfigured()) {
            try {
                Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                        "resource_type", "auto",
                        "folder", "resources"));
                downloadUrl = (String) uploadResult.get("secure_url");
                log.info("File successfully uploaded to Cloudinary: {}", downloadUrl);
            } catch (Exception ex) {
                log.warn("Cloudinary upload failed, falling back to local storage: {}", ex.getMessage());
            }
        }

        // Fallback to local file storage if Cloudinary wasn't used or failed
        if (downloadUrl == null) {
            try {
                Files.createDirectories(this.fileStorageLocation);
            } catch (IOException ex) {
                throw new RuntimeException("Could not create the upload directory.", ex);
            }

            String fileExtension = "";
            int extensionIndex = originalFileName.lastIndexOf('.');
            if (extensionIndex >= 0) {
                fileExtension = originalFileName.substring(extensionIndex);
            }
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);

            try {
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException ex) {
                throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
            }

            downloadUrl = "/api/v1/resources/attachments/" + uniqueFileName + "/download";
        }

        // Save metadata record
        ResourceAttachment attachment = ResourceAttachment.builder()
                .fileName(originalFileName)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .downloadUrl(downloadUrl)
                .resource(resource)
                .build();

        ResourceAttachment saved = attachmentRepository.save(attachment);

        return AttachmentResponse.builder()
                .id(saved.getId())
                .fileName(saved.getFileName())
                .fileSize(saved.getFileSize())
                .contentType(saved.getContentType())
                .downloadUrl(saved.getDownloadUrl())
                .build();
    }

    @Override
    public org.springframework.core.io.Resource download(UUID attachmentId, User user) {
        ResourceAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        // Enforce user ownership of the parent resource
        if (!attachment.getResource().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Attachment not found with ID: " + attachmentId);
        }

        String downloadUrl = attachment.getDownloadUrl();

        // 1. Cloudinary / Remote HTTP(S) URL strategy
        if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
            try {
                org.springframework.core.io.Resource springResource = new UrlResource(downloadUrl);
                if (springResource.exists()) {
                    // Verify stream readable
                    try (InputStream is = springResource.getInputStream()) {
                        return springResource;
                    }
                }
            } catch (Exception ex) {
                log.warn("Remote attachment stream unavailable from URL [{}]: {}", downloadUrl, ex.getMessage());
            }
        }

        // 2. Local File System fallback strategy
        if (downloadUrl.contains("/attachments/") && downloadUrl.contains("/download")) {
            String uniqueFileName = downloadUrl.substring(
                    downloadUrl.lastIndexOf("/attachments/") + 13,
                    downloadUrl.lastIndexOf("/download"));

            try {
                Path filePath = this.fileStorageLocation.resolve(uniqueFileName).normalize();
                org.springframework.core.io.Resource springResource = new UrlResource(filePath.toUri());
                if (springResource.exists()) {
                    return springResource;
                }
            } catch (MalformedURLException ex) {
                throw new ResourceNotFoundException("File not found: " + attachment.getFileName());
            }
        }

        throw new ResourceNotFoundException("File content unavailable for attachment ID: " + attachmentId);
    }

    @Override
    @Transactional
    public void delete(UUID attachmentId, User user) {
        ResourceAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        // Enforce ownership
        if (!attachment.getResource().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Attachment not found with ID: " + attachmentId);
        }

        String downloadUrl = attachment.getDownloadUrl();
        if (downloadUrl != null && downloadUrl.contains("/attachments/") && downloadUrl.contains("/download")) {
            String uniqueFileName = downloadUrl.substring(
                    downloadUrl.lastIndexOf("/attachments/") + 13,
                    downloadUrl.lastIndexOf("/download"));

            // Delete from disk
            try {
                Path filePath = this.fileStorageLocation.resolve(uniqueFileName).normalize();
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {
            }
        }

        // Delete from DB
        attachmentRepository.delete(attachment);
    }
}
