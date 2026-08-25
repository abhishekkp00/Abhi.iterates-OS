package com.abhiiterates.os.planner.controller;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.AuthResponse;
import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.planner.dto.GeneratePlanRequest;
import com.abhiiterates.os.planner.dto.PlannedStudySessionResponse;
import com.abhiiterates.os.planner.dto.StudyPlanResponse;
import com.abhiiterates.os.planner.dto.TopicPriorityBreakdownResponse;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
import com.abhiiterates.os.planner.service.StudyPlannerService;
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

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AdaptiveLearningEngineIntegrationTest {

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
    private StudyPlanRepository planRepository;

    @Autowired
    private com.abhiiterates.os.planner.repository.PlannedStudySessionRepository plannedStudySessionRepository;

    @Autowired
    private com.abhiiterates.os.academic.repository.StudySessionRepository studySessionRepository;

    @Autowired
    private StudyPlannerService plannerService;

    private User testUser;
    private String token;
    private Subject subject;
    private Topic topic1;
    private Topic topic2;

    @BeforeEach
    void setUp() {
        plannedStudySessionRepository.deleteAll();
        studySessionRepository.deleteAll();
        planRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "engine_test_" + suffix + "@example.com";

        RegisterRequest regReq = RegisterRequest.builder()
                .email(email)
                .username("engine_user_" + suffix)
                .password("Password123!")
                .firstName("Engine")
                .lastName("Student")
                .build();

        authService.registerUser(regReq);
        AuthResponse auth = authService.login(new LoginRequest(email, "Password123!"), "127.0.0.1", "TestAgent");
        token = auth.getAccessToken();

        testUser = userRepository.findByEmail(email).orElseThrow();

        subject = subjectRepository.save(Subject.builder()
                .user(testUser)
                .name("Computer Systems")
                .code("CS101")
                .build());

        topic1 = topicRepository.save(Topic.builder()
                .subject(subject)
                .name("Memory Hierarchy")
                .build());

        topic2 = topicRepository.save(Topic.builder()
                .subject(subject)
                .name("Cache Memory")
                .build());
    }

    @Test
    @DisplayName("Generate draft plan, activate, and fetch priority breakdown")
    void full_planner_lifecycle_and_priority_breakdown() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);

        HttpEntity<GeneratePlanRequest> entity = new HttpEntity<>(req, headers);

        // 1. Save draft plan
        ResponseEntity<StudyPlanResponse> draftResp = restTemplate.exchange(
                "/api/v1/study-plans",
                HttpMethod.POST,
                entity,
                StudyPlanResponse.class
        );

        assertThat(draftResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(draftResp.getBody()).isNotNull();
        UUID planId = draftResp.getBody().id();
        assertThat(planId).isNotNull();

        // 2. Activate plan
        ResponseEntity<StudyPlanResponse> activateResp = restTemplate.exchange(
                "/api/v1/study-plans/" + planId + "/activate",
                HttpMethod.POST,
                new HttpEntity<>(headers),
                StudyPlanResponse.class
        );

        assertThat(activateResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(activateResp.getBody().status().name()).isEqualTo("ACTIVE");

        // 3. Fetch transparent priority breakdown
        ResponseEntity<List<TopicPriorityBreakdownResponse>> breakdownResp = restTemplate.exchange(
                "/api/v1/study-plans/" + planId + "/priority-breakdown",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(breakdownResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(breakdownResp.getBody()).isNotEmpty();
        assertThat(breakdownResp.getBody().get(0).rawScore()).isGreaterThanOrEqualTo(0.0);
    }
}
