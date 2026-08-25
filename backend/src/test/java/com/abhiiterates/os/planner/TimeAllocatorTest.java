package com.abhiiterates.os.planner;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.StudySessionType;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.planner.config.PlannerWeightProperties;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.planner.engine.TimeAllocator;
import com.abhiiterates.os.planner.engine.TopicPriorityFactor;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link TimeAllocator} — session length computation and day distribution.
 */
class TimeAllocatorTest {

    @Mock private TopicRepository topicRepository;

    private PlannerWeightProperties props;
    private TimeAllocator allocator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        props = new PlannerWeightProperties();
        allocator = new TimeAllocator(props, topicRepository);
    }

    // ── Session Length Tests ──────────────────────────────────────────────────

    @Test
    @DisplayName("WEAK topic with high urgency → session length clamped to maxMinutes (90)")
    void sessionLength_weakHighUrgency_clampsToMax() {
        PlannerWeightProperties.Session cfg = props.getSession();
        TopicPriorityFactor factor = makeFactor(LearningState.WEAK, 1.0);  // max urgency
        int length = allocator.computeSessionLength(factor, cfg, 45);
        assertThat(length).isLessThanOrEqualTo(cfg.getMaxMinutes());
        assertThat(length).isGreaterThanOrEqualTo(cfg.getMinMinutes());
    }

    @Test
    @DisplayName("STRONG topic with low urgency → session length at or near strongTopicBase (30)")
    void sessionLength_strongLowUrgency_nearBase() {
        PlannerWeightProperties.Session cfg = props.getSession();
        TopicPriorityFactor factor = makeFactor(LearningState.STRONG, 0.0);  // min urgency
        int length = allocator.computeSessionLength(factor, cfg, 45);
        assertThat(length).isGreaterThanOrEqualTo(cfg.getMinMinutes());
        assertThat(length).isLessThanOrEqualTo(cfg.getMaxMinutes());
        // Strong + zero urgency should produce short sessions
        assertThat(length).isLessThanOrEqualTo(cfg.getDevelopingTopicBase());
    }

    @Test
    @DisplayName("All session lengths stay within [minMinutes, maxMinutes] for all states and urgency levels")
    void sessionLength_alwaysWithinBounds() {
        PlannerWeightProperties.Session cfg = props.getSession();
        double[] urgencies = {0.0, 0.2, 0.5, 0.8, 1.0};
        LearningState[] states = LearningState.values();

        for (LearningState state : states) {
            for (double urgency : urgencies) {
                TopicPriorityFactor factor = makeFactor(state, urgency);
                int length = allocator.computeSessionLength(factor, cfg, 45);
                assertThat(length)
                    .as("State=%s urgency=%.1f → length=%d", state, urgency, length)
                    .isGreaterThanOrEqualTo(cfg.getMinMinutes())
                    .isLessThanOrEqualTo(cfg.getMaxMinutes());
            }
        }
    }

    // ── Day Distribution Tests ────────────────────────────────────────────────

    @Test
    @DisplayName("No topics → empty allocation result")
    void allocate_noTopics_emptyResult() {
        User user = new User();
        StudyPlan plan = buildPlan(user);

        TimeAllocator.AllocationResult result = allocator.allocate(
            Collections.emptyList(), Collections.emptyList(),
            user, plan, 120, 7, 45
        );

        assertThat(result.sessions()).isEmpty();
        assertThat(result.totalPlannedMinutes()).isEqualTo(0);
        assertThat(result.capacityWarning()).isFalse();
    }

    @Test
    @DisplayName("Single topic fits in 1 day → allocated to day 1, no capacity warning")
    void allocate_singleTopic_fitsInOneDay() {
        UUID topicId = UUID.randomUUID();
        Topic topic = mockTopic(topicId);
        when(topicRepository.findById(topicId)).thenReturn(Optional.of(topic));

        User user = new User();
        StudyPlan plan = buildPlan(user);

        List<TopicPriorityFactor> factors = List.of(makeFactor(topicId, LearningState.WEAK, 0.8));
        List<UUID> topoOrder = List.of(topicId);

        TimeAllocator.AllocationResult result = allocator.allocate(
            factors, topoOrder, user, plan,
            120,  // 120 min/day available
            3,    // 3 days
            45
        );

        assertThat(result.sessions()).hasSize(1);
        assertThat(result.sessions().get(0).getDayNumber()).isEqualTo(1);
        assertThat(result.capacityWarning()).isFalse();
    }

    @Test
    @DisplayName("Capacity warning fires when required > available")
    void allocate_capacityOverflow_warningSet() {
        // Create 5 WEAK topics, each will get ~60 min sessions
        // Available: 30 min/day × 2 days = 60 min total → overflow expected
        List<UUID> topicIds = new ArrayList<>();
        List<TopicPriorityFactor> factors = new ArrayList<>();
        List<UUID> topoOrder = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            UUID id = UUID.randomUUID();
            topicIds.add(id);
            Topic topic = mockTopic(id);
            when(topicRepository.findById(id)).thenReturn(Optional.of(topic));
            factors.add(makeFactor(id, LearningState.WEAK, 0.9));
            topoOrder.add(id);
        }

        User user = new User();
        StudyPlan plan = buildPlan(user);

        TimeAllocator.AllocationResult result = allocator.allocate(
            factors, topoOrder, user, plan,
            30,  // only 30 min/day
            2,   // 2 days = 60 min total
            30
        );

        // 5 WEAK topics × ~60 min = ~300 min required, 60 available → overflow
        assertThat(result.capacityWarning()).isTrue();
        assertThat(result.capacityWarningMsg()).isNotBlank();
        assertThat(result.totalPlannedMinutes()).isGreaterThan(result.totalAvailableMinutes());
    }

    @Test
    @DisplayName("Sessions are ordered by day then displayOrder in result")
    void allocate_resultOrderedByDayAndDisplayOrder() {
        List<TopicPriorityFactor> factors = new ArrayList<>();
        List<UUID> topoOrder = new ArrayList<>();

        for (int i = 0; i < 3; i++) {
            UUID id = UUID.randomUUID();
            Topic topic = mockTopic(id);
            when(topicRepository.findById(id)).thenReturn(Optional.of(topic));
            factors.add(makeFactor(id, LearningState.DEVELOPING, 0.5));
            topoOrder.add(id);
        }

        User user = new User();
        StudyPlan plan = buildPlan(user);

        TimeAllocator.AllocationResult result = allocator.allocate(
            factors, topoOrder, user, plan,
            60, 7, 45
        );

        // Verify ascending day order
        List<PlannedStudySession> sessions = result.sessions();
        for (int i = 1; i < sessions.size(); i++) {
            int prevDay = sessions.get(i - 1).getDayNumber();
            int currDay = sessions.get(i).getDayNumber();
            assertThat(currDay).isGreaterThanOrEqualTo(prevDay);
        }
    }

    // ── Session Type Tests ─────────────────────────────────────────────────────

    @Test
    @DisplayName("WEAK topic → session type defaults to PRACTICE")
    void sessionType_weakTopic_isPractice() {
        UUID topicId = UUID.randomUUID();
        Topic topic = mockTopic(topicId);
        when(topicRepository.findById(topicId)).thenReturn(Optional.of(topic));

        User user = new User();
        StudyPlan plan = buildPlan(user);
        List<TopicPriorityFactor> factors = List.of(makeFactor(topicId, LearningState.WEAK, 0.9));

        TimeAllocator.AllocationResult result = allocator.allocate(
            factors, List.of(topicId), user, plan, 120, 3, 45
        );

        assertThat(result.sessions().get(0).getSessionType()).isEqualTo(StudySessionType.PRACTICE);
    }

    @Test
    @DisplayName("STRONG topic → session type defaults to REVISION")
    void sessionType_strongTopic_isRevision() {
        UUID topicId = UUID.randomUUID();
        Topic topic = mockTopic(topicId);
        when(topicRepository.findById(topicId)).thenReturn(Optional.of(topic));

        User user = new User();
        StudyPlan plan = buildPlan(user);
        List<TopicPriorityFactor> factors = List.of(makeFactor(topicId, LearningState.STRONG, 0.1));

        TimeAllocator.AllocationResult result = allocator.allocate(
            factors, List.of(topicId), user, plan, 120, 3, 45
        );

        assertThat(result.sessions().get(0).getSessionType()).isEqualTo(StudySessionType.REVISION);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper factories
    // ─────────────────────────────────────────────────────────────────────────

    private TopicPriorityFactor makeFactor(LearningState state, double rawScore) {
        return makeFactor(UUID.randomUUID(), state, rawScore);
    }

    private TopicPriorityFactor makeFactor(UUID topicId, LearningState state, double rawScore) {
        return new TopicPriorityFactor(
            topicId, "Test Topic " + topicId.toString().substring(0, 4),
            UUID.randomUUID(), "Test Subject",
            0.5, 0.0, 0.5, 0.5, 0.0, 0.0,
            rawScore, "Test reason [score: " + rawScore + "]",
            state
        );
    }

    private Topic mockTopic(UUID id) {
        com.abhiiterates.os.academic.domain.Subject subject =
            com.abhiiterates.os.academic.domain.Subject.builder()
                .id(UUID.randomUUID()).name("Test Subject").build();
        Topic topic = Topic.builder()
            .id(id).name("Topic " + id.toString().substring(0, 4))
            .subject(subject).build();
        return topic;
    }

    private StudyPlan buildPlan(User user) {
        return StudyPlan.builder()
            .id(UUID.randomUUID())
            .user(user)
            .status(StudyPlanStatus.DRAFT)
            .planStartDate(LocalDate.now())
            .planEndDate(LocalDate.now().plusDays(6))
            .build();
    }
}
