package com.abhiiterates.os.resource;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.dto.AttachmentResponse;
import com.abhiiterates.os.user.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final ResourceAttachmentRepository attachmentRepository;

    @PostMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        AttachmentResponse data = attachmentService.upload(id, file, user);
        ApiResponse<AttachmentResponse> response = ApiResponse.success(
                data, "Attachment uploaded successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attachments/{uniqueFileName}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadAttachment(
            @PathVariable String uniqueFileName,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        String targetUrl = "/api/v1/resources/attachments/" + uniqueFileName + "/download";
        ResourceAttachment attachment = attachmentRepository.findByDownloadUrl(targetUrl)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment file not found"));

        org.springframework.core.io.Resource fileResource = attachmentService.download(attachment.getId(), user);

        String contentType = attachment.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(fileResource);
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID attachmentId,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        attachmentService.delete(attachmentId, user);
        ApiResponse<Void> response = ApiResponse.success(
                "Attachment deleted successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }
}
