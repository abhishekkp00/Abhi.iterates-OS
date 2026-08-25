package com.abhiiterates.os.reliability;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.CompleteStudySessionRequest;
import com.abhiiterates.os.academic.dto.StartStudySessionRequest;
import com.abhiiterates.os.academic.dto.StudySessionResponse;
import com.abhiiterates.os.academic.repository.LearningActivityRepository;
import com.abhiiterates.os.academic.repository.StudySessionRepository;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicProgressRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.academic.service.StudySessionService;
import com.abhiiterates.os.assessment.domain.Assessment;
import com.abhiiterates.os.assessment.domain.AssessmentStatus;
import com.abhiiterates.os.assessment.domain.Question;
import com.abhiiterates.os.assessment.domain.QuestionOption;
import com.abhiiterates.os.assessment.domain.QuestionType;
import com.abhiiterates.os.assessment.dto.AssessmentAttemptResponse;
import com.abhiiterates.os.assessment.dto.StudentAnswerRequest;
import com.abhiiterates.os.assessment.dto.SubmitAssessmentAttemptRequest;
import com.abhiiterates.os.assessment.repository.AssessmentAttemptRepository;
import com.abhiiterates.os.assessment.repository.AssessmentRepository;
import com.abhiiterates.os.assessment.repository.QuestionOptionRepository;
import com.abhiiterates.os.assessment.repository.QuestionRepository;
import com.abhiiterates.os.assessment.service.AssessmentAttemptService;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class ReliabilityFailureIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private TopicProgressRepository topicProgressRepository;

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private LearningActivityRepository learningActivityRepository;

    @Autowired
    private StudySessionService studySessionService;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionOptionRepository questionOptionRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private AssessmentAttemptService attemptService;

    @Autowired
    private com.abhiiterates.os.config.RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    private User testUser;
    private Topic topic;
    private Assessment assessment;
    private Question question;
    private QuestionOption option;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilter(requestIdFilter)
                .build();

        attemptRepository.deleteAll();
        questionOptionRepository.deleteAll();
        questionRepository.deleteAll();
        assessmentRepository.deleteAll();
        learningActivityRepository.deleteAll();
        studySessionRepository.deleteAll();
        topicProgressRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest regReq = RegisterRequest.builder()
                .email("reliability_" + suffix + "@example.com")
                .username("rel_user_" + suffix)
                .password("Password123!")
                .firstName("Reliability")
                .lastName("Tester")
                .build();

        authService.registerUser(regReq);
        testUser = userRepository.findByEmail(regReq.getEmail()).orElseThrow();

        Subject subject = new Subject(null, testUser, "Reliability Systems", "CS401", "Core OS Concepts", "#6366F1");
        subject = subjectRepository.save(subject);

        topic = new Topic(null, subject, "Fault Tolerance", "Fault Tolerance Concepts", 10);
        topic = topicRepository.save(topic);

        assessment = Assessment.builder()
                .user(testUser)
                .subject(subject)
                .title("Reliability Quiz")
                .status(AssessmentStatus.PUBLISHED)
                .questionCount(1)
                .build();
        assessment = assessmentRepository.save(assessment);

        question = Question.builder()
                .assessment(assessment)
                .questionText("What does idempotency guarantee?")
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .questionOrder(1)
                .marks(1.0)
                .build();
        question = questionRepository.save(question);

        option = QuestionOption.builder()
                .question(question)
                .optionText("Repeated identical requests produce identical side effects.")
                .optionOrder(1)
                .isCorrect(true)
                .build();
        option = questionOptionRepository.save(option);
    }

    @Test
    @DisplayName("Reliability: Correlation ID (X-Request-ID) header is auto-generated and returned in response")
    void testCorrelationIdHeaderGenerated() throws Exception {
        mockMvc.perform(get("/api/v1/academic/subjects"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Request-ID"));
    }

    @Test
    @DisplayName("Reliability: Study Session Completion is Idempotent on double-click re-submission")
    void testStudySessionCompletionIdempotency() {
        StartStudySessionRequest startReq = new StartStudySessionRequest();
        startReq.setTopicId(topic.getId());
        startReq.setSessionType(com.abhiiterates.os.academic.domain.StudySessionType.STUDY);

        StudySessionResponse started = studySessionService.startSession(startReq, testUser);
        assertNotNull(started.id());

        CompleteStudySessionRequest compReq = new CompleteStudySessionRequest();
        compReq.setNotes("Completed fault tolerance study.");

        // First completion
        StudySessionResponse firstComp = studySessionService.completeSession(started.id(), compReq, testUser);
        assertEquals(com.abhiiterates.os.academic.domain.StudySessionStatus.COMPLETED, firstComp.status());

        int initialProgressMinutes = topicProgressRepository.findByUserAndTopic(testUser, topic).map(p -> p.getTotalStudyMinutes()).orElse(0);

        // Second duplicate completion call (simulating user double-clicking or browser refresh)
        StudySessionResponse secondComp = studySessionService.completeSession(started.id(), compReq, testUser);
        assertEquals(com.abhiiterates.os.academic.domain.StudySessionStatus.COMPLETED, secondComp.status());

        int finalProgressMinutes = topicProgressRepository.findByUserAndTopic(testUser, topic).map(p -> p.getTotalStudyMinutes()).orElse(0);

        // Verify progress minutes were NOT doubled
        assertEquals(initialProgressMinutes, finalProgressMinutes, "Duplicate session completion must not re-increment progress minutes");
    }

    @Test
    @DisplayName("Reliability: Assessment Attempt Submission is Idempotent on double-click re-submission")
    void testAssessmentSubmissionIdempotency() {
        AssessmentAttemptResponse startedAttempt = attemptService.startAttempt(assessment.getId(), testUser);
        assertNotNull(startedAttempt.id());

        SubmitAssessmentAttemptRequest submitReq = new SubmitAssessmentAttemptRequest();
        submitReq.setAnswers(List.of(new StudentAnswerRequest(question.getId(), option.getId())));

        // First submission
        AssessmentAttemptResponse firstSub = attemptService.submitAttempt(startedAttempt.id(), submitReq, testUser);
        assertEquals("SUBMITTED", firstSub.status().name());
        assertEquals(100.0, firstSub.percentage());

        int initialAttemptCount = attemptRepository.findByUserAndAssessmentIdOrderByStartedAtDesc(testUser, assessment.getId()).size();

        // Second duplicate submission call (simulating user double-clicking submit button)
        AssessmentAttemptResponse secondSub = attemptService.submitAttempt(startedAttempt.id(), submitReq, testUser);
        assertEquals("SUBMITTED", secondSub.status().name());
        assertEquals(100.0, secondSub.percentage());

        int finalAttemptCount = attemptRepository.findByUserAndAssessmentIdOrderByStartedAtDesc(testUser, assessment.getId()).size();

        // Verify no duplicate attempt entity was persisted
        assertEquals(initialAttemptCount, finalAttemptCount, "Duplicate assessment submission must return existing result without creating duplicate attempts");
    }
}
