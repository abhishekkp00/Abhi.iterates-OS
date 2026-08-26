package com.abhiiterates.os.academic.engine;

import com.abhiiterates.os.academic.config.ExamPlannerProperties;
import com.abhiiterates.os.academic.domain.ExamStudyPhase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class ExamPhaseEngineImpl implements ExamPhaseEngine {

    private final ExamPlannerProperties properties;

    @Override
    public ExamStudyPhase determineGlobalPhase(LocalDate examDate, LocalDate currentDate) {
        if (examDate == null) {
            return ExamStudyPhase.LEARNING;
        }

        LocalDate now = currentDate != null ? currentDate : LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(now, examDate);

        if (daysRemaining < 0) {
            return ExamStudyPhase.EXAM_PASSED_DATE;
        }

        ExamPlannerProperties.Phase p = properties.getPhase();

        if (daysRemaining > p.getLearningDays()) { // > 21
            return ExamStudyPhase.LEARNING;
        } else if (daysRemaining > p.getPracticeDays()) { // 14..21
            return ExamStudyPhase.PRACTICE;
        } else if (daysRemaining > p.getConsolidationDays()) { // 7..14
            return ExamStudyPhase.CONSOLIDATION;
        } else if (daysRemaining > p.getRevisionDays()) { // 3..7
            return ExamStudyPhase.REVISION;
        } else { // 0..3
            return ExamStudyPhase.FINAL_REVIEW;
        }
    }
}
