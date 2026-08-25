package com.abhiiterates.os.security;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.repository.*;
import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.repository.AssessmentAttemptRepository;
import com.abhiiterates.os.assessment.repository.AssessmentRepository;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.AuthResponse;
import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceStatus;
import com.abhiiterates.os.resource.ResourceRepository;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class IdorSecurityIntegrationTest {

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
    private ResourceRepository resourceRepository;

    private User userA;
    private User userB;

    private String tokenA;
    private String tokenB;

    private Subject subjectA;
    private Topic topicA;
    private Exam examA;
    private AcademicGoal goalA;
    private StudySession sessionA;
    private StudyPlan planA;
    private Assessment assessmentA;
    private Resource resourceA;

    @BeforeEach
    void setUp() {
        studyPlanRepository.deleteAll();
        studySessionRepository.deleteAll();
        academicGoalRepository.deleteAll();
        examRepository.deleteAll();
        assessmentAttemptRepository.deleteAll();
        assessmentRepository.deleteAll();
        resourceRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        RegisterRequest reqA = RegisterRequest.builder()
                .email("idorA_" + suffix + "@example.com")
                .username("idorA_" + suffix)
                .password("Password123!")
                .firstName("Idor")
                .lastName("A")
                .build();

        RegisterRequest reqB = RegisterRequest.builder()
                .email("idorB_" + suffix + "@example.com")
                .username("idorB_" + suffix)
                .password("Password123!")
                .firstName("Idor")
                .lastName("B")
                .build();

        authService.registerUser(reqA);
        authService.registerUser(reqB);

        AuthResponse authA = authService.login(new LoginRequest("idorA_" + suffix + "@example.com", "Password123!"), "127.0.0.1", "TestAgent");
        AuthResponse authB = authService.login(new LoginRequest("idorB_" + suffix + "@example.com", "Password123!"), "127.0.0.1", "TestAgent");

        tokenA = authA.getAccessToken();
        tokenB = authB.getAccessToken();

        userA = userRepository.findByEmail("idorA_" + suffix + "@example.com").orElseThrow();
        userB = userRepository.findByEmail("idorB_" + suffix + "@example.com").orElseThrow();

        // Populate entities owned strictly by User A
        subjectA = subjectRepository.save(Subject.builder()
                .user(userA)
                .name("Computer Networks")
                .code("CS401")
                .build());

        topicA = topicRepository.save(Topic.builder()
                .subject(subjectA)
                .name("TCP/IP Stack")
                .build());

        examA = examRepository.save(Exam.builder()
                .user(userA)
                .subject(subjectA)
                .title("CN Final Exam")
                .examDate(LocalDate.now().plusDays(10))
                .topics(Set.of(topicA))
                .build());

        goalA = academicGoalRepository.save(AcademicGoal.builder()
                .user(userA)
                .topic(topicA)
                .targetState(GoalTargetState.STRONG)
                .targetDate(LocalDate.now().plusDays(14))
                .description("Master TCP congestion control")
                .build());

        sessionA = studySessionRepository.save(StudySession.builder()
                .user(userA)
                .topic(topicA)
                .startedAt(Instant.now().minusSeconds(3600))
                .endedAt(Instant.now())
                .durationMinutes(60)
                .status(StudySessionStatus.COMPLETED)
                .sessionType(StudySessionType.STUDY)
                .build());

        planA = StudyPlan.builder()
                .user(userA)
                .status(StudyPlanStatus.ACTIVE)
                .planStartDate(LocalDate.now())
                .planEndDate(LocalDate.now().plusDays(6))
                .build();

        PlannedStudySession ps = PlannedStudySession.builder()
                .studyPlan(planA)
                .user(userA)
                .topic(topicA)
                .dayNumber(1)
                .recommendedMinutes(60)
                .priorityScore(0.85)
                .priorityReason("High priority topic")
                .sessionType(StudySessionType.STUDY)
                .build();
        planA.setPlannedSessions(List.of(ps));
        planA = studyPlanRepository.save(planA);

        assessmentA = assessmentRepository.save(Assessment.builder()
                .user(userA)
                .subject(subjectA)
                .title("Networking Fundamentals Draft")
                .status(AssessmentStatus.DRAFT)
                .build());

        resourceA = resourceRepository.save(Resource.builder()
                .user(userA)
                .title("Private CN Notes")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.MEDIUM)
                .status(ResourceStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("User B attempting to access User A's Exam receives HTTP 404 or 403 (IDOR Isolated)")
    void idor_exam_access_denied() {
        HttpHeaders headersB = new HttpHeaders();
        headersB.setBearerAuth(tokenB);

        ResponseEntity<ApiResponse<Void>> resp = restTemplate.exchange(
                "/api/v1/academic/exams/" + examA.getId(),
                HttpMethod.DELETE,
                new HttpEntity<>(headersB),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(resp.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("User B attempting to access User A's Study Plan receives HTTP 404 or 403 (IDOR Isolated)")
    void idor_study_plan_access_denied() {
        HttpHeaders headersB = new HttpHeaders();
        headersB.setBearerAuth(tokenB);

        ResponseEntity<ApiResponse<Void>> resp = restTemplate.exchange(
                "/api/v1/study-plans/" + planA.getId(),
                HttpMethod.GET,
                new HttpEntity<>(headersB),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(resp.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("User B attempting to access User A's Academic Goal receives HTTP 404 or 403 (IDOR Isolated)")
    void idor_goal_access_denied() {
        HttpHeaders headersB = new HttpHeaders();
        headersB.setBearerAuth(tokenB);

        ResponseEntity<ApiResponse<Void>> resp = restTemplate.exchange(
                "/api/v1/academic/goals/" + goalA.getId(),
                HttpMethod.DELETE,
                new HttpEntity<>(headersB),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(resp.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("User B attempting to access User A's Draft Assessment receives HTTP 404 or 403 (IDOR Isolated)")
    void idor_draft_assessment_access_denied() {
        HttpHeaders headersB = new HttpHeaders();
        headersB.setBearerAuth(tokenB);

        ResponseEntity<ApiResponse<Void>> resp = restTemplate.exchange(
                "/api/v1/assessments/" + assessmentA.getId(),
                HttpMethod.GET,
                new HttpEntity<>(headersB),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(resp.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("User B attempting to access User A's Resource receives HTTP 404 or 403 (IDOR Isolated)")
    void idor_resource_access_denied() {
        HttpHeaders headersB = new HttpHeaders();
        headersB.setBearerAuth(tokenB);

        ResponseEntity<ApiResponse<Void>> resp = restTemplate.exchange(
                "/api/v1/resources/" + resourceA.getId(),
                HttpMethod.GET,
                new HttpEntity<>(headersB),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(resp.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN);
    }
}
