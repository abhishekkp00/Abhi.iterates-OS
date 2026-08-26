package com.abhiiterates.os.workflow;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.*;
import com.abhiiterates.os.academic.repository.*;
import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.repository.*;
import com.abhiiterates.os.auth.RefreshTokenRepository;
import com.abhiiterates.os.auth.UserSessionRepository;
import com.abhiiterates.os.auth.dto.AuthResponse;
import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.ai.AiConversationRepository;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.notification.repository.NotificationRepository;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.planner.dto.GeneratePlanRequest;
import com.abhiiterates.os.planner.dto.StudyPlanResponse;
import com.abhiiterates.os.planner.repository.PlannedStudySessionRepository;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class UserWorkflowIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private TopicProgressRepository topicProgressRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private PlannedStudySessionRepository plannedSessionRepository;

    @Autowired
    private StudyPlanRepository studyPlanRepository;

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private LearningActivityRepository learningActivityRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionOptionRepository questionOptionRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private AssessmentAnswerRepository answerRepository;

    @Autowired private AiConversationRepository aiConversationRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private UserSessionRepository userSessionRepository;

    private String token;
    private HttpHeaders headers;
    private String studentEmail;

    @BeforeEach
    void setUp() {
        // Clean teardown in reverse dependency order
        answerRepository.deleteAll();
        attemptRepository.deleteAll();
        questionOptionRepository.deleteAll();
        questionRepository.deleteAll();
        assessmentRepository.deleteAll();

        plannedSessionRepository.deleteAll();
        studyPlanRepository.deleteAll();
        learningActivityRepository.deleteAll();
        studySessionRepository.deleteAll();

        examRepository.deleteAll();
        topicProgressRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();

        aiConversationRepository.deleteAll();
        resourceRepository.deleteAll();
        notificationRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userSessionRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register & Login student
        studentEmail = "workflow_student_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        String username = "student_" + UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setFirstName("Workflow");
        registerReq.setLastName("Student");
        registerReq.setUsername(username);
        registerReq.setEmail(studentEmail);
        registerReq.setPassword("Password123!");

        restTemplate.postForEntity("/api/v1/auth/register", registerReq, ApiResponse.class);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail(studentEmail);
        loginReq.setPassword("Password123!");

        ResponseEntity<ApiResponse<AuthResponse>> loginResp = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(loginReq),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(loginResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResp.getBody()).isNotNull();
        token = loginResp.getBody().data().getAccessToken();

        headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
    }

    @Test
    @DisplayName("End-to-End Primary Closed-Loop Workflow: Subject → Topic → Plan → Study → Assess → Result → Replan")
    void primary_closed_loop_user_workflow() {
        // ── 1. Create Academic Subject & Topic via REST API ──────────────────
        SubjectRequest subjectReq = new SubjectRequest("Operating Systems", "CS301", "Core OS Concepts", "#4F46E5");
        ResponseEntity<SubjectRequest.Response> subjectResp = restTemplate.exchange(
                "/api/v1/academic/subjects",
                HttpMethod.POST,
                new HttpEntity<>(subjectReq, headers),
                SubjectRequest.Response.class
        );
        assertThat(subjectResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        SubjectRequest.Response subject = subjectResp.getBody();

        TopicRequest topicReq = new TopicRequest(subject.id(), "Virtual Memory & Paging", "Paging, TLB, Page Replacement", 1);
        ResponseEntity<TopicRequest.Response> topicResp = restTemplate.exchange(
                "/api/v1/academic/topics",
                HttpMethod.POST,
                new HttpEntity<>(topicReq, headers),
                TopicRequest.Response.class
        );
        assertThat(topicResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        TopicRequest.Response topic = topicResp.getBody();

        // ── 2. Create Exam Context via REST API ─────────────────────────────
        ExamRequest examReq = new ExamRequest("OS Midterm Exam", "Midterm exam", subject.id(), LocalDate.now().plusDays(6), List.of(topic.id()));
        ResponseEntity<ApiResponse<ExamRequest.Response>> examResp = restTemplate.exchange(
                "/api/v1/academic/exams",
                HttpMethod.POST,
                new HttpEntity<>(examReq, headers),
                new ParameterizedTypeReference<>() {}
        );
        assertThat(examResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        ExamRequest.Response exam = examResp.getBody().data();

        // ── 3. Generate Initial Exam-Aware Study Plan ─────────────────────────
        GeneratePlanRequest planReq = new GeneratePlanRequest(120, 45, 7, exam.id());
        ResponseEntity<StudyPlanResponse> draftPlanResp = restTemplate.exchange(
                "/api/v1/study-plans",
                HttpMethod.POST,
                new HttpEntity<>(planReq, headers),
                StudyPlanResponse.class
        );

        assertThat(draftPlanResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        StudyPlanResponse plan = draftPlanResp.getBody();
        assertThat(plan).isNotNull();
        assertThat(plan.sessions()).isNotEmpty();
        assertThat(plan.sessions().get(0).topicId().toString()).isEqualTo(topic.id().toString());

        // ── 4. Start & Complete Study Session ────────────────────────────────
        StartStudySessionRequest startSessionReq = new StartStudySessionRequest();
        startSessionReq.setTopicId(topic.id());
        startSessionReq.setSessionType(StudySessionType.STUDY);
        startSessionReq.setNotes("Studied Paging & Page Fault handling");

        ResponseEntity<StudySessionResponse> startResp = restTemplate.exchange(
                "/api/v1/study-sessions/start",
                HttpMethod.POST,
                new HttpEntity<>(startSessionReq, headers),
                StudySessionResponse.class
        );
        assertThat(startResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        StudySessionResponse activeSession = startResp.getBody();

        CompleteStudySessionRequest completeSessionReq = new CompleteStudySessionRequest();
        completeSessionReq.setNotes("Completed 45 minutes of page replacement exercises");

        ResponseEntity<StudySessionResponse> completeResp = restTemplate.exchange(
                "/api/v1/study-sessions/" + activeSession.id() + "/complete",
                HttpMethod.POST,
                new HttpEntity<>(completeSessionReq, headers),
                StudySessionResponse.class
        );
        assertThat(completeResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // ── 5. Create & Submit Assessment ────────────────────────────────────
        Assessment assessment = new Assessment();
        assessment.setTitle("Virtual Memory Assessment");
        assessment.setDescription("Test your knowledge on paging");
        assessment.setUser(userRepository.findByEmail(studentEmail).orElseThrow());
        assessment.setSubject(subjectRepository.findById(subject.id()).orElseThrow());
        assessment.getTopics().add(topicRepository.findById(topic.id()).orElseThrow());
        assessment.setStatus(AssessmentStatus.PUBLISHED);
        assessment.setQuestionCount(1);
        assessment = assessmentRepository.save(assessment);

        Question q1 = new Question();
        q1.setAssessment(assessment);
        q1.setQuestionText("What is the primary role of TLB in virtual memory?");
        q1.setMarks(10.0);
        q1.setQuestionOrder(1);
        q1 = questionRepository.save(q1);

        QuestionOption opt1 = new QuestionOption();
        opt1.setQuestion(q1);
        opt1.setOptionText("Cache page table translations to speed up address resolution");
        opt1.setOptionOrder(1);
        opt1.setIsCorrect(true);
        opt1 = questionOptionRepository.save(opt1);

        q1.getOptions().add(opt1);
        List<Question> questions = List.of(q1);

        // Start Attempt
        ResponseEntity<AssessmentAttemptResponse> startAttemptResp = restTemplate.exchange(
                "/api/v1/assessment-attempts/assessments/" + assessment.getId() + "/start",
                HttpMethod.POST,
                new HttpEntity<>(headers),
                AssessmentAttemptResponse.class
        );
        assertThat(startAttemptResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        AssessmentAttemptResponse attempt = startAttemptResp.getBody();

        // Submit Attempt with correct answers
        SubmitAssessmentAttemptRequest submitReq = new SubmitAssessmentAttemptRequest();
        java.util.List<com.abhiiterates.os.assessment.dto.StudentAnswerRequest> answers = new java.util.ArrayList<>();

        for (Question q : questions) {
            QuestionOption correctOpt = q.getOptions().stream().filter(QuestionOption::getIsCorrect).findFirst().orElseThrow();
            answers.add(new com.abhiiterates.os.assessment.dto.StudentAnswerRequest(q.getId(), correctOpt.getId()));
        }
        submitReq.setAnswers(answers);

        ResponseEntity<AssessmentAttemptResponse> submitAttemptResp = restTemplate.exchange(
                "/api/v1/assessment-attempts/" + attempt.id() + "/submit",
                HttpMethod.POST,
                new HttpEntity<>(submitReq, headers),
                AssessmentAttemptResponse.class
        );
        assertThat(submitAttemptResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        AssessmentAttemptResponse finishedAttempt = submitAttemptResp.getBody();
        assertThat(finishedAttempt.percentage()).isEqualTo(100.00);

        // ── 6. Verify Exam Coverage Report ───────────────────────────────────
        ResponseEntity<ApiResponse<ExamCoverageResponse>> coverageResp = restTemplate.exchange(
                "/api/v1/academic/exams/" + exam.id() + "/coverage",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );
        assertThat(coverageResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        ExamCoverageResponse coverage = coverageResp.getBody().data();
        assertThat(coverage.globalPhase()).isEqualTo(ExamStudyPhase.REVISION);
        assertThat(coverage.studyCoveragePercentage()).isGreaterThan(0);
        assertThat(coverage.assessmentCoveragePercentage()).isGreaterThanOrEqualTo(0.0);
    }
}
