package com.abhiiterates.os.planner.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configurable weight, session bounds, and engine thresholds for the Adaptive Study Planner engine.
 * All values can be overridden in {@code application.yml} under the prefix {@code academic.planner}.
 *
 * Priority score formula:
 * <pre>
 *   rawScore = (weakness × weaknessWeight)
 *            + (examUrgency × examUrgencyWeight)
 *            + (trend × trendWeight)
 *            + (recency × recencyWeight)
 *            + (goalUrgency × goalUrgencyWeight)
 *            + (prerequisiteImportance × prerequisiteImportanceWeight)
 *            + (neglect × neglectWeight)
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "academic.planner")
@Getter @Setter
public class PlannerWeightProperties {

    private Weights weights = new Weights();
    private Session session = new Session();
    private Engine engine = new Engine();
    private int planningHorizonDefaultDays = 7;

    @Getter @Setter
    public static class Weights {
        /** Weight of topic weakness (LearningState). */
        private double weakness = 0.30;
        /** Weight of upcoming assessment/exam urgency. */
        private double examUrgency = 0.20;
        /** Weight of learning trend (DECLINING is urgent). */
        private double trend = 0.15;
        /** Weight of recency (how long since last studied). */
        private double recency = 0.10;
        /** Weight of academic goal deadline urgency. */
        private double goalUrgency = 0.10;
        /** Weight of prerequisite importance (blocking dependent topics). */
        private double prerequisiteImportance = 0.10;
        /** Weight of study neglect / inactivity gap. */
        private double neglect = 0.05;
    }

    @Getter @Setter
    public static class Session {
        /** Minimum recommended session length in minutes (default 20 min). */
        private int minMinutes = 20;
        /** Maximum recommended session length in minutes (default 60 min). */
        private int maxMinutes = 60;
        /** Maximum daily study minutes (default 240 min = 4 hours). */
        private int maxDailyMinutes = 240;
        /** Base session length for WEAK topics. */
        private int weakTopicBase = 45;
        /** Base session length for DEVELOPING topics. */
        private int developingTopicBase = 35;
        /** Base session length for STRONG or INSUFFICIENT_DATA topics. */
        private int strongTopicBase = 25;
    }

    @Getter @Setter
    public static class Engine {
        /** Max depth for prerequisite dependency propagation (default 2). */
        private int maxPrerequisiteDepth = 2;
        /** Priority score delta threshold required to trigger major plan reallocation (default 0.10 = 10%). */
        private double stabilityThreshold = 0.10;
        /** Accumulated study minutes threshold for high-effort/low-performance detection (default 300 min). */
        private int highEffortMinutesThreshold = 300;
    }

    @PostConstruct
    public void validate() {
        double total = weights.weakness + weights.examUrgency + weights.trend
                + weights.recency + weights.goalUrgency + weights.prerequisiteImportance + weights.neglect;
        if (Math.abs(total - 1.0) > 0.001) {
            throw new IllegalStateException(
                String.format("Planner weight factors must sum to 1.0, but sum to %.4f. " +
                    "Check academic.planner.weights in application.yml", total));
        }
        if (weights.weakness < 0 || weights.examUrgency < 0 || weights.trend < 0
                || weights.recency < 0 || weights.goalUrgency < 0 || weights.prerequisiteImportance < 0 || weights.neglect < 0) {
            throw new IllegalStateException("Planner weight factors must all be non-negative.");
        }
        if (session.minMinutes >= session.maxMinutes) {
            throw new IllegalStateException("Planner session.min-minutes must be less than session.max-minutes");
        }
        if (session.maxDailyMinutes < session.minMinutes) {
            throw new IllegalStateException("Planner session.max-daily-minutes must be at least session.min-minutes");
        }
        if (planningHorizonDefaultDays < 1 || planningHorizonDefaultDays > 90) {
            throw new IllegalStateException("Planner planning-horizon-default-days must be between 1 and 90");
        }
    }
}
