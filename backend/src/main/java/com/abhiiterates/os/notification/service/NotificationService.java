package com.abhiiterates.os.notification.service;

import com.abhiiterates.os.notification.domain.NotificationType;
import com.abhiiterates.os.notification.dto.NotificationResponse;
import com.abhiiterates.os.notification.dto.UnreadCountResponse;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * NotificationService — defines the notification lifecycle contract.
 *
 * Implementations must handle:
 *   - Persistent creation (every call from other modules)
 *   - Read state transitions
 *   - Deletion
 *   - Unread counting for the bell badge
 */
public interface NotificationService {

    /**
     * Creates a new notification and (in Step 3) pushes it via WebSocket.
     *
     * @param recipient  the user who should receive this notification
     * @param type       semantic category for icon / colour rendering
     * @param message    human-readable notification body
     * @param actionUrl  optional SPA deep-link (e.g. "/resources/abc-123")
     * @param entityId   optional UUID of the triggering entity
     * @return           the persisted, mapped response
     */
    NotificationResponse createNotification(User recipient,
                                            NotificationType type,
                                            String message,
                                            String actionUrl,
                                            UUID entityId);

    /** Returns a paginated, newest-first notification history for the given user. */
    Page<NotificationResponse> getNotifications(User user, Pageable pageable);

    /** Marks a single notification as read. Validates ownership. */
    UnreadCountResponse markAsRead(UUID notificationId, User user);

    /** Marks ALL unread notifications as read in one UPDATE. */
    UnreadCountResponse markAllAsRead(User user);

    /** Hard-deletes a single notification. Validates ownership. */
    UnreadCountResponse deleteNotification(UUID notificationId, User user);

    /** Returns the number of unread notifications for the bell badge. */
    UnreadCountResponse getUnreadCount(User user);
}
