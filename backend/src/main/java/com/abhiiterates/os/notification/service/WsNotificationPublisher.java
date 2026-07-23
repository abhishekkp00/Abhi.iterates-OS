package com.abhiiterates.os.notification.service;

import com.abhiiterates.os.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * WsNotificationPublisher — Publishes real-time notification events
 * using Spring WebSocket SimpMessagingTemplate.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WsNotificationPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Pushes a notification response to a specific user's private queue.
     * Subscribes to /user/queue/notifications on the client side.
     */
    public void pushToUser(String email, NotificationResponse notification) {
        log.info("WebSocket push sending notification [{}] to user [{}]", notification.id(), email);
        messagingTemplate.convertAndSendToUser(
                email,
                "/queue/notifications",
                notification
        );
    }
}
