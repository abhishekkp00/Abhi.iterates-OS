package com.abhiiterates.os.notification.service;

import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.notification.domain.Notification;
import com.abhiiterates.os.notification.domain.NotificationType;
import com.abhiiterates.os.notification.dto.NotificationResponse;
import com.abhiiterates.os.notification.dto.UnreadCountResponse;
import com.abhiiterates.os.notification.repository.NotificationRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * NotificationServiceImpl — production implementation of {@link NotificationService}.
 *
 * All write operations are @Transactional.
 * The WsNotificationPublisher dependency (added in Step 3) will be injected
 * lazily via an @Autowired setter to avoid a circular-bean dependency.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final WsNotificationPublisher wsPublisher;

    // ── Mapper helper ────────────────────────────────────────────────────────

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getMessage(),
                n.getActionUrl(),
                n.getEntityId(),
                n.isRead(),
                n.getCreatedAt()
        );
    }

    // ── Create ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public NotificationResponse createNotification(User recipient,
                                                   NotificationType type,
                                                   String message,
                                                   String actionUrl,
                                                   UUID entityId) {
        Notification notification = Notification.builder()
                .user(recipient)
                .type(type)
                .message(message)
                .actionUrl(actionUrl)
                .entityId(entityId)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = toResponse(saved);

        log.info("Created notification [{}] for user [{}]", type, recipient.getId());

        // Publish to WebSocket queue
        wsPublisher.pushToUser(recipient.getEmail(), response);

        return response;
    }

    // ── Query ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(User user, Pageable pageable) {
        return notificationRepository
                .findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(User user) {
        long count = notificationRepository.countByUserAndReadFalse(user);
        return new UnreadCountResponse(count);
    }

    // ── Read state transitions ───────────────────────────────────────────────

    @Override
    @Transactional
    public UnreadCountResponse markAsRead(UUID notificationId, User user) {
        Notification notification = notificationRepository
                .findByIdAndUser(notificationId, user)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found or access denied: " + notificationId));

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
            log.debug("Notification [{}] marked as read for user [{}]", notificationId, user.getId());
        }

        return getUnreadCount(user);
    }

    @Override
    @Transactional
    public UnreadCountResponse markAllAsRead(User user) {
        notificationRepository.markAllReadByUser(user);
        log.info("All notifications marked as read for user [{}]", user.getId());
        return new UnreadCountResponse(0L);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public UnreadCountResponse deleteNotification(UUID notificationId, User user) {
        Notification notification = notificationRepository
                .findByIdAndUser(notificationId, user)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found or access denied: " + notificationId));

        notificationRepository.delete(notification);
        log.debug("Notification [{}] deleted for user [{}]", notificationId, user.getId());

        return getUnreadCount(user);
    }
}
