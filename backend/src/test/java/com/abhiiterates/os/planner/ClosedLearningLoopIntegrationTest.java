package com.abhiiterates.os.planner;

import com.abhiiterates.os.academic.domain.StudySessionType;
import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.StartStudySessionRequest;
import com.abhiiterates.os.academic.dto.StudySessionResponse;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.academic.service.StudySessionService;
import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import com.abhiiterates.os.assessment.domain.QuestionType;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.service.AssessmentAttemptService;
import com.abhiiterates.os.assessment.service.AssessmentService;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.planner.dto.GeneratePlanRequest;
import com.abhiiterates.os.planner.dto.PlannedStudySessionResponse;
import com.abhiiterates.os.planner.dto.StudyPlanResponse;
import com.abhiiterates.os.planner.service.StudyPlannerService;
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
class ClosedLearningLoopIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private SubjectRepository subjectRepository;
    @Autowired private TopicRepository topicRepository;
    @Autowired private StudyPlannerService plannerService;
    @Autowired private StudySessionService studySessionService;
    @Autowired private AssessmentService assessmentService;
    @Autowired private AssessmentAttemptService attemptService;

    private User userA;
    private User userB;
    private Subject subject;
    private Topic topic;
    private CreateAssessmentRequest.Response publishedAssessment;
    private CreateQuestionRequest.StudentResponse question1;
    private CreateQuestionRequest.StudentResponse question2;

    @BeforeEach
    void setUp() {
        userA = createUser("learning-loop-a@test.com");
        userB = createUser("learning-loop-b@test.com");

        subject = subjectRepository.save(Subject.builder()
                .user(userA).name("Operating Systems").color("#3B82F6").build());
        topic = topicRepository.save(Topic.builder()
                .subject(subject).name("Deadlocks & Synchronization").orderIndex(1).build());

        // Create Assessment
        CreateAssessmentRequest createAssessmentReq = new CreateAssessmentRequest(
                "Deadlocks Concept Check",
                "Assessment on Coffman conditions & Banker's algorithm",
                subject.getId(),
                List.of(topic.getId()),
                30
        );
        CreateAssessmentRequest.Response draftAssessment = assessmentService.createAssessment(createAssessmentReq, userA);

        // Add 2 questions to assessment
        CreateQuestionRequest q1Req = new CreateQuestionRequest(
                topic.getId(),
                "Which condition is NOT a Coffman condition for deadlock?",
                QuestionType.MULTIPLE_CHOICE,
                QuestionDifficulty.MEDIUM,
                1.0,
                1,
                List.of(
                        new CreateQuestionOptionRequest("Mutual Exclusion", 1, false),
                        new CreateQuestionOptionRequest("Hold and Wait", 2, false),
                        new CreateQuestionOptionRequest("Preemption Allowed", 3, true)
                )
        );
        assessmentService.addQuestion(draftAssessment.id(), q1Req, userA);

        CreateQuestionRequest q2Req = new CreateQuestionRequest(
                topic.getId(),
                "Banker's algorithm is used for deadlock avoidance.",
                QuestionType.MULTIPLE_CHOICE,
                QuestionDifficulty.EASY,
                1.0,
                2,
                List.of(
                        new CreateQuestionOptionRequest("True", 1, true),
                        new CreateQuestionOptionRequest("False", 2, false)
                )
        );
        assessmentService.addQuestion(draftAssessment.id(), q2Req, userA);

        publishedAssessment = assessmentService.publishAssessment(draftAssessment.id(), userA);
        List<CreateQuestionRequest.StudentResponse> questions = assessmentService.getStudentQuestions(publishedAssessment.id(), userA);
        question1 = questions.get(0);
        question2 = questions.get(1);
    }

    @Test
    @DisplayName("End-to-End Closed Learning Loop: PLAN -> STUDY -> ASSESS -> DETECT STALENESS -> REPLAN")
    void testEndToEndClosedLearningLoop() {
        // 1. Initial Assessment Attempt (Score: 0% -> WEAK state)
        AssessmentAttemptResponse attempt1 = attemptService.startAttempt(publishedAssessment.id(), userA);

        // Submit incorrect answers
        UUID q1OptionIncorrect = getOptionIdByOrder(publishedAssessment.id(), question1.id(), 1); // Mutual exclusion (incorrect)
        UUID q2OptionIncorrect = getOptionIdByOrder(publishedAssessment.id(), question2.id(), 2); // False (incorrect)

        SubmitAssessmentAttemptRequest submitReq1 = new SubmitAssessmentAttemptRequest(List.of(
                new StudentAnswerRequest(question1.id(), q1OptionIncorrect),
                new StudentAnswerRequest(question2.id(), q2OptionIncorrect)
        ));
        AssessmentAttemptResponse result1 = attemptService.submitAttempt(attempt1.id(), submitReq1, userA);
        assertThat(result1.percentage()).isEqualTo(0.0);

        // 2. Generate and Activate Study Plan
        GeneratePlanRequest planReq = new GeneratePlanRequest(120, 45, 7);
        StudyPlanResponse draftPlan = plannerService.saveDraftPlan(planReq, userA);
        StudyPlanResponse activePlan = plannerService.activatePlan(draftPlan.id(), userA);

        assertThat(activePlan.status()).isEqualTo(StudyPlanStatus.ACTIVE);
        assertThat(activePlan.needsReview()).isFalse();
        assertThat(activePlan.sessions()).isNotEmpty();

        PlannedStudySessionResponse plannedSession = activePlan.sessions().get(0);
        assertThat(plannedSession.topicId()).isEqualTo(topic.getId());
        assertThat(plannedSession.isCompleted()).isFalse();

        // 3. Start and Complete Actual Study Session linked to Planned Session
        StartStudySessionRequest startSessionReq = new StartStudySessionRequest(
                topic.getId(), plannedSession.id(), StudySessionType.STUDY, "Studying Banker's Algorithm"
        );
        StudySessionResponse actualSession = studySessionService.startSession(startSessionReq, userA);
        StudySessionResponse completedSession = studySessionService.completeSession(actualSession.id(), null, userA);

        assertThat(completedSession.status()).isEqualTo(com.abhiiterates.os.academic.domain.StudySessionStatus.COMPLETED);

        // Verify planned study session is updated with actual completion
        StudyPlanResponse reloadedPlan = plannerService.getPlan(activePlan.id(), userA);
        PlannedStudySessionResponse reloadedPlannedSession = reloadedPlan.sessions().get(0);
        assertThat(reloadedPlannedSession.isCompleted()).isTrue();
        assertThat(reloadedPlannedSession.actualMinutes()).isGreaterThanOrEqualTo(1);

        // 4. Submit 2nd Assessment Attempt (Score: 100% -> STRONG state)
        AssessmentAttemptResponse attempt2 = attemptService.startAttempt(publishedAssessment.id(), userA);

        UUID q1OptionCorrect = getOptionIdByOrder(publishedAssessment.id(), question1.id(), 3); // Preemption Allowed
        UUID q2OptionCorrect = getOptionIdByOrder(publishedAssessment.id(), question2.id(), 1); // True

        SubmitAssessmentAttemptRequest submitReq2 = new SubmitAssessmentAttemptRequest(List.of(
                new StudentAnswerRequest(question1.id(), q1OptionCorrect),
                new StudentAnswerRequest(question2.id(), q2OptionCorrect)
        ));
        AssessmentAttemptResponse result2 = attemptService.submitAttempt(attempt2.id(), submitReq2, userA);
        assertThat(result2.percentage()).isEqualTo(100.0);

        // 5. Verify Active Plan is marked needsReview = true with staleReason
        StudyPlanResponse planAfterAssessment = plannerService.getPlan(activePlan.id(), userA);
        assertThat(planAfterAssessment.needsReview()).isTrue();
        assertThat(planAfterAssessment.staleReason()).contains("Deadlocks");

        // 6. Regenerate Active Plan
        StudyPlanResponse regeneratedPlan = plannerService.regeneratePlan(planReq, userA);

        assertThat(regeneratedPlan.status()).isEqualTo(StudyPlanStatus.ACTIVE);
        assertThat(regeneratedPlan.needsReview()).isFalse();
        assertThat(regeneratedPlan.staleReason()).isNull();

        // Previous plan should be EXPIRED
        StudyPlanResponse previousPlanNow = plannerService.getPlan(activePlan.id(), userA);
        assertThat(previousPlanNow.status()).isEqualTo(StudyPlanStatus.EXPIRED);
    }

    private UUID getOptionIdByOrder(UUID assessmentId, UUID questionId, int optionOrder) {
        List<CreateQuestionRequest.OwnerResponse> ownerQuestions = assessmentService.getOwnerQuestions(assessmentId, userA);
        for (CreateQuestionRequest.OwnerResponse q : ownerQuestions) {
            if (q.id().equals(questionId)) {
                for (CreateQuestionOptionRequest.OwnerResponse opt : q.options()) {
                    if (opt.optionOrder() == optionOrder) {
                        return opt.id();
                    }
                }
            }
        }
        throw new IllegalStateException("Option not found for question " + questionId + " order " + optionOrder);
    }

    private User createUser(String email) {
        String username = email.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 4);
        return userRepository.save(User.builder()
                .email(email)
                .username(username)
                .firstName("Test")
                .lastName("User")
                .passwordHash("$2a$10$test")
                .emailVerified(true)
                .build());
    }
}
