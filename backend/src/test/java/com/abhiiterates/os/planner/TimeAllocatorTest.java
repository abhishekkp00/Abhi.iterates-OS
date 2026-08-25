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

class TimeAllocatorTest {

    @Mock private TopicRepository topicRepository;

    private PlannerWeightProperties props;
    private TimeAllocator allocator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        props = new PlannerWeightProperties();
        props.validate();
        allocator = new TimeAllocator(props, topicRepository);
    }

    @Test
    @DisplayName("WEAK topic with high urgency → session length clamped to maxMinutes")
    void sessionLength_weakHighUrgency_clampsToMax() {
        PlannerWeightProperties.Session cfg = props.getSession();
        TopicPriorityFactor factor = makeFactor(LearningState.WEAK, 1.0);
        int length = allocator.computeSessionLength(factor, cfg, 20, 60);
        assertThat(length).isLessThanOrEqualTo(60);
        assertThat(length).isGreaterThanOrEqualTo(20);
    }

    @Test
    @DisplayName("STRONG topic with low urgency → session length near base")
    void sessionLength_strongLowUrgency_nearBase() {
        PlannerWeightProperties.Session cfg = props.getSession();
        TopicPriorityFactor factor = makeFactor(LearningState.STRONG, 0.0);
        int length = allocator.computeSessionLength(factor, cfg, 20, 60);
        assertThat(length).isGreaterThanOrEqualTo(20);
        assertThat(length).isLessThanOrEqualTo(60);
    }

    @Test
    @DisplayName("All session lengths stay within bounds for all states")
    void sessionLength_alwaysWithinBounds() {
        PlannerWeightProperties.Session cfg = props.getSession();
        double[] urgencies = {0.0, 0.2, 0.5, 0.8, 1.0};
        LearningState[] states = LearningState.values();

        for (LearningState state : states) {
            for (double urgency : urgencies) {
                TopicPriorityFactor factor = makeFactor(state, urgency);
                int length = allocator.computeSessionLength(factor, cfg, 20, 60);
                assertThat(length)
                    .isGreaterThanOrEqualTo(20)
                    .isLessThanOrEqualTo(60);
            }
        }
    }

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
    }

    private TopicPriorityFactor makeFactor(LearningState state, double rawScore) {
        return makeFactor(UUID.randomUUID(), state, rawScore);
    }

    private TopicPriorityFactor makeFactor(UUID topicId, LearningState state, double rawScore) {
        return new TopicPriorityFactor(
            topicId, "Test Topic " + topicId.toString().substring(0, 4),
            UUID.randomUUID(), "Test Subject",
            0.5, 0.0, 0.5, 0.5, 0.0, 0.0, 0.5,
            rawScore, "Test reason [score: " + rawScore + "]",
            state, StudySessionType.STUDY, false
        );
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
