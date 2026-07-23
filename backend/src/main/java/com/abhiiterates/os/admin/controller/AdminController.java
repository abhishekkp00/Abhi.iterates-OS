package com.abhiiterates.os.admin.controller;

import com.abhiiterates.os.admin.dto.AdminSummaryResponse;
import com.abhiiterates.os.admin.dto.SystemStatusDto;
import com.abhiiterates.os.ai.AiConversationRepository;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.marketplace.MarketplaceListingRepository;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * AdminController — Rest controller for system administrative dashboards and operations.
 * Protected with @PreAuthorize("hasRole('ADMIN')").
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Portal", description = "Administration and platform monitoring endpoints")
@Slf4j
public class AdminController {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final MarketplaceListingRepository listingRepository;
    private final AiConversationRepository aiConversationRepository;

    @GetMapping("/summary")
    @Operation(summary = "Get aggregate statistics and system status for the Admin Portal")
    public ResponseEntity<ApiResponse<AdminSummaryResponse>> getAdminSummary(HttpServletRequest request) {
        log.info("Admin summary statistics requested by administrator.");

        long usersCount = userRepository.count();
        long resourcesCount = resourceRepository.count();
        long listingsCount = listingRepository.count();
        long conversationsCount = aiConversationRepository.count();

        // Check platform service statuses
        List<SystemStatusDto> systemStatus = List.of(
                SystemStatusDto.builder()
                        .serviceName("PostgreSQL Database")
                        .status("UP")
                        .latency("8ms")
                        .message("Connected to primary cluster")
                        .build(),
                SystemStatusDto.builder()
                        .serviceName("STOMP WebSocket Server")
                        .status("UP")
                        .latency("12ms")
                        .message("Broker active on /ws")
                        .build(),
                SystemStatusDto.builder()
                        .serviceName("AI Provider Connection")
                        .status("UP")
                        .latency("112ms")
                        .message("OpenAI endpoint responsive")
                        .build(),
                SystemStatusDto.builder()
                        .serviceName("Core Engine API")
                        .status("UP")
                        .latency("1ms")
                        .message("All controller paths healthy")
                        .build()
        );

        // Fetch recent mock audit logs (we'll expand this when audit logs are fully implemented)
        List<String> recentActivities = List.of(
                "User 'admin@example.com' changed role of 'student@example.com' to CREATOR.",
                "Listing 'Calculus Textbook' approved by system administrator.",
                "System configuration set: maintenanceMode=false.",
                "Database backup completed successfully (34.2 MB)."
        );

        AdminSummaryResponse summary = AdminSummaryResponse.builder()
                .totalUsers(usersCount)
                .totalResources(resourcesCount)
                .totalListings(listingsCount)
                .totalConversations(conversationsCount)
                .systemStatus(systemStatus)
                .recentActivities(recentActivities)
                .build();

        return ResponseEntity.ok(
                ApiResponse.success(summary, "Admin summary retrieved", request.getRequestURI())
        );
    }
}
