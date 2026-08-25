package com.abhiiterates.os.planner.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configurable weight and threshold properties for the Adaptive Study Planner engine.
 * All values can be overridden in {@code application.yml} under the prefix
 * {@code academic.planner}.
 * <p>
 * Priority score formula:
 * <pre>
 *   rawScore = (weakness × weaknessWeight)
 *            + (examUrgency × examUrgencyWeight)
 *            + (trend × trendWeight)
 *            + (recency × recencyWeight)
 *            + (goalUrgency × goalUrgencyWeight)
 *            + (prerequisiteImportance × prerequisiteImportanceWeight)
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "academic.planner")
@Getter @Setter
public class PlannerWeightProperties {

    private Weights weights = new Weights();
    private Session session = new Session();
    private int planningHorizonDefaultDays = 7;

    @Getter @Setter
    public static class Weights {
        /** Weight of topic weakness (LearningState). Highest signal. */
        private double weakness = 0.35;
        /** Weight of upcoming assessment/exam urgency. */
        private double examUrgency = 0.20;
        /** Weight of learning trend (DECLINING is bad). */
        private double trend = 0.15;
        /** Weight of recency (how long since last studied). */
        private double recency = 0.10;
        /** Weight of academic goal deadline urgency. */
        private double goalUrgency = 0.10;
        /** Weight of prerequisite importance (how many dependents are blocked). */
        private double prerequisiteImportance = 0.10;
    }

    @Getter @Setter
    public static class Session {
        /** Minimum recommended session length in minutes. */
        private int minMinutes = 25;
        /** Maximum recommended session length in minutes. */
        private int maxMinutes = 90;
        /** Base session length for WEAK topics. */
        private int weakTopicBase = 60;
        /** Base session length for DEVELOPING topics. */
        private int developingTopicBase = 45;
        /** Base session length for STRONG or INSUFFICIENT_DATA topics. */
        private int strongTopicBase = 30;
    }

    @PostConstruct
    public void validate() {
        double total = weights.weakness + weights.examUrgency + weights.trend
                + weights.recency + weights.goalUrgency + weights.prerequisiteImportance;
        if (Math.abs(total - 1.0) > 0.001) {
            throw new IllegalStateException(
                String.format("Planner weight factors must sum to 1.0, but sum to %.4f. " +
                    "Check academic.planner.weights in application.yml", total));
        }
        if (session.minMinutes >= session.maxMinutes) {
            throw new IllegalStateException(
                "Planner session.min-minutes must be less than session.max-minutes");
        }
        if (planningHorizonDefaultDays < 1 || planningHorizonDefaultDays > 90) {
            throw new IllegalStateException(
                "Planner planning-horizon-default-days must be between 1 and 90");
        }
    }
}
