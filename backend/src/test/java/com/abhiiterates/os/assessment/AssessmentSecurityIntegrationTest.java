package com.abhiiterates.os.assessment;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.repository.AssessmentAttemptRepository;
import com.abhiiterates.os.assessment.repository.AssessmentRepository;
import com.abhiiterates.os.assessment.service.AssessmentAttemptService;
import com.abhiiterates.os.assessment.service.AssessmentService;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.exception.UnauthorizedException;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AssessmentSecurityIntegrationTest {

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
    private AssessmentService assessmentService;

    @Autowired
    private AssessmentAttemptService attemptService;

    private User userA;
    private User userB;

    private Subject subjectB;
    private Topic topicB;

    private CreateAssessmentRequest.Response assessmentB;
    private CreateQuestionRequest.OwnerResponse questionB;
    private AssessmentAttemptResponse attemptB;

    @BeforeEach
    void setUp() {
        userA = userRepository.save(User.builder()
                .username("userA_" + UUID.randomUUID().toString().substring(0, 8))
                .email("userA_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .passwordHash("password")
                .active(true)
                .build());

        userB = userRepository.save(User.builder()
                .username("userB_" + UUID.randomUUID().toString().substring(0, 8))
                .email("userB_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .passwordHash("password")
                .active(true)
                .build());

        subjectB = subjectRepository.save(Subject.builder().user(userB).name("User B Subject").build());
        topicB = topicRepository.save(Topic.builder().subject(subjectB).name("User B Topic").build());

        assessmentB = assessmentService.createAssessment(
                new CreateAssessmentRequest("User B Exam", "Private exam", subjectB.getId(), List.of(topicB.getId()), 45), userB);

        CreateQuestionOptionRequest opt1 = new CreateQuestionOptionRequest("Correct A", 1, true);
        CreateQuestionOptionRequest opt2 = new CreateQuestionOptionRequest("Wrong B", 2, false);

        questionB = assessmentService.addQuestion(assessmentB.id(),
                new CreateQuestionRequest(topicB.getId(), "User B Question?", QuestionType.MULTIPLE_CHOICE, QuestionDifficulty.EASY, 2.0, 1, List.of(opt1, opt2)), userB);

        assessmentService.publishAssessment(assessmentB.id(), userB);

        attemptB = attemptService.startAttempt(assessmentB.id(), userB);
    }

    @Test
    @DisplayName("SECURITY RULE: Student questions endpoint DOES NOT return isCorrect answer flag before submission")
    void getStudentQuestions_doesNotLeakIsCorrect() {
        List<CreateQuestionRequest.StudentResponse> questions = assessmentService.getStudentQuestions(assessmentB.id(), userA);

        assertThat(questions).hasSize(1);
        assertThat(questions.get(0).options()).hasSize(2);
        // Student option class has NO isCorrect field!
        assertThat(questions.get(0).options().get(0).optionText()).isEqualTo("Correct A");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT modify User B's draft/published assessment")
    void updateAssessment_userCannotModifyOtherUserAssessment() {
        CreateAssessmentRequest request = new CreateAssessmentRequest("Hacked Title", "Desc", null, null, 10);

        assertThatThrownBy(() -> assessmentService.updateAssessment(assessmentB.id(), request, userA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Assessment not found or access denied");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT view User B's assessment attempt results")
    void getAttemptById_userCannotAccessOtherUserAttempt() {
        assertThatThrownBy(() -> attemptService.getAttemptById(attemptB.id(), userA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Assessment attempt not found or access denied");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT submit User B's assessment attempt")
    void submitAttempt_userCannotSubmitOtherUserAttempt() {
        StudentAnswerRequest ans = new StudentAnswerRequest(questionB.id(), questionB.options().get(0).id());
        SubmitAssessmentAttemptRequest request = new SubmitAssessmentAttemptRequest(List.of(ans));

        assertThatThrownBy(() -> attemptService.submitAttempt(attemptB.id(), request, userA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Assessment attempt not found or access denied");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT view User B's topic performance record")
    void getTopicPerformance_userCannotAccessOtherUserPerformance() {
        assertThatThrownBy(() -> attemptService.getTopicPerformance(topicB.getId(), userA))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Topic not found or does not belong to authenticated user");
    }
}
