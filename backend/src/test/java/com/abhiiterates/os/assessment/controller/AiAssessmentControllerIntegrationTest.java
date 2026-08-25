package com.abhiiterates.os.assessment.controller;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.repository.AssessmentAttemptRepository;
import com.abhiiterates.os.assessment.repository.AssessmentRepository;
import com.abhiiterates.os.assessment.service.AiAssessmentGeneratorService;
import com.abhiiterates.os.assessment.service.AssessmentAttemptService;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.AuthResponse;
import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AiAssessmentControllerIntegrationTest {

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
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private AssessmentAttemptService attemptService;

    @MockBean
    private AiAssessmentGeneratorService generatorService;

    private User testUser;
    private String token;
    private Subject subject;
    private Topic topic;

    @BeforeEach
    void setUp() {
        attemptRepository.deleteAll();
        assessmentRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "ai_test_" + suffix + "@example.com";

        RegisterRequest regReq = RegisterRequest.builder()
                .email(email)
                .username("ai_user_" + suffix)
                .password("Password123!")
                .firstName("AI")
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

        topic = topicRepository.save(Topic.builder()
                .subject(subject)
                .name("Virtual Memory")
                .build());
    }

    @Test
    @DisplayName("Generate adaptive assessment via endpoint returns 201 CREATED with published assessment")
    void generate_adaptive_assessment_returns_created() {
        CreateAssessmentRequest.Response mockResponse = CreateAssessmentRequest.Response.builder()
                .id(UUID.randomUUID())
                .userId(testUser.getId())
                .subjectId(subject.getId())
                .subjectName(subject.getName())
                .title("Adaptive Test: Virtual Memory")
                .description("Blueprint adapted for WEAK topic")
                .status(AssessmentStatus.PUBLISHED)
                .questionCount(5)
                .durationMinutes(15)
                .topicIds(List.of(topic.getId()))
                .build();

        when(generatorService.generateAdaptiveAssessment(any(), any())).thenReturn(mockResponse);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        GenerateAdaptiveAssessmentRequest req = GenerateAdaptiveAssessmentRequest.builder()
                .topicId(topic.getId())
                .questionCount(5)
                .includeResources(true)
                .build();

        HttpEntity<GenerateAdaptiveAssessmentRequest> entity = new HttpEntity<>(req, headers);

        ResponseEntity<ApiResponse<CreateAssessmentRequest.Response>> resp = restTemplate.exchange(
                "/api/v1/assessments/generate",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().success()).isTrue();
        assertThat(resp.getBody().data().title()).isEqualTo("Adaptive Test: Virtual Memory");
        assertThat(resp.getBody().data().questionCount()).isEqualTo(5);
    }
}
