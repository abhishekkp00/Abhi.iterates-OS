package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.AcademicGoal;
import com.abhiiterates.os.academic.domain.GoalTargetState;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.AcademicDashboardResponse;
import com.abhiiterates.os.academic.dto.ExamRequest;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.AcademicGoalRepository;
import com.abhiiterates.os.academic.repository.StudySessionRepository;
import com.abhiiterates.os.assessment.repository.AssessmentAttemptRepository;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademicDashboardServiceImplTest {

    @Mock
    private StudyPlanRepository studyPlanRepository;
    @Mock
    private StudySessionRepository studySessionRepository;
    @Mock
    private LearningStateService learningStateService;
    @Mock
    private AcademicGoalRepository academicGoalRepository;
    @Mock
    private ExamService examService;
    @Mock
    private AssessmentAttemptRepository assessmentAttemptRepository;

    @InjectMocks
    private AcademicDashboardServiceImpl dashboardService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(UUID.randomUUID()).email("student@example.com").build();
    }

    @Test
    @DisplayName("getDashboard handles clean empty state for a new user with 0 records")
    void getDashboard_emptyUser() {
        when(studySessionRepository.findByUserAndStatusAndStartedAtBetweenOrderByStartedAtDesc(eq(user), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(studyPlanRepository.findActiveByUser(user))
                .thenReturn(Optional.empty());
        when(learningStateService.getUserTopicsLearningState(user, null, null, null, null))
                .thenReturn(Collections.emptyList());
        when(academicGoalRepository.findByUserAndIsActiveTrueOrderByTargetDateAsc(user))
                .thenReturn(Collections.emptyList());
        when(examService.getUserExams(user))
                .thenReturn(Collections.emptyList());
        when(assessmentAttemptRepository.findByUserOrderByStartedAtDesc(eq(user), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        AcademicDashboardResponse dashboard = dashboardService.getDashboard(user, "UTC");

        assertThat(dashboard).isNotNull();
        assertThat(dashboard.todaySummary().actualStudyMinutesToday()).isEqualTo(0);
        assertThat(dashboard.todaySummary().plannedMinutesToday()).isEqualTo(0);
        assertThat(dashboard.todaySummary().nextExamTitle()).isNull();
        assertThat(dashboard.planAdherence().adherencePercentage()).isEqualTo(0.0);
        assertThat(dashboard.learningStateSummary().totalTopics()).isEqualTo(0);
        assertThat(dashboard.weakTopics()).isEmpty();
        assertThat(dashboard.developingTopics()).isEmpty();
        assertThat(dashboard.upcomingExams()).isEmpty();
        assertThat(dashboard.goals()).isEmpty();
        assertThat(dashboard.studyActivity().totalStudyMinutes()).isEqualTo(0);
        assertThat(dashboard.recentAssessments()).isEmpty();
    }

    @Test
    @DisplayName("getDashboard correctly calculates plan adherence and metrics with active plan and data")
    void getDashboard_withActivePlanAndMetrics() {
        Topic topic = Topic.builder().id(UUID.randomUUID()).name("Deadlocks").build();
        Subject subject = Subject.builder().id(UUID.randomUUID()).name("OS").build();
        topic.setSubject(subject);

        PlannedStudySession s1 = PlannedStudySession.builder()
                .id(UUID.randomUUID())
                .topic(topic)
                .dayNumber(1)
                .recommendedMinutes(45)
                .priorityScore(0.9)
                .displayOrder(0)
                .isCompleted(true)
                .build();

        PlannedStudySession s2 = PlannedStudySession.builder()
                .id(UUID.randomUUID())
                .topic(topic)
                .dayNumber(1)
                .recommendedMinutes(30)
                .priorityScore(0.7)
                .displayOrder(1)
                .isCompleted(false)
                .build();

        StudyPlan activePlan = StudyPlan.builder()
                .id(UUID.randomUUID())
                .status(StudyPlanStatus.DRAFT)
                .planStartDate(LocalDate.now())
                .planEndDate(LocalDate.now().plusDays(6))
                .plannedSessions(List.of(s1, s2))
                .build();

        when(studySessionRepository.findByUserAndStatusAndStartedAtBetweenOrderByStartedAtDesc(eq(user), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(studyPlanRepository.findActiveByUser(user))
                .thenReturn(Optional.of(activePlan));

        LearningStateResult weakTopicResult = LearningStateResult.builder()
                .topicId(topic.getId())
                .topicName(topic.getName())
                .subjectId(subject.getId())
                .subjectName(subject.getName())
                .state(LearningState.WEAK)
                .recentAveragePercentage(42.0)
                .totalStudyMinutes(45)
                .build();

        when(learningStateService.getUserTopicsLearningState(user, null, null, null, null))
                .thenReturn(List.of(weakTopicResult));

        ExamRequest.Response examResp = ExamRequest.Response.builder()
                .id(UUID.randomUUID())
                .title("OS Midterm")
                .examDate(LocalDate.now().plusDays(5))
                .daysRemaining(5)
                .totalTopicsCount(4)
                .assessedTopicsCount(3)
                .assessmentCoveragePercentage(75.0)
                .build();

        when(examService.getUserExams(user)).thenReturn(List.of(examResp));

        AcademicGoal goal = AcademicGoal.builder()
                .id(UUID.randomUUID())
                .user(user)
                .topic(topic)
                .targetState(GoalTargetState.STRONG)
                .targetDate(LocalDate.now().plusDays(10))
                .isActive(true)
                .description("Master deadlocks")
                .build();

        when(academicGoalRepository.findByUserAndIsActiveTrueOrderByTargetDateAsc(user))
                .thenReturn(List.of(goal));
        when(assessmentAttemptRepository.findByUserOrderByStartedAtDesc(eq(user), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        AcademicDashboardResponse dashboard = dashboardService.getDashboard(user, java.time.ZoneId.systemDefault().getId());

        assertThat(dashboard.todaySummary().plannedMinutesToday()).isEqualTo(75);
        assertThat(dashboard.todaySummary().todaySessionCount()).isEqualTo(2);
        assertThat(dashboard.todaySummary().completedSessionCountToday()).isEqualTo(1);
        assertThat(dashboard.todaySummary().nextExamTitle()).isEqualTo("OS Midterm");
        assertThat(dashboard.todaySummary().daysToNextExam()).isEqualTo(5);

        assertThat(dashboard.planAdherence().totalPlannedSessions()).isEqualTo(2);
        assertThat(dashboard.planAdherence().completedPlannedSessions()).isEqualTo(1);
        assertThat(dashboard.planAdherence().adherencePercentage()).isEqualTo(50.0);

        assertThat(dashboard.learningStateSummary().weakCount()).isEqualTo(1);
        assertThat(dashboard.weakTopics()).hasSize(1);
        assertThat(dashboard.weakTopics().get(0).topicName()).isEqualTo("Deadlocks");

        assertThat(dashboard.upcomingExams()).hasSize(1);
        assertThat(dashboard.upcomingExams().get(0).assessmentCoveragePercentage()).isEqualTo(75.0);

        assertThat(dashboard.goals()).hasSize(1);
        assertThat(dashboard.goals().get(0).daysRemaining()).isEqualTo(10);
    }
}
