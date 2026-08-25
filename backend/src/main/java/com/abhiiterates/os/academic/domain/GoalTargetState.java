package com.abhiiterates.os.academic.domain;

/**
 * The target mastery level a student aims to reach for a topic.
 * Used in {@link AcademicGoal}.
 */
public enum GoalTargetState {

    /**
     * Student aims to consistently score ≥ 85% (STRONG mastery).
     */
    STRONG,

    /**
     * Student aims to consistently score ≥ 75% (DEVELOPING mastery).
     */
    DEVELOPING
}
