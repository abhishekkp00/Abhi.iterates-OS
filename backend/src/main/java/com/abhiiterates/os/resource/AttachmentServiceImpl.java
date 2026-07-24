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
import java.net.MalformedURLException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AttachmentServiceImpl implements AttachmentService {

    private final ResourceRepository resourceRepository;
    private final ResourceAttachmentRepository attachmentRepository;
    private final Cloudinary cloudinary;
    private final CloudinaryConfig cloudinaryConfig;

    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    @Override
    @Transactional
    public AttachmentResponse upload(UUID resourceId, MultipartFile file, User user) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));

        if (!resource.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Resource not found with ID: " + resourceId);
        }

        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (originalFileName.contains("..")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + originalFileName);
        }

        String downloadUrl;

        // If Cloudinary credentials are provided, upload to Cloudinary
        if (cloudinaryConfig.isConfigured()) {
            try {
                log.info("Uploading file '{}' to Cloudinary...", originalFileName);
                Map uploadParams = ObjectUtils.asMap(
                        "resource_type", "auto",
                        "folder", "abhiiterates_resources",
                        "public_id", UUID.randomUUID().toString()
                );
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
                downloadUrl = (String) uploadResult.get("secure_url");
                log.info("Successfully uploaded file to Cloudinary: {}", downloadUrl);
            } catch (Exception ex) {
                log.error("Cloudinary upload failed, falling back to local disk storage: {}", ex.getMessage());
                downloadUrl = saveLocally(file, originalFileName);
            }
        } else {
            downloadUrl = saveLocally(file, originalFileName);
        }

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

    private String saveLocally(MultipartFile file, String originalFileName) {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create local upload directory.", ex);
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

        return "/api/v1/resources/attachments/" + uniqueFileName + "/download";
    }

    @Override
    public org.springframework.core.io.Resource download(UUID attachmentId, User user) {
        ResourceAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        if (!attachment.getResource().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Attachment not found with ID: " + attachmentId);
        }

        String downloadUrl = attachment.getDownloadUrl();

        if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
            try {
                org.springframework.core.io.Resource cloudinaryResource = new UrlResource(URI.create(downloadUrl));
                if (cloudinaryResource.exists()) {
                    return cloudinaryResource;
                }
            } catch (Exception ex) {
                throw new ResourceNotFoundException("File not found on Cloudinary: " + attachment.getFileName());
            }
        }

        String uniqueFileName = downloadUrl.substring(
                downloadUrl.lastIndexOf("/attachments/") + 13,
                downloadUrl.lastIndexOf("/download")
        );

        try {
            Path filePath = this.fileStorageLocation.resolve(uniqueFileName).normalize();
            org.springframework.core.io.Resource springResource = new UrlResource(filePath.toUri());
            if (springResource.exists()) {
                return springResource;
            } else {
                throw new ResourceNotFoundException("File not found on disk: " + attachment.getFileName());
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found: " + attachment.getFileName());
        }
    }

    @Override
    @Transactional
    public void delete(UUID attachmentId, User user) {
        ResourceAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        if (!attachment.getResource().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Attachment not found with ID: " + attachmentId);
        }

        String downloadUrl = attachment.getDownloadUrl();

        if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
            try {
                int idx = downloadUrl.lastIndexOf("/abhiiterates_resources/");
                if (idx != -1) {
                    String publicIdWithExt = downloadUrl.substring(idx + 1);
                    int dotIdx = publicIdWithExt.lastIndexOf('.');
                    String publicId = dotIdx != -1 ? publicIdWithExt.substring(0, dotIdx) : publicIdWithExt;
                    cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
                }
            } catch (Exception ex) {
                log.warn("Could not delete file from Cloudinary: {}", ex.getMessage());
            }
        } else {
            String uniqueFileName = downloadUrl.substring(
                    downloadUrl.lastIndexOf("/attachments/") + 13,
                    downloadUrl.lastIndexOf("/download")
            );
            try {
                Path filePath = this.fileStorageLocation.resolve(uniqueFileName).normalize();
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {}
        }

        attachmentRepository.delete(attachment);
    }
}
