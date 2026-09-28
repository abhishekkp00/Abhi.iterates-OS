package com.abhiiterates.os.notification;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.notification.domain.NotificationType;
import com.abhiiterates.os.notification.dto.NotificationResponse;
import com.abhiiterates.os.notification.dto.UnreadCountResponse;
import com.abhiiterates.os.notification.service.NotificationService;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NotificationIntegrationTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = UserTestFactory.createRegularUser("notifUserA");
        userA = userRepository.save(userA);

        userB = UserTestFactory.createRegularUser("notifUserB");
        userB = userRepository.save(userB);
    }

    @Test
    void completeNotificationLifecycle_andStrictUserIsolation() {
        // 1. Create Notification for User A
        NotificationResponse n1 = notificationService.createNotification(
                userA,
                NotificationType.TASK_DUE_SOON,
                "Task Operating Systems Lab due soon",
                "/tasks",
                UUID.randomUUID()
        );

        NotificationResponse n2 = notificationService.createNotification(
                userA,
                NotificationType.RESOURCE_SHARED,
                "Alex shared Algorithms Study Guide with you",
                "/resources/1",
                UUID.randomUUID()
        );

        assertThat(n1).isNotNull();
        assertThat(n2).isNotNull();

        // 2. Persistence & Unread Count for User A
        UnreadCountResponse countA = notificationService.getUnreadCount(userA);
        assertThat(countA.unreadCount()).isEqualTo(2);

        Page<NotificationResponse> pageA = notificationService.getNotifications(userA, PageRequest.of(0, 10));
        assertThat(pageA.getContent()).hasSize(2);
        assertThat(pageA.getContent().get(0).message()).contains("Alex shared");

        // 3. User B MUST NOT see User A's notifications (Tenant Isolation)
        UnreadCountResponse countB = notificationService.getUnreadCount(userB);
        assertThat(countB.unreadCount()).isEqualTo(0);

        Page<NotificationResponse> pageB = notificationService.getNotifications(userB, PageRequest.of(0, 10));
        assertThat(pageB.getContent()).isEmpty();

        // 4. User B MUST NOT be able to mark read or delete User A's notifications (IDOR Protection)
        assertThatThrownBy(() -> notificationService.markAsRead(n1.id(), userB))
                .isInstanceOf(ResourceNotFoundException.class);

        assertThatThrownBy(() -> notificationService.deleteNotification(n1.id(), userB))
                .isInstanceOf(ResourceNotFoundException.class);

        // 5. Mark Single Notification as Read by User A
        UnreadCountResponse countAfterRead = notificationService.markAsRead(n1.id(), userA);
        assertThat(countAfterRead.unreadCount()).isEqualTo(1);

        // 6. Mark All Notifications as Read by User A
        UnreadCountResponse countAfterMarkAll = notificationService.markAllAsRead(userA);
        assertThat(countAfterMarkAll.unreadCount()).isEqualTo(0);

        // 7. Delete Notification by User A
        UnreadCountResponse countAfterDelete = notificationService.deleteNotification(n2.id(), userA);
        assertThat(countAfterDelete.unreadCount()).isEqualTo(0);

        Page<NotificationResponse> pageFinalA = notificationService.getNotifications(userA, PageRequest.of(0, 10));
        assertThat(pageFinalA.getContent()).hasSize(1); // n1 remains, n2 deleted
    }
}
