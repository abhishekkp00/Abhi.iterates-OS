package com.abhiiterates.os.planner.engine;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.StudySessionType;
import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.planner.config.PlannerWeightProperties;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimeAllocationEngineTest {

    @Mock
    private TopicRepository topicRepository;

    @Spy
    private PlannerWeightProperties plannerProps = new PlannerWeightProperties();

    @InjectMocks
    private TimeAllocator timeAllocator;

    private User testUser;
    private StudyPlan testPlan;
    private Topic topic1;
    private Topic topic2;
    private UUID t1Id;
    private UUID t2Id;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(UUID.randomUUID()).email("student@example.com").build();
        testPlan = StudyPlan.builder().id(UUID.randomUUID()).user(testUser).build();
        t1Id = UUID.randomUUID();
        t2Id = UUID.randomUUID();

        Subject sub = Subject.builder().id(UUID.randomUUID()).name("CS").user(testUser).build();
        topic1 = Topic.builder().id(t1Id).name("Deadlocks").subject(sub).build();
        topic2 = Topic.builder().id(t2Id).name("Processes").subject(sub).build();

        plannerProps.validate();
    }

    @Test
    @DisplayName("Allocate respects min and max session bounds and daily caps")
    void allocate_respects_bounds() {
        TopicPriorityFactor f1 = new TopicPriorityFactor(
                t1Id, "Deadlocks", topic1.getSubject().getId(), "CS",
                1.0, 0.8, 0.5, 0.5, 0.0, 0.0, 0.5, 0.85, "Weakness + exam", LearningState.WEAK, StudySessionType.PRACTICE, false
        );
        TopicPriorityFactor f2 = new TopicPriorityFactor(
                t2Id, "Processes", topic2.getSubject().getId(), "CS",
                0.5, 0.0, 0.1, 0.2, 0.0, 0.0, 0.1, 0.40, "Developing", LearningState.DEVELOPING, StudySessionType.STUDY, false
        );

        when(topicRepository.findById(t1Id)).thenReturn(Optional.of(topic1));
        when(topicRepository.findById(t2Id)).thenReturn(Optional.of(topic2));

        TimeAllocator.AllocationResult result = timeAllocator.allocate(
                List.of(f1, f2), List.of(t2Id, t1Id), testUser, testPlan, 120, 1, 45
        );

        assertThat(result.sessions()).isNotEmpty();
        for (PlannedStudySession s : result.sessions()) {
            assertThat(s.getRecommendedMinutes()).isGreaterThanOrEqualTo(20);
            assertThat(s.getRecommendedMinutes()).isLessThanOrEqualTo(60);
        }
        assertThat(result.totalPlannedMinutes()).isLessThanOrEqualTo(120);
    }

    @Test
    @DisplayName("Insufficient time allocates strictly to top priority topic without micro sessions")
    void insufficient_time_allocates_to_top_topic() {
        TopicPriorityFactor f1 = new TopicPriorityFactor(
                t1Id, "Deadlocks", topic1.getSubject().getId(), "CS",
                1.0, 0.9, 0.5, 0.5, 0.0, 0.0, 0.5, 0.90, "Urgent weakness", LearningState.WEAK, StudySessionType.PRACTICE, false
        );

        when(topicRepository.findById(t1Id)).thenReturn(Optional.of(topic1));

        TimeAllocator.AllocationResult result = timeAllocator.allocate(
                List.of(f1), List.of(t1Id), testUser, testPlan, 15, 1, 45
        );

        assertThat(result.sessions()).hasSize(1);
        assertThat(result.sessions().get(0).getRecommendedMinutes()).isEqualTo(15);
    }
}
