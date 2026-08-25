package com.abhiiterates.os.planner.engine;

import java.util.UUID;

/**
 * Immutable record holding all computed priority factors for a single topic.
 * Each factor is normalized to the range [0.0, 1.0].
 * The {@code rawScore} is the final weighted sum.
 * <p>
 * Used by {@link TimeAllocator} to produce {@link com.abhiiterates.os.planner.domain.PlannedStudySession}s.
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
     * Urgency from nearest upcoming assessment deadline.
     * 1.0 = < 3 days, 0.8 = < 7 days, 0.5 = < 14 days, 0.3 = < 30 days, 0.0 = ≥ 30 days.
     */
    double examUrgencyFactor,

    /**
     * 1.0 = DECLINING, 0.5 = STABLE, 0.1 = IMPROVING, 0.5 = INSUFFICIENT_DATA.
     */
    double trendFactor,

    /**
     * Recency since last study: 1.0 = > 14 days ago, 0.5 = ≤ 7 days, 0.0 = studied today.
     * Topics never studied before get 0.7 (moderate urgency — needs initial engagement).
     */
    double recencyFactor,

    /**
     * Goal urgency: 1.0 = goal deadline < 7 days, 0.7 = < 14 days, 0.4 = < 30 days, 0.0 = no goal.
     */
    double goalUrgencyFactor,

    /**
     * Fraction of dependent topics (topics that list this as a prerequisite) that are
     * WEAK or INSUFFICIENT_DATA. Range [0.0, 1.0].
     * If no dependents, value is 0.0.
     */
    double prerequisiteImportanceFactor,

    /**
     * Final weighted score. Range [0.0, 1.0]. Higher = study sooner.
     */
    double rawScore,

    /**
     * Human-readable explanation produced alongside the score.
     * E.g.: "WEAK mastery (recent avg: 42%), DECLINING trend, goal deadline in 5 days"
     */
    String reason,

    /**
     * The topic's current learning state — used by TimeAllocator for session length selection.
     */
    com.abhiiterates.os.academic.domain.LearningState learningState
) {}
