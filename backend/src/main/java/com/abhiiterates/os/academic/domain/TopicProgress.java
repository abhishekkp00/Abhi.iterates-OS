package com.abhiiterates.os.academic.domain;

import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "topic_progress", uniqueConstraints = {
        @UniqueConstraint(name = "uq_topic_progress_user_topic", columnNames = {"user_id", "topic_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicProgress extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "total_study_minutes", nullable = false)
    @Builder.Default
    private Integer totalStudyMinutes = 0;

    @Column(name = "session_count", nullable = false)
    @Builder.Default
    private Integer sessionCount = 0;

    @Column(name = "last_studied_at")
    private Instant lastStudiedAt;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;
}
