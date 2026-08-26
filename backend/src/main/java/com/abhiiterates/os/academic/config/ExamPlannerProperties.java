package com.abhiiterates.os.academic.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configurable thresholds and bounds for the Exam-Aware Revision Engine.
 */
@Component
@ConfigurationProperties(prefix = "academic.exam-planner")
@Getter @Setter
public class ExamPlannerProperties {

    private Phase phase = new Phase();
    private FinalReview finalReview = new FinalReview();
    private Prerequisite prerequisite = new Prerequisite();

    @Getter @Setter
    public static class Phase {
        private int learningDays = 21;
        private int practiceDays = 14;
        private int consolidationDays = 7;
        private int revisionDays = 3;
    }

    @Getter @Setter
    public static class FinalReview {
        private int maxSessionMinutes = 45;
    }

    @Getter @Setter
    public static class Prerequisite {
        private int maxDepth = 2;
    }

    @PostConstruct
    public void validate() {
        if (phase.getLearningDays() <= phase.getPracticeDays() ||
            phase.getPracticeDays() <= phase.getConsolidationDays() ||
            phase.getConsolidationDays() <= phase.getRevisionDays() ||
            phase.getRevisionDays() < 0) {
            throw new IllegalStateException("Invalid exam-planner phase threshold ordering! Must be learning > practice > consolidation > revision >= 0.");
        }
    }
}
