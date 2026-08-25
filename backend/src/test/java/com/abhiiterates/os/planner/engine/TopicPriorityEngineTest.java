package com.abhiiterates.os.planner.engine;

import com.abhiiterates.os.academic.domain.Exam;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.AcademicGoalRepository;
import com.abhiiterates.os.academic.repository.ExamRepository;
import com.abhiiterates.os.academic.repository.TopicPrerequisiteRepository;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.planner.config.PlannerWeightProperties;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TopicPriorityEngineTest {

    @Mock
    private LearningStateService learningStateService;

    @Mock
    private AcademicGoalRepository goalRepository;

    @Mock
    private TopicPrerequisiteRepository prerequisiteRepository;

    @Mock
    private ExamRepository examRepository;

    @Spy
    private PlannerWeightProperties plannerProps = new PlannerWeightProperties();

    @InjectMocks
    private PriorityCalculator priorityCalculator;

    private User testUser;
    private UUID topic1Id;
    private UUID topic2Id;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(UUID.randomUUID()).email("student@example.com").build();
        topic1Id = UUID.randomUUID();
        topic2Id = UUID.randomUUID();
        plannerProps.validate();
    }

    @Test
    @DisplayName("WEAK state yields higher weakness factor than INSUFFICIENT_DATA or STRONG")
    void weakness_factor_calculation() {
        assertThat(priorityCalculator.computeWeaknessFactor(LearningState.WEAK)).isEqualTo(1.0);
        assertThat(priorityCalculator.computeWeaknessFactor(LearningState.INSUFFICIENT_DATA)).isEqualTo(0.6);
        assertThat(priorityCalculator.computeWeaknessFactor(LearningState.DEVELOPING)).isEqualTo(0.5);
        assertThat(priorityCalculator.computeWeaknessFactor(LearningState.STRONG)).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Exam urgency is computed only for associated exams and takes max urgency")
    void exam_urgency_calculation() {
        Exam urgentExam = Exam.builder()
                .title("OS Midterm")
                .examDate(LocalDate.now().plusDays(3))
                .build();
        Exam distantExam = Exam.builder()
                .title("Final Exam")
                .examDate(LocalDate.now().plusDays(40))
                .build();

        double urgency = priorityCalculator.computeExamUrgencyFactor(List.of(urgentExam, distantExam));
        assertThat(urgency).isEqualTo(1.0); // max of 1.0 and 0.1
    }

    @Test
    @DisplayName("High effort (>300 min) with WEAK performance triggers HighEffortLowPerformance flag")
    void high_effort_low_performance_detection() {
        LearningStateResult state = LearningStateResult.builder()
                .topicId(topic1Id)
                .state(LearningState.WEAK)
                .totalStudyMinutes(350)
                .recentAveragePercentage(40.0)
                .build();

        boolean isHighEffort = priorityCalculator.checkHighEffortLowPerformance(state);
        assertThat(isHighEffort).isTrue();
    }

    @Test
    @DisplayName("Calculate priorities orders topics deterministically by weighted rawScore")
    void calculate_priorities_deterministic_ordering() {
        LearningStateResult res1 = LearningStateResult.builder()
                .topicId(topic1Id)
                .topicName("Deadlocks")
                .subjectId(UUID.randomUUID())
                .subjectName("Operating Systems")
                .state(LearningState.WEAK)
                .trend(LearningTrend.DECLINING)
                .daysSinceLastStudied(15L)
                .totalStudyMinutes(120)
                .recentAveragePercentage(35.0)
                .build();

        LearningStateResult res2 = LearningStateResult.builder()
                .topicId(topic2Id)
                .topicName("Threads")
                .subjectId(UUID.randomUUID())
                .subjectName("Operating Systems")
                .state(LearningState.STRONG)
                .trend(LearningTrend.IMPROVING)
                .daysSinceLastStudied(1L)
                .totalStudyMinutes(200)
                .recentAveragePercentage(92.0)
                .build();

        when(learningStateService.getUserTopicsLearningState(any(), any(), any(), any(), any()))
                .thenReturn(List.of(res1, res2));
        when(goalRepository.findActiveGoalsForTopics(any(), any())).thenReturn(List.of());
        when(examRepository.findUpcomingExamsWithTopics(any(), any())).thenReturn(List.of());
        when(prerequisiteRepository.findAllByUserId(any())).thenReturn(List.of());

        List<TopicPriorityFactor> factors = priorityCalculator.calculateAll(testUser);

        assertThat(factors).hasSize(2);
        assertThat(factors.get(0).topicId()).isEqualTo(topic1Id);
        assertThat(factors.get(0).rawScore()).isGreaterThan(factors.get(1).rawScore());
    }
}
