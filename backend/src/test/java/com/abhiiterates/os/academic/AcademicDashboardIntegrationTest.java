package com.abhiiterates.os.academic;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.AcademicDashboardResponse;
import com.abhiiterates.os.academic.repository.*;
import com.abhiiterates.os.assessment.domain.Assessment;
import com.abhiiterates.os.assessment.domain.AssessmentAttempt;
import com.abhiiterates.os.assessment.domain.QuestionType;
import com.abhiiterates.os.assessment.repository.AssessmentAttemptRepository;
import com.abhiiterates.os.assessment.repository.AssessmentRepository;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.AuthResponse;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.academic.repository.LearningActivityRepository;
import com.abhiiterates.os.academic.repository.StudySessionRepository;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AcademicDashboardIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private LearningActivityRepository learningActivityRepository;

    @Autowired
    private AcademicGoalRepository academicGoalRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private StudyPlanRepository studyPlanRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentAttemptRepository assessmentAttemptRepository;

    @Autowired
    private TopicProgressRepository topicProgressRepository;

    private User userA;
    private User userB;

    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        studyPlanRepository.deleteAll();
        learningActivityRepository.deleteAll();
        studySessionRepository.deleteAll();
        academicGoalRepository.deleteAll();
        examRepository.deleteAll();
        assessmentAttemptRepository.deleteAll();
        assessmentRepository.deleteAll();
        topicProgressRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest reqA = RegisterRequest.builder()
                .email("userA_" + suffix + "@example.com")
                .username("userA_" + suffix)
                .password("Password123!")
                .firstName("User")
                .lastName("A")
                .build();

        RegisterRequest reqB = RegisterRequest.builder()
                .email("userB_" + suffix + "@example.com")
                .username("userB_" + suffix)
                .password("Password123!")
                .firstName("User")
                .lastName("B")
                .build();

        authService.registerUser(reqA);
        authService.registerUser(reqB);

        AuthResponse authA = authService.login(new com.abhiiterates.os.auth.dto.LoginRequest("userA_" + suffix + "@example.com", "Password123!"), "127.0.0.1", "TestAgent");
        AuthResponse authB = authService.login(new com.abhiiterates.os.auth.dto.LoginRequest("userB_" + suffix + "@example.com", "Password123!"), "127.0.0.1", "TestAgent");

        tokenA = authA.getAccessToken();
        tokenB = authB.getAccessToken();

        userA = userRepository.findByEmail("userA_" + suffix + "@example.com").orElseThrow();
        userB = userRepository.findByEmail("userB_" + suffix + "@example.com").orElseThrow();
    }

    @Test
    @DisplayName("GET /api/v1/academic/dashboard returns aggregated factual data for User A and enforces 100% IDOR isolation from User B")
    void dashboard_E2E_and_IDOR_isolation() {
        // 1. Create Academic Data for User A
        Subject subjectA = subjectRepository.save(Subject.builder()
                .user(userA)
                .name("Operating Systems")
                .code("CS301")
                .build());

        Topic topicA1 = topicRepository.save(Topic.builder()
                .subject(subjectA)
                .name("Deadlocks")
                .build());

        Topic topicA2 = topicRepository.save(Topic.builder()
                .subject(subjectA)
                .name("Processes")
                .build());

        // Study session completed today for User A
        studySessionRepository.save(StudySession.builder()
                .user(userA)
                .topic(topicA1)
                .startedAt(Instant.now().minusSeconds(3600))
                .endedAt(Instant.now())
                .durationMinutes(60)
                .status(StudySessionStatus.COMPLETED)
                .sessionType(StudySessionType.STUDY)
                .build());

        // Academic Goal for User A
        academicGoalRepository.save(AcademicGoal.builder()
                .user(userA)
                .topic(topicA1)
                .targetState(GoalTargetState.STRONG)
                .targetDate(LocalDate.now().plusDays(7))
                .description("Master deadlock detection")
                .build());

        // Exam for User A
        examRepository.save(Exam.builder()
                .user(userA)
                .subject(subjectA)
                .title("OS Midterm")
                .examDate(LocalDate.now().plusDays(5))
                .topics(Set.of(topicA1, topicA2))
                .build());

        StudyPlan planA = StudyPlan.builder()
                .user(userA)
                .status(StudyPlanStatus.ACTIVE)
                .planStartDate(LocalDate.now())
                .planEndDate(LocalDate.now().plusDays(6))
                .build();

        PlannedStudySession ps1 = PlannedStudySession.builder()
                .studyPlan(planA)
                .user(userA)
                .topic(topicA1)
                .dayNumber(1)
                .recommendedMinutes(45)
                .priorityScore(0.9)
                .priorityReason("Deadlocks is WEAK and OS Midterm is in 5 days")
                .sessionType(StudySessionType.STUDY)
                .isCompleted(true)
                .actualMinutes(60)
                .displayOrder(0)
                .build();

        PlannedStudySession ps2 = PlannedStudySession.builder()
                .studyPlan(planA)
                .user(userA)
                .topic(topicA2)
                .dayNumber(1)
                .recommendedMinutes(30)
                .priorityScore(0.7)
                .priorityReason("Prerequisite review")
                .sessionType(StudySessionType.STUDY)
                .isCompleted(false)
                .displayOrder(1)
                .build();

        planA.setPlannedSessions(List.of(ps1, ps2));
        studyPlanRepository.save(planA);

        // Assessment attempt for User A
        Assessment assessmentA = assessmentRepository.save(Assessment.builder()
                .title("Deadlocks Quiz")
                .subject(subjectA)
                .user(userA)
                .build());

        assessmentAttemptRepository.save(AssessmentAttempt.builder()
                .assessment(assessmentA)
                .user(userA)
                .percentage(85.0)
                .startedAt(Instant.now().minusSeconds(1800))
                .submittedAt(Instant.now().minusSeconds(300))
                .build());

        // 2. Fetch User A Dashboard
        HttpHeaders headersA = new HttpHeaders();
        headersA.setBearerAuth(tokenA);
        HttpEntity<Void> entityA = new HttpEntity<>(headersA);

        String sysTz = java.time.ZoneId.systemDefault().getId();
        ResponseEntity<ApiResponse<AcademicDashboardResponse>> respA = restTemplate.exchange(
                "/api/v1/academic/dashboard?timeZone=" + java.net.URLEncoder.encode(sysTz, java.nio.charset.StandardCharsets.UTF_8),
                HttpMethod.GET,
                entityA,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(respA.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(respA.getBody()).isNotNull();

        AcademicDashboardResponse dataA = respA.getBody().data();
        assertThat(dataA.todaySummary().actualStudyMinutesToday()).isEqualTo(60);
        assertThat(dataA.todaySummary().plannedMinutesToday()).isEqualTo(75);
        assertThat(dataA.todaySummary().todaySessionCount()).isEqualTo(2);
        assertThat(dataA.todaySummary().completedSessionCountToday()).isEqualTo(1);
        assertThat(dataA.todaySummary().nextExamTitle()).isEqualTo("OS Midterm");
        assertThat(dataA.todaySummary().daysToNextExam()).isIn(4L, 5L);

        assertThat(dataA.planAdherence().totalPlannedSessions()).isEqualTo(2);
        assertThat(dataA.planAdherence().completedPlannedSessions()).isEqualTo(1);
        assertThat(dataA.planAdherence().adherencePercentage()).isEqualTo(50.0);

        assertThat(dataA.upcomingExams()).hasSize(1);
        assertThat(dataA.goals()).hasSize(1);
        assertThat(dataA.recentAssessments()).hasSize(1);
        assertThat(dataA.recentAssessments().get(0).assessmentTitle()).isEqualTo("Deadlocks Quiz");

        // 3. Verify User B Dashboard returns 0 data from User A (100% IDOR isolation)
        HttpHeaders headersB = new HttpHeaders();
        headersB.setBearerAuth(tokenB);
        HttpEntity<Void> entityB = new HttpEntity<>(headersB);

        ResponseEntity<ApiResponse<AcademicDashboardResponse>> respB = restTemplate.exchange(
                "/api/v1/academic/dashboard?timeZone=UTC",
                HttpMethod.GET,
                entityB,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(respB.getStatusCode()).isEqualTo(HttpStatus.OK);
        AcademicDashboardResponse dataB = respB.getBody().data();

        assertThat(dataB.todaySummary().actualStudyMinutesToday()).isEqualTo(0);
        assertThat(dataB.todaySummary().plannedMinutesToday()).isEqualTo(0);
        assertThat(dataB.todaySummary().nextExamTitle()).isNull();
        assertThat(dataB.planAdherence().totalPlannedSessions()).isEqualTo(0);
        assertThat(dataB.upcomingExams()).isEmpty();
        assertThat(dataB.goals()).isEmpty();
        assertThat(dataB.recentAssessments()).isEmpty();
        assertThat(dataB.weakTopics()).isEmpty();

        assertThat(dataB.todaySummary().actualStudyMinutesToday()).isEqualTo(0);
        assertThat(dataB.todaySummary().plannedMinutesToday()).isEqualTo(0);
        assertThat(dataB.todaySummary().nextExamTitle()).isNull();
        assertThat(dataB.planAdherence().totalPlannedSessions()).isEqualTo(0);
        assertThat(dataB.upcomingExams()).isEmpty();
        assertThat(dataB.goals()).isEmpty();
        assertThat(dataB.recentAssessments()).isEmpty();
        assertThat(dataB.weakTopics()).isEmpty();
    }
}
