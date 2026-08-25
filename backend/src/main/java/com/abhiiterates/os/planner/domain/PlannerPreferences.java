package com.abhiiterates.os.planner.domain;

import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Persists a user's study availability and planning preferences.
 * Used by the Adaptive Study Planner as default inputs when generating plans.
 * <p>
 * One row per user (enforced by UNIQUE constraint on user_id).
 * Created lazily on first GET or PUT — never required upfront.
 */
@Entity
@Table(name = "planner_preferences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlannerPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * How many minutes per day the student has available to study.
     * Valid range: 15–720 minutes (15 min to 12 hours).
     * Default: 120 minutes (2 hours/day).
     */
    @Column(name = "available_minutes_per_day", nullable = false)
    @Builder.Default
    private Integer availableMinutesPerDay = 120;

    /**
     * Preferred length for a single study session.
     * Valid range: 15–180 minutes.
     * Default: 45 minutes.
     */
    @Column(name = "preferred_session_length_minutes", nullable = false)
    @Builder.Default
    private Integer preferredSessionLengthMinutes = 45;

    /**
     * How many days into the future the plan should cover.
     * Valid range: 1–90 days.
     * Default: 7 days.
     */
    @Column(name = "planning_horizon_days", nullable = false)
    @Builder.Default
    private Integer planningHorizonDays = 7;

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
