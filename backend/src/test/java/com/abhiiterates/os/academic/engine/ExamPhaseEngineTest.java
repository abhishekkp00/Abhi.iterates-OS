package com.abhiiterates.os.academic.engine;

import com.abhiiterates.os.academic.config.ExamPlannerProperties;
import com.abhiiterates.os.academic.domain.ExamStudyPhase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ExamPhaseEngineTest {

    private ExamPlannerProperties properties;
    private ExamPhaseEngine phaseEngine;

    @BeforeEach
    void setUp() {
        properties = new ExamPlannerProperties();
        properties.validate();
        phaseEngine = new ExamPhaseEngineImpl(properties);
    }

    @Test
    @DisplayName(">21 days remaining → LEARNING phase")
    void phase_learning() {
        LocalDate today = LocalDate.now();
        ExamStudyPhase phase = phaseEngine.determineGlobalPhase(today.plusDays(30), today);
        assertThat(phase).isEqualTo(ExamStudyPhase.LEARNING);
    }

    @Test
    @DisplayName("14-21 days remaining → PRACTICE phase")
    void phase_practice() {
        LocalDate today = LocalDate.now();
        ExamStudyPhase phase = phaseEngine.determineGlobalPhase(today.plusDays(18), today);
        assertThat(phase).isEqualTo(ExamStudyPhase.PRACTICE);
    }

    @Test
    @DisplayName("7-14 days remaining → CONSOLIDATION phase")
    void phase_consolidation() {
        LocalDate today = LocalDate.now();
        ExamStudyPhase phase = phaseEngine.determineGlobalPhase(today.plusDays(10), today);
        assertThat(phase).isEqualTo(ExamStudyPhase.CONSOLIDATION);
    }

    @Test
    @DisplayName("3-7 days remaining → REVISION phase")
    void phase_revision() {
        LocalDate today = LocalDate.now();
        ExamStudyPhase phase = phaseEngine.determineGlobalPhase(today.plusDays(5), today);
        assertThat(phase).isEqualTo(ExamStudyPhase.REVISION);
    }

    @Test
    @DisplayName("0-3 days remaining → FINAL_REVIEW phase")
    void phase_final_review() {
        LocalDate today = LocalDate.now();
        ExamStudyPhase phase = phaseEngine.determineGlobalPhase(today.plusDays(2), today);
        assertThat(phase).isEqualTo(ExamStudyPhase.FINAL_REVIEW);
    }

    @Test
    @DisplayName("Negative days remaining → EXAM_PASSED_DATE phase")
    void phase_exam_passed() {
        LocalDate today = LocalDate.now();
        ExamStudyPhase phase = phaseEngine.determineGlobalPhase(today.minusDays(1), today);
        assertThat(phase).isEqualTo(ExamStudyPhase.EXAM_PASSED_DATE);
    }
}
