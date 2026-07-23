package com.abhiiterates.os.notification.controller;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.notification.dto.NotificationResponse;
import com.abhiiterates.os.notification.dto.UnreadCountResponse;
import com.abhiiterates.os.notification.service.NotificationService;
import com.abhiiterates.os.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * NotificationController — REST API for the notification system.
 *
 * Base path: /api/v1/notifications
 *
 * Endpoints:
 *   GET    /                 — paginated notification history
 *   GET    /unread-count     — badge counter
 *   PATCH  /{id}/read        — mark single as read
 *   PATCH  /mark-all-read    — bulk mark-all as read
 *   DELETE /{id}             — delete single notification
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Real-time notification management")
public class NotificationController {

    private final NotificationService notificationService;

    // ── GET /api/v1/notifications ─────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Get notification history (paginated, newest first)")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotifications(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            HttpServletRequest request
    ) {
        Page<NotificationResponse> page = notificationService.getNotifications(user, pageable);
        return ResponseEntity.ok(
                ApiResponse.success(page, "Notifications retrieved", request.getRequestURI())
        );
    }

    // ── GET /api/v1/notifications/unread-count ────────────────────────────────

    @GetMapping("/unread-count")
    @Operation(summary = "Get the number of unread notifications for the bell badge")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(notificationService.getUnreadCount(user), "Unread count retrieved", request.getRequestURI())
        );
    }

    // ── PATCH /api/v1/notifications/{id}/read ─────────────────────────────────

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(notificationService.markAsRead(id, user), "Notification marked as read", request.getRequestURI())
        );
    }

    // ── PATCH /api/v1/notifications/mark-all-read ─────────────────────────────

    @PatchMapping("/mark-all-read")
    @Operation(summary = "Mark ALL unread notifications as read")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> markAllAsRead(
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(notificationService.markAllAsRead(user), "All notifications marked as read", request.getRequestURI())
        );
    }

    // ── DELETE /api/v1/notifications/{id} ────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a single notification")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(notificationService.deleteNotification(id, user), "Notification deleted", request.getRequestURI())
        );
    }
}
