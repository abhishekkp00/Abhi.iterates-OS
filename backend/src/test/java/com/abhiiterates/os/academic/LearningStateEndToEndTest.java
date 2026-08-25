package com.abhiiterates.os.academic;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.academic.service.StudySessionService;
import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.dto.*;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LearningStateEndToEndTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private StudySessionService studySessionService;

    @Autowired
    private AssessmentService assessmentService;

    @Autowired
    private AssessmentAttemptService attemptService;

    @Autowired
    private LearningStateService learningStateService;

    private User student;
    private Subject subject;
    private Topic topic;

    @BeforeEach
    void setUp() {
        student = userRepository.save(User.builder()
                .username("student_" + UUID.randomUUID().toString().substring(0, 8))
                .email("student_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .passwordHash("password")
                .active(true)
                .build());

        subject = subjectRepository.save(Subject.builder().user(student).name("Computer Architecture").build());
        topic = topicRepository.save(Topic.builder().subject(subject).name("Cache Memory").build());
    }

    @Test
    @DisplayName("End-to-End: Study Sessions + Assessment Attempts -> Learning State Transition (INSUFFICIENT_DATA -> WEAK -> STRONG)")
    void endToEnd_learningStateTransition() {
        // 1. Initial State: No assessment attempts -> INSUFFICIENT_DATA
        LearningStateResult initialRes = learningStateService.getTopicLearningState(topic.getId(), student);
        assertThat(initialRes.state()).isEqualTo(LearningState.INSUFFICIENT_DATA);
        assertThat(initialRes.evidenceLevel()).isEqualTo(EvidenceLevel.LOW);
        assertThat(initialRes.reason()).contains("Not enough assessment attempts available");

        // 2. Record 2 Study Sessions (60 mins + 40 mins = 100 mins total)
        Instant now = Instant.now();
        studySessionService.createManualSession(new com.abhiiterates.os.academic.dto.ManualStudySessionRequest(
                topic.getId(), StudySessionType.STUDY, now.minusSeconds(3600), now, "Cache hit ratio study"), student);
        studySessionService.createManualSession(new com.abhiiterates.os.academic.dto.ManualStudySessionRequest(
                topic.getId(), StudySessionType.REVISION, now.minusSeconds(2400), now, "Cache mapping policy"), student);

        // 3. Create & Take Assessment 1 (Low Score: 40%)
        CreateAssessmentRequest createReq1 = new CreateAssessmentRequest("Cache Quiz 1", "Basics", subject.getId(), List.of(topic.getId()), 30);
        CreateAssessmentRequest.Response a1Res = assessmentService.createAssessment(createReq1, student);

        CreateQuestionOptionRequest opt1A = new CreateQuestionOptionRequest("L1 Cache", 1, true);
        CreateQuestionOptionRequest opt1B = new CreateQuestionOptionRequest("Hard Drive", 2, false);
        CreateQuestionRequest q1Req = new CreateQuestionRequest(topic.getId(), "Fastest memory?", QuestionType.MULTIPLE_CHOICE, QuestionDifficulty.EASY, 10.0, 1, List.of(opt1A, opt1B));
        CreateQuestionRequest.OwnerResponse q1Res = assessmentService.addQuestion(a1Res.id(), q1Req, student);
        assessmentService.publishAssessment(a1Res.id(), student);

        AssessmentAttemptResponse att1 = attemptService.startAttempt(a1Res.id(), student);
        attemptService.submitAttempt(att1.id(), new SubmitAssessmentAttemptRequest(List.of(new StudentAnswerRequest(q1Res.id(), q1Res.options().get(1).id()))), student); // 0%

        // Take Assessment 2 (Score: 40%)
        AssessmentAttemptResponse att2 = attemptService.startAttempt(a1Res.id(), student);
        attemptService.submitAttempt(att2.id(), new SubmitAssessmentAttemptRequest(List.of(new StudentAnswerRequest(q1Res.id(), q1Res.options().get(1).id()))), student); // 0%

        // 4. Verify WEAK State + Context Metrics (Study time = 100 mins, Attempt count = 2)
        LearningStateResult weakRes = learningStateService.getTopicLearningState(topic.getId(), student);
        assertThat(weakRes.state()).isEqualTo(LearningState.WEAK);
        assertThat(weakRes.totalStudyMinutes()).isEqualTo(100);
        assertThat(weakRes.studySessionCount()).isEqualTo(2);
        assertThat(weakRes.assessmentAttemptCount()).isEqualTo(2);
        assertThat(weakRes.evidenceLevel()).isEqualTo(EvidenceLevel.MEDIUM);
        assertThat(weakRes.reason()).contains("below the configured weak threshold");

        // 5. Take 3rd Assessment (100% score) -> State transitions to DEVELOPING (recent avg = (0+0+100)/3 = 33.3%? Wait: attempt 1=0, 2=0, 3=100 -> avg 33.3%; attempt 4=100 -> avg (0+100+100)/3 = 66.7% DEVELOPING)
        AssessmentAttemptResponse att3 = attemptService.startAttempt(a1Res.id(), student);
        attemptService.submitAttempt(att3.id(), new SubmitAssessmentAttemptRequest(List.of(new StudentAnswerRequest(q1Res.id(), q1Res.options().get(0).id()))), student); // 100%

        AssessmentAttemptResponse att4 = attemptService.startAttempt(a1Res.id(), student);
        attemptService.submitAttempt(att4.id(), new SubmitAssessmentAttemptRequest(List.of(new StudentAnswerRequest(q1Res.id(), q1Res.options().get(0).id()))), student); // 100%

        LearningStateResult devRes = learningStateService.getTopicLearningState(topic.getId(), student);
        assertThat(devRes.state()).isEqualTo(LearningState.DEVELOPING);

        // 6. Take 5th Assessment (100% score) -> Recent window = [100, 100, 100] = 100% -> State transitions to STRONG
        AssessmentAttemptResponse att5 = attemptService.startAttempt(a1Res.id(), student);
        attemptService.submitAttempt(att5.id(), new SubmitAssessmentAttemptRequest(List.of(new StudentAnswerRequest(q1Res.id(), q1Res.options().get(0).id()))), student); // 100%

        LearningStateResult strongRes = learningStateService.getTopicLearningState(topic.getId(), student);
        assertThat(strongRes.state()).isEqualTo(LearningState.STRONG);
        assertThat(strongRes.evidenceLevel()).isEqualTo(EvidenceLevel.HIGH);
        assertThat(strongRes.trend()).isEqualTo(LearningTrend.IMPROVING);
        assertThat(strongRes.reason()).contains("meets or exceeds the strong threshold");
    }
}
