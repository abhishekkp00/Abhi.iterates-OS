package com.abhiiterates.os.notification.domain;

import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Notification — persistent notification entity.
 *
 * Each row represents a single notification delivered (or queued for delivery)
 * to a specific recipient user.  Soft-read semantics: rows are kept indefinitely;
 * the {@code read} flag drives the unread counter.
 */
@Entity
@Table(
    name = "notifications",
    indexes = {
        // Fast lookup of all notifications for a user ordered by recency
        @Index(name = "idx_notifications_user_created", columnList = "user_id, created_at DESC"),
        // Fast unread-count query
        @Index(name = "idx_notifications_user_read", columnList = "user_id, is_read")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * The user who should receive this notification.
     * FK → users.id; lazy-loaded to avoid N+1 on list queries.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Semantic type — drives UI icon, colour, and routing. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    /** Human-readable notification body, e.g. "Alice commented on your resource". */
    @Column(nullable = false, length = 512)
    private String message;

    /**
     * Optional deep-link within the SPA.
     * e.g. "/resources/abc-123" so the user can navigate directly.
     */
    @Column(name = "action_url", length = 512)
    private String actionUrl;

    /**
     * Optional reference to the entity that triggered this notification
     * (resource ID, task ID, listing ID …).
     */
    @Column(name = "entity_id")
    private UUID entityId;

    /** True once the user has viewed / acknowledged this notification. */
    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;
}
