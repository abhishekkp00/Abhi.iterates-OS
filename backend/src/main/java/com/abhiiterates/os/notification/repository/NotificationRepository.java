package com.abhiiterates.os.notification.repository;

import com.abhiiterates.os.notification.domain.Notification;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * NotificationRepository — data-access layer for notifications.
 *
 * All queries are tenant-scoped: every method accepts the owning {@link User}
 * so a user can never access another user's notifications.
 */
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /** Paginated list of all notifications for a user, newest first. */
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    /** Count unread notifications — drives the bell badge counter. */
    long countByUserAndReadFalse(User user);

    /** Lookup a single notification ensuring ownership. */
    Optional<Notification> findByIdAndUser(UUID id, User user);

    /**
     * Bulk-mark all unread notifications as read for a user.
     * Uses a single UPDATE statement to avoid N+1.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user = :user AND n.read = false")
    void markAllReadByUser(@Param("user") User user);

    /** Hard-delete all notifications for a user (GDPR / account cleanup). */
    void deleteAllByUser(User user);
}
