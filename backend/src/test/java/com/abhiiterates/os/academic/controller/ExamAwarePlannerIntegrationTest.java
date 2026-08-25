package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.domain.Exam;
import com.abhiiterates.os.academic.domain.ExamStudyPhase;
import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.ExamCoverageResponse;
import com.abhiiterates.os.academic.repository.ExamRepository;
import com.abhiiterates.os.academic.repository.StudySessionRepository;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.AuthResponse;
import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.planner.dto.GeneratePlanRequest;
import com.abhiiterates.os.planner.dto.StudyPlanResponse;
import com.abhiiterates.os.planner.repository.PlannedStudySessionRepository;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ExamAwarePlannerIntegrationTest {

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
    private ExamRepository examRepository;

    @Autowired
    private StudyPlanRepository planRepository;

    @Autowired
    private PlannedStudySessionRepository plannedStudySessionRepository;

    @Autowired
    private StudySessionRepository studySessionRepository;

    private User testUser;
    private String token;
    private Subject subject;
    private Topic topic1;
    private Exam exam;

    @BeforeEach
    void setUp() {
        plannedStudySessionRepository.deleteAll();
        studySessionRepository.deleteAll();
        planRepository.deleteAll();
        examRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "exam_aware_" + suffix + "@example.com";

        RegisterRequest regReq = RegisterRequest.builder()
                .email(email)
                .username("exam_user_" + suffix)
                .password("Password123!")
                .firstName("Exam")
                .lastName("Student")
                .build();

        authService.registerUser(regReq);
        AuthResponse auth = authService.login(new LoginRequest(email, "Password123!"), "127.0.0.1", "TestAgent");
        token = auth.getAccessToken();

        testUser = userRepository.findByEmail(email).orElseThrow();

        subject = subjectRepository.save(Subject.builder()
                .user(testUser)
                .name("Operating Systems")
                .code("CS301")
                .build());

        topic1 = topicRepository.save(Topic.builder()
                .subject(subject)
                .name("Deadlocks")
                .build());

        exam = examRepository.save(Exam.builder()
                .user(testUser)
                .subject(subject)
                .title("OS Midterm Exam")
                .examDate(LocalDate.now().plusDays(5))
                .topics(Set.of(topic1))
                .build());
    }

    @Test
    @DisplayName("Fetch exam coverage and generate exam-focused study plan")
    void exam_aware_coverage_and_plan_generation() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        // 1. Fetch Exam Coverage
        ResponseEntity<com.abhiiterates.os.common.ApiResponse<ExamCoverageResponse>> coverageResp = restTemplate.exchange(
                "/api/v1/academic/exams/" + exam.getId() + "/coverage",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new org.springframework.core.ParameterizedTypeReference<>() {}
        );

        assertThat(coverageResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(coverageResp.getBody()).isNotNull();
        ExamCoverageResponse coverage = coverageResp.getBody().data();
        assertThat(coverage.globalPhase()).isEqualTo(ExamStudyPhase.REVISION);
        assertThat(coverage.daysRemaining()).isGreaterThanOrEqualTo(4L);
        assertThat(coverage.totalTopicsCount()).isEqualTo(1);

        // 2. Generate Exam-Aware Plan
        GeneratePlanRequest planReq = new GeneratePlanRequest(120, 45, 7, exam.getId());
        HttpEntity<GeneratePlanRequest> planEntity = new HttpEntity<>(planReq, headers);

        ResponseEntity<StudyPlanResponse> draftResp = restTemplate.exchange(
                "/api/v1/study-plans",
                HttpMethod.POST,
                planEntity,
                StudyPlanResponse.class
        );

        assertThat(draftResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(draftResp.getBody()).isNotNull();
        StudyPlanResponse planResp = draftResp.getBody();
        assertThat(planResp.sessions()).isNotEmpty();
        assertThat(planResp.sessions().get(0).priorityReason()).contains("OS Midterm Exam exam in");
    }
}
