package com.abhiiterates.os.planner.engine;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.StudySessionType;

import java.util.UUID;

/**
 * Immutable record holding all computed priority factors and recommended strategy for a single topic.
 * Each factor is normalized to the range [0.0, 1.0].
 * The {@code rawScore} is the final weighted sum.
 */
public record TopicPriorityFactor(
    UUID topicId,
    String topicName,
    UUID subjectId,
    String subjectName,

    /**
     * 1.0 = WEAK, 0.6 = INSUFFICIENT_DATA, 0.5 = DEVELOPING, 0.0 = STRONG.
     */
    double weaknessFactor,

    /**
     * Urgency from nearest upcoming exam associated with this topic.
     * 1.0 = 0-6 days, 0.7 = 7-14 days, 0.4 = 15-30 days, 0.1 = >30 days, 0.0 = no exam.
     */
    double examUrgencyFactor,

    /**
     * 1.0 = DECLINING, 0.5 = STABLE / INSUFFICIENT_DATA, 0.1 = IMPROVING.
     */
    double trendFactor,

    /**
     * Recency since last study session. 1.0 = > 14 days ago, 0.7 = never studied, 0.0 = studied today.
     */
    double recencyFactor,

    /**
     * Goal urgency: 1.0 = overdue / <= 7 days, 0.7 = <= 14 days, 0.4 = <= 30 days, 0.1 = > 30 days, 0.0 = no goal.
     */
    double goalUrgencyFactor,

    /**
     * Bounded prerequisite dependency factor (how many dependent topics are blocked or high priority). Range [0.0, 1.0].
     */
    double prerequisiteImportanceFactor,

    /**
     * Study neglect / inactivity gap factor. Range [0.0, 1.0].
     */
    double neglectFactor,

    /**
     * Final weighted score normalized in range [0.0, 1.0]. Higher = study sooner.
     */
    double rawScore,

    /**
     * Deterministic human-readable reason string explaining the score components.
     */
    String reason,

    /**
     * Current mastery state.
     */
    LearningState learningState,

    /**
     * Deterministically assigned study strategy (e.g. PRACTICE, REVISION, STUDY, etc.).
     */
    StudySessionType recommendedStrategy,

    /**
     * High effort (>300 min) with low performance (<50% accuracy) signal toggle.
     */
    boolean isHighEffortLowPerformance
) {}
