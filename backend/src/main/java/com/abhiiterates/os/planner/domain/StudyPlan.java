package com.abhiiterates.os.planner.domain;

import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A study plan is a recommendation artifact produced by the Adaptive Study Planner.
 * <p>
 * It is completely separate from {@link com.abhiiterates.os.academic.domain.StudySession}
 * (which records actual study activity). A StudyPlan holds deterministic recommendations
 * about which topics to study, in what order, and for how long.
 * <p>
 * Lifecycle: DRAFT → ACTIVE → EXPIRED / COMPLETED
 */
@Entity
@Table(name = "study_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StudyPlanStatus status = StudyPlanStatus.DRAFT;

    @Column(name = "plan_start_date", nullable = false)
    private LocalDate planStartDate;

    @Column(name = "plan_end_date", nullable = false)
    private LocalDate planEndDate;

    /**
     * Sum of all recommended session minutes across all planned sessions.
     */
    @Column(name = "total_planned_minutes", nullable = false)
    @Builder.Default
    private Integer totalPlannedMinutes = 0;

    /**
     * Snapshot: user's availableMinutesPerDay × planningHorizonDays at generation time.
     */
    @Column(name = "total_available_minutes", nullable = false)
    @Builder.Default
    private Integer totalAvailableMinutes = 0;

    /**
     * True when totalPlannedMinutes > totalAvailableMinutes.
     * The plan is still generated but an explanatory warning is included.
     */
    @Column(name = "capacity_warning", nullable = false)
    @Builder.Default
    private Boolean capacityWarning = false;

    @Column(name = "capacity_warning_msg", length = 500)
    private String capacityWarningMsg;

    /**
     * JSON snapshot of the inputs (LearningState, goals, preferences) used at plan
     * generation time, for auditability and explainability.
     */
    @Column(name = "generation_context", columnDefinition = "TEXT")
    private String generationContext;

    /**
     * Set to true when new assessment evidence or material learning state changes
     * suggest the plan may need review/regeneration.
     */
    @Column(name = "needs_review", nullable = false)
    @Builder.Default
    private Boolean needsReview = false;

    @Column(name = "stale_reason", length = 500)
    private String staleReason;

    @Column(name = "generated_at")
    @Builder.Default
    private Instant generatedAt = Instant.now();

    @OneToMany(mappedBy = "studyPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("dayNumber ASC, displayOrder ASC")
    @Builder.Default
    private List<PlannedStudySession> plannedSessions = new ArrayList<>();

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
