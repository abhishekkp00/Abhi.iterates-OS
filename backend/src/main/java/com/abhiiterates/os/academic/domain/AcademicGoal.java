package com.abhiiterates.os.academic.domain;

import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a student's academic goal for a specific topic.
 * Goals provide deadline-driven urgency signals to the Adaptive Study Planner.
 */
@Entity
@Table(
    name = "academic_goals",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_goal_user_topic_active",
        columnNames = {"user_id", "topic_id", "is_active"}
    )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    /**
     * The target mastery level (STRONG or DEVELOPING) the student wants to reach.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_state", nullable = false, length = 30)
    private GoalTargetState targetState;

    /**
     * The date by which the student wants to achieve the target state.
     */
    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
