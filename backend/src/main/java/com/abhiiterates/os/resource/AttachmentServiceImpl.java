package com.abhiiterates.os.resource;

import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.dto.AttachmentResponse;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttachmentServiceImpl implements AttachmentService {

    private final ResourceRepository resourceRepository;
    private final ResourceAttachmentRepository attachmentRepository;

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
        if (originalFileName.contains("..")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + originalFileName);
        }

        // Create storage directory if it doesn't exist
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the upload directory.", ex);
        }

        // Generate unique filename to prevent collisions
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

        // Formulate the download URL pointing to the download controller mapping
        String downloadUrl = "/api/v1/resources/attachments/" + uniqueFileName + "/download";

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

        // The downloadUrl contains the stored unique file name at the end
        // e.g. "/api/v1/resources/attachments/{uniqueFileName}/download"
        String downloadUrl = attachment.getDownloadUrl();
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

        // Enforce ownership
        if (!attachment.getResource().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Attachment not found with ID: " + attachmentId);
        }

        String downloadUrl = attachment.getDownloadUrl();
        String uniqueFileName = downloadUrl.substring(
                downloadUrl.lastIndexOf("/attachments/") + 13,
                downloadUrl.lastIndexOf("/download")
        );

        // Delete from disk
        try {
            Path filePath = this.fileStorageLocation.resolve(uniqueFileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}

        // Delete from DB
        attachmentRepository.delete(attachment);
    }
}
