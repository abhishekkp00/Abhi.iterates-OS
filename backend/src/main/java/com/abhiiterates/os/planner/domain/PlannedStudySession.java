package com.abhiiterates.os.planner.domain;

import com.abhiiterates.os.academic.domain.StudySessionType;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A single recommended study session within a {@link StudyPlan}.
 * <p>
 * Each planned session specifies:
 * <ul>
 *   <li>Which topic to study</li>
 *   <li>On which day of the plan horizon (1-based)</li>
 *   <li>For how many minutes</li>
 *   <li>Why this topic was prioritized (human-readable reason)</li>
 *   <li>The deterministic priority score that ranked it</li>
 * </ul>
 * <p>
 * Students can manually override any session's duration or type via the UI.
 */
@Entity
@Table(name = "planned_study_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlannedStudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "study_plan_id", nullable = false)
    private StudyPlan studyPlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    /**
     * 1-based day index within the plan horizon (Day 1 = plan start date).
     */
    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    /**
     * The planner's recommended study duration for this session.
     * Range: 25–90 minutes (configurable).
     */
    @Column(name = "recommended_minutes", nullable = false)
    private Integer recommendedMinutes;

    /**
     * Weighted priority score computed by {@code PriorityCalculator}.
     * Higher = more urgently recommended.
     */
    @Column(name = "priority_score", nullable = false)
    private Double priorityScore;

    /**
     * Human-readable explanation of why this topic was prioritized.
     * e.g., "WEAK mastery (recent avg: 42%), DECLINING trend, goal deadline in 5 days"
     */
    @Column(name = "priority_reason", nullable = false, length = 1000)
    private String priorityReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 30)
    @Builder.Default
    private StudySessionType sessionType = StudySessionType.STUDY;

    /**
     * True when the student has manually overridden the planner's recommendation.
     */
    @Column(name = "is_manual_override", nullable = false)
    @Builder.Default
    private Boolean isManualOverride = false;

    @Column(name = "override_notes", length = 500)
    private String overrideNotes;

    /**
     * Set to true when an actual study session completes for this planned session.
     */
    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "completed_at")
    private Instant completedAt;

    /**
     * Actual minutes spent during completed study session(s).
     */
    @Column(name = "actual_minutes")
    private Integer actualMinutes;

    /**
     * Display ordering within a day (0-based). Lower = shown first.
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

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
