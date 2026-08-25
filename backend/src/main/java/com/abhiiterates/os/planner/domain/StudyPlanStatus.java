package com.abhiiterates.os.planner.domain;

/**
 * Lifecycle states for a {@link StudyPlan}.
 * <p>
 * Valid state transitions:
 * <pre>
 *   DRAFT ──→ ACTIVE ──→ EXPIRED
 *               └──────→ COMPLETED
 *   DRAFT ──→ (deleted)
 * </pre>
 * Only one plan per user may be in ACTIVE state at any time.
 */
public enum StudyPlanStatus {

    /**
     * Plan has been generated and saved but not yet activated.
     * The student can review, adjust, or discard it.
     */
    DRAFT,

    /**
     * The student has activated this plan. It is their current working plan.
     * Activating a plan automatically EXPIRES any previously active plan.
     */
    ACTIVE,

    /**
     * The plan's end date has passed, or it was superseded by a new ACTIVE plan.
     */
    EXPIRED,

    /**
     * The student manually marked the plan as completed (all sessions done).
     */
    COMPLETED
}
