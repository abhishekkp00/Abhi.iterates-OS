package com.abhiiterates.os.planner;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.AcademicGoalRepository;
import com.abhiiterates.os.academic.repository.ExamRepository;
import com.abhiiterates.os.academic.repository.TopicPrerequisiteRepository;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.planner.config.PlannerWeightProperties;
import com.abhiiterates.os.planner.engine.PriorityCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class PriorityCalculatorTest {

    @Mock private LearningStateService learningStateService;
    @Mock private AcademicGoalRepository goalRepository;
    @Mock private TopicPrerequisiteRepository prerequisiteRepository;
    @Mock private ExamRepository examRepository;

    private PlannerWeightProperties props;
    private PriorityCalculator calculator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        props = new PlannerWeightProperties();
        props.validate();
        calculator = new PriorityCalculator(learningStateService, goalRepository, prerequisiteRepository, examRepository, props);
    }

    @Test
    @DisplayName("WEAK state → weakness factor = 1.0 (most urgent)")
    void weaknessFactor_weak() {
        assertThat(calculator.computeWeaknessFactor(LearningState.WEAK)).isEqualTo(1.0);
    }

    @Test
    @DisplayName("INSUFFICIENT_DATA state → weakness factor = 0.6 (needs engagement)")
    void weaknessFactor_insufficientData() {
        assertThat(calculator.computeWeaknessFactor(LearningState.INSUFFICIENT_DATA)).isEqualTo(0.6);
    }

    @Test
    @DisplayName("DEVELOPING state → weakness factor = 0.5")
    void weaknessFactor_developing() {
        assertThat(calculator.computeWeaknessFactor(LearningState.DEVELOPING)).isEqualTo(0.5);
    }

    @Test
    @DisplayName("STRONG state → weakness factor = 0.0")
    void weaknessFactor_strong() {
        assertThat(calculator.computeWeaknessFactor(LearningState.STRONG)).isEqualTo(0.0);
    }

    @Test
    @DisplayName("All 2 dependents WEAK → prerequisite importance = 1.0")
    void prerequisiteImportanceFactor_allWeak() {
        UUID depId1 = UUID.randomUUID();
        UUID depId2 = UUID.randomUUID();
        Map<UUID, LearningStateResult> states = Map.of(
            depId1, LearningStateResult.builder().topicId(depId1).state(LearningState.WEAK).build(),
            depId2, LearningStateResult.builder().topicId(depId2).state(LearningState.WEAK).build()
        );
        assertThat(calculator.computePrerequisiteImportanceFactor(
            List.of(depId1, depId2), states
        )).isEqualTo(1.0);
    }

    @Test
    @DisplayName("Default weights must sum to exactly 1.0")
    void defaultWeights_sumToOne() {
        PlannerWeightProperties.Weights w = props.getWeights();
        double sum = w.getWeakness() + w.getExamUrgency() + w.getTrend()
                   + w.getRecency() + w.getGoalUrgency() + w.getPrerequisiteImportance() + w.getNeglect();
        assertThat(sum).isCloseTo(1.0, within(0.0001));
    }
}
