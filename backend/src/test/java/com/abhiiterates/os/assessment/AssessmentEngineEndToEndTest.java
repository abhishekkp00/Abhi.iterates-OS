package com.abhiiterates.os.assessment;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.repository.AssessmentAttemptRepository;
import com.abhiiterates.os.assessment.repository.AssessmentRepository;
import com.abhiiterates.os.assessment.repository.TopicAssessmentPerformanceRepository;
import com.abhiiterates.os.assessment.service.AssessmentAttemptService;
import com.abhiiterates.os.assessment.service.AssessmentService;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AssessmentEngineEndToEndTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private AssessmentService assessmentService;

    @Autowired
    private AssessmentAttemptService attemptService;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private TopicAssessmentPerformanceRepository topicPerformanceRepository;

    private User student;
    private Subject subject;
    private Topic topicDeadlocks;
    private Topic topicThreads;

    @BeforeEach
    void setUp() {
        student = userRepository.save(User.builder()
                .username("student_" + UUID.randomUUID().toString().substring(0, 8))
                .email("student_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .passwordHash("password")
                .active(true)
                .build());

        subject = subjectRepository.save(Subject.builder().user(student).name("Operating Systems").build());
        topicDeadlocks = topicRepository.save(Topic.builder().subject(subject).name("Deadlocks").build());
        topicThreads = topicRepository.save(Topic.builder().subject(subject).name("Threads").build());
    }

    @Test
    @DisplayName("End-to-End: Create Assessment -> Add Questions -> Publish -> Start Attempt -> Submit -> Verify Server-Calculated Score & Topic Performance")
    void endToEnd_fullAssessmentLifecycle() {
        // 1. Create Draft Assessment
        CreateAssessmentRequest createReq = new CreateAssessmentRequest(
                "OS Midterm Assessment", "Covers Deadlocks and Threads", subject.getId(), List.of(topicDeadlocks.getId(), topicThreads.getId()), 60);

        CreateAssessmentRequest.Response assessmentRes = assessmentService.createAssessment(createReq, student);
        assertThat(assessmentRes.status()).isEqualTo(AssessmentStatus.DRAFT);

        // 2. Add Question 1 (Deadlocks - 2.0 marks)
        CreateQuestionOptionRequest q1Opt1 = new CreateQuestionOptionRequest("Circular Wait condition", 1, true);
        CreateQuestionOptionRequest q1Opt2 = new CreateQuestionOptionRequest("Fast execution", 2, false);

        CreateQuestionRequest q1Req = new CreateQuestionRequest(
                topicDeadlocks.getId(), "What causes deadlock?", QuestionType.MULTIPLE_CHOICE, QuestionDifficulty.MEDIUM, 2.0, 1, List.of(q1Opt1, q1Opt2));

        CreateQuestionRequest.OwnerResponse q1Res = assessmentService.addQuestion(assessmentRes.id(), q1Req, student);

        // Add Question 2 (Threads - 3.0 marks)
        CreateQuestionOptionRequest q2Opt1 = new CreateQuestionOptionRequest("Shared address space", 1, true);
        CreateQuestionOptionRequest q2Opt2 = new CreateQuestionOptionRequest("Separate process space", 2, false);

        CreateQuestionRequest q2Req = new CreateQuestionRequest(
                topicThreads.getId(), "What do threads share?", QuestionType.MULTIPLE_CHOICE, QuestionDifficulty.EASY, 3.0, 2, List.of(q2Opt1, q2Opt2));

        CreateQuestionRequest.OwnerResponse q2Res = assessmentService.addQuestion(assessmentRes.id(), q2Req, student);

        // 3. Publish Assessment
        CreateAssessmentRequest.Response publishedRes = assessmentService.publishAssessment(assessmentRes.id(), student);
        assertThat(publishedRes.status()).isEqualTo(AssessmentStatus.PUBLISHED);
        assertThat(publishedRes.questionCount()).isEqualTo(2);

        // 4. Start Attempt
        AssessmentAttemptResponse attemptRes = attemptService.startAttempt(assessmentRes.id(), student);
        assertThat(attemptRes.status()).isEqualTo(AttemptStatus.IN_PROGRESS);

        // 5. Submit Answers (Q1 = Correct, Q2 = Incorrect)
        StudentAnswerRequest a1 = new StudentAnswerRequest(q1Res.id(), q1Res.options().get(0).id()); // Correct (2.0)
        StudentAnswerRequest a2 = new StudentAnswerRequest(q2Res.id(), q2Res.options().get(1).id()); // Incorrect (0.0)

        SubmitAssessmentAttemptRequest submitReq = new SubmitAssessmentAttemptRequest(List.of(a1, a2));
        AssessmentAttemptResponse resultRes = attemptService.submitAttempt(attemptRes.id(), submitReq, student);

        // 6. Verify Server-Side Score Calculation
        assertThat(resultRes.status()).isEqualTo(AttemptStatus.SUBMITTED);
        assertThat(resultRes.totalMarks()).isEqualTo(5.0);
        assertThat(resultRes.obtainedMarks()).isEqualTo(2.0);
        assertThat(resultRes.percentage()).isEqualTo(40.0);
        assertThat(resultRes.correctAnswersCount()).isEqualTo(1);

        // 7. Verify Database Persistence of Attempt
        AssessmentAttempt dbAttempt = attemptRepository.findById(attemptRes.id()).orElseThrow();
        assertThat(dbAttempt.getStatus()).isEqualTo(AttemptStatus.SUBMITTED);
        assertThat(dbAttempt.getObtainedMarks()).isEqualTo(2.0);

        // 8. Verify Topic Performance Records in Database for Deadlocks & Threads
        TopicPerformanceResponse deadlocksPerf = attemptService.getTopicPerformance(topicDeadlocks.getId(), student);
        assertThat(deadlocksPerf.totalQuestionsAttempted()).isEqualTo(1);
        assertThat(deadlocksPerf.totalQuestionsCorrect()).isEqualTo(1);
        assertThat(deadlocksPerf.averagePercentage()).isEqualTo(100.0);

        TopicPerformanceResponse threadsPerf = attemptService.getTopicPerformance(topicThreads.getId(), student);
        assertThat(threadsPerf.totalQuestionsAttempted()).isEqualTo(1);
        assertThat(threadsPerf.totalQuestionsCorrect()).isEqualTo(0);
        assertThat(threadsPerf.averagePercentage()).isEqualTo(0.0);
    }
}
