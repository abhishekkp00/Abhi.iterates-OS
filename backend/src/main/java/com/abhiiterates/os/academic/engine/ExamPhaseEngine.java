package com.abhiiterates.os.academic.engine;

import com.abhiiterates.os.academic.domain.ExamStudyPhase;

import java.time.LocalDate;

public interface ExamPhaseEngine {
    /**
     * Determines the global ExamStudyPhase based on exam date and reference date.
     */
    ExamStudyPhase determineGlobalPhase(LocalDate examDate, LocalDate currentDate);
}
