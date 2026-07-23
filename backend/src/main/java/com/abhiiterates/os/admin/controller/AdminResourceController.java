package com.abhiiterates.os.admin.controller;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.resource.ResourceStatus;
import com.abhiiterates.os.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/resources")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Resource Moderation", description = "Endpoints for moderating student library resources")
@Slf4j
public class AdminResourceController {

    private final ResourceRepository resourceRepository;
    private final com.abhiiterates.os.admin.AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "Get all uploaded library study resources (unfiltered)")
    public ResponseEntity<ApiResponse<List<Resource>>> getAllResources(HttpServletRequest request) {
        log.info("Admin requested all study resources for moderation queue.");
        List<Resource> resources = resourceRepository.findAll();
        return ResponseEntity.ok(
                ApiResponse.success(resources, "All study resources retrieved", request.getRequestURI())
        );
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Approve, Reject, or Archive a study resource")
    public ResponseEntity<ApiResponse<Void>> updateResourceStatus(
            @PathVariable UUID id,
            @RequestParam ResourceStatus status,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest request
    ) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        resource.setStatus(status);
        resourceRepository.save(resource);
        log.info("Admin '{}' updated resource '{}' status to {}", adminUser.getEmail(), resource.getTitle(), status);

        auditLogRepository.save(com.abhiiterates.os.admin.AuditLog.builder()
                .adminEmail(adminUser.getEmail())
                .action("MODERATE_RESOURCE_" + status)
                .target(resource.getTitle())
                .details("Resource status set to: " + status + " | Category: " + resource.getCategory())
                .ipAddress(request.getRemoteAddr())
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(null, "Resource status updated to " + status, request.getRequestURI())
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently purge a study resource from the university library")
    public ResponseEntity<ApiResponse<Void>> deleteResource(
            @PathVariable UUID id,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest request
    ) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        resourceRepository.delete(resource);
        log.info("Admin '{}' permanently deleted study resource '{}'", adminUser.getEmail(), resource.getTitle());

        auditLogRepository.save(com.abhiiterates.os.admin.AuditLog.builder()
                .adminEmail(adminUser.getEmail())
                .action("PURGE_RESOURCE")
                .target(resource.getTitle())
                .details("Permanently purged study resource files from library catalog")
                .ipAddress(request.getRemoteAddr())
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(null, "Resource purged successfully", request.getRequestURI())
        );
    }
}
