package com.abhiiterates.os.admin.controller;

import com.abhiiterates.os.admin.AuditLog;
import com.abhiiterates.os.admin.AuditLogRepository;
import com.abhiiterates.os.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Audit Logging", description = "Endpoints to review system operations audit trails")
@Slf4j
public class AdminAuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "Search and filter historical administrative operations audit logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(
            @RequestParam(required = false, defaultValue = "") String search,
            HttpServletRequest request
    ) {
        log.info("Admin requested audit logs search for: '{}'", search);
        List<AuditLog> logs = auditLogRepository.searchAuditLogs(search);
        return ResponseEntity.ok(
                ApiResponse.success(logs, "Audit logs retrieved", request.getRequestURI())
        );
    }
}
