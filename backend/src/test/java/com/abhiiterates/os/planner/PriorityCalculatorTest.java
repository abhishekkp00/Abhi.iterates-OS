package com.abhiiterates.os.planner;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.academic.repository.AcademicGoalRepository;
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

/**
 * Unit tests for {@link PriorityCalculator} individual factor computations.
 * All dependencies are mocked — no database involved.
 */
class PriorityCalculatorTest {

    @Mock private LearningStateService learningStateService;
    @Mock private AcademicGoalRepository goalRepository;
    @Mock private TopicPrerequisiteRepository prerequisiteRepository;

    private PlannerWeightProperties props;
    private PriorityCalculator calculator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        props = new PlannerWeightProperties();
        // Default weights (from @Builder.Default values) already sum to 1.0
        calculator = new PriorityCalculator(learningStateService, goalRepository, prerequisiteRepository, props);
    }

    // ── Weakness Factor Tests ─────────────────────────────────────────────────

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
    @DisplayName("STRONG state → weakness factor = 0.0 (not urgent)")
    void weaknessFactor_strong() {
        assertThat(calculator.computeWeaknessFactor(LearningState.STRONG)).isEqualTo(0.0);
    }

    // ── Trend Factor Tests ────────────────────────────────────────────────────

    @Test
    @DisplayName("DECLINING trend → trend factor = 1.0 (intervention needed)")
    void trendFactor_declining() {
        assertThat(calculator.computeTrendFactor(LearningTrend.DECLINING)).isEqualTo(1.0);
    }

    @Test
    @DisplayName("IMPROVING trend → trend factor = 0.1 (momentum is good, less urgent)")
    void trendFactor_improving() {
        assertThat(calculator.computeTrendFactor(LearningTrend.IMPROVING)).isEqualTo(0.1);
    }

    @Test
    @DisplayName("STABLE trend → trend factor = 0.5 (neutral)")
    void trendFactor_stable() {
        assertThat(calculator.computeTrendFactor(LearningTrend.STABLE)).isEqualTo(0.5);
    }

    // ── Recency Factor Tests ──────────────────────────────────────────────────

    @Test
    @DisplayName("Never studied → recency factor = 0.7 (initial engagement needed)")
    void recencyFactor_neverStudied() {
        assertThat(calculator.computeRecencyFactor(null)).isEqualTo(0.7);
    }

    @Test
    @DisplayName("Studied today → recency factor = 0.0")
    void recencyFactor_today() {
        assertThat(calculator.computeRecencyFactor(0L)).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Studied 1 day ago → recency factor = 0.1")
    void recencyFactor_oneDayAgo() {
        assertThat(calculator.computeRecencyFactor(1L)).isEqualTo(0.1);
    }

    @Test
    @DisplayName("Studied 3 days ago → recency factor = 0.3")
    void recencyFactor_threeDaysAgo() {
        assertThat(calculator.computeRecencyFactor(3L)).isEqualTo(0.3);
    }

    @Test
    @DisplayName("Studied 7 days ago → recency factor = 0.5")
    void recencyFactor_sevenDaysAgo() {
        assertThat(calculator.computeRecencyFactor(7L)).isEqualTo(0.5);
    }

    @Test
    @DisplayName("Studied 14 days ago → recency factor = 0.7")
    void recencyFactor_fourteenDaysAgo() {
        assertThat(calculator.computeRecencyFactor(14L)).isEqualTo(0.7);
    }

    @Test
    @DisplayName("Studied 20 days ago → recency factor = 1.0 (maximum urgency)")
    void recencyFactor_twentyDaysAgo() {
        assertThat(calculator.computeRecencyFactor(20L)).isEqualTo(1.0);
    }

    // ── Goal Urgency Factor Tests ─────────────────────────────────────────────

    @Test
    @DisplayName("No active goal → goal urgency factor = 0.0")
    void goalUrgencyFactor_noGoal() {
        assertThat(calculator.computeGoalUrgencyFactor(null)).isEqualTo(0.0);
    }

    // ── Prerequisite Importance Factor Tests ──────────────────────────────────

    @Test
    @DisplayName("No dependents → prerequisite importance = 0.0")
    void prerequisiteImportanceFactor_noDependents() {
        assertThat(calculator.computePrerequisiteImportanceFactor(
            Collections.emptyList(), Collections.emptyMap()
        )).isEqualTo(0.0);
    }

    @Test
    @DisplayName("All 2 dependents WEAK → prerequisite importance = 1.0")
    void prerequisiteImportanceFactor_allWeak() {
        UUID depId1 = UUID.randomUUID();
        UUID depId2 = UUID.randomUUID();
        Map<UUID, LearningState> states = Map.of(
            depId1, LearningState.WEAK,
            depId2, LearningState.WEAK
        );
        assertThat(calculator.computePrerequisiteImportanceFactor(
            List.of(depId1, depId2), states
        )).isEqualTo(1.0);
    }

    @Test
    @DisplayName("Half dependents WEAK → prerequisite importance = 0.5")
    void prerequisiteImportanceFactor_halfWeak() {
        UUID weakId  = UUID.randomUUID();
        UUID strongId = UUID.randomUUID();
        Map<UUID, LearningState> states = Map.of(
            weakId, LearningState.WEAK,
            strongId, LearningState.STRONG
        );
        assertThat(calculator.computePrerequisiteImportanceFactor(
            List.of(weakId, strongId), states
        )).isEqualTo(0.5);
    }

    @Test
    @DisplayName("INSUFFICIENT_DATA dependents count as blocked")
    void prerequisiteImportanceFactor_insufficientDataCounts() {
        UUID insId = UUID.randomUUID();
        Map<UUID, LearningState> states = Map.of(insId, LearningState.INSUFFICIENT_DATA);
        assertThat(calculator.computePrerequisiteImportanceFactor(
            List.of(insId), states
        )).isEqualTo(1.0);
    }

    // ── Weight Sum Invariant ───────────────────────────────────────────────────

    @Test
    @DisplayName("Default weights must sum to exactly 1.0")
    void defaultWeights_sumToOne() {
        PlannerWeightProperties.Weights w = props.getWeights();
        double sum = w.getWeakness() + w.getExamUrgency() + w.getTrend()
                   + w.getRecency() + w.getGoalUrgency() + w.getPrerequisiteImportance();
        assertThat(sum).isCloseTo(1.0, within(0.0001));
    }
}
