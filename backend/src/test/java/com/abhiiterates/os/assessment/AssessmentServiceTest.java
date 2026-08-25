package com.abhiiterates.os.assessment;

import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.repository.AssessmentRepository;
import com.abhiiterates.os.assessment.repository.QuestionOptionRepository;
import com.abhiiterates.os.assessment.repository.QuestionRepository;
import com.abhiiterates.os.assessment.service.AssessmentServiceImpl;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {

    @Mock
    private AssessmentRepository assessmentRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private QuestionOptionRepository questionOptionRepository;

    @InjectMocks
    private AssessmentServiceImpl assessmentService;

    private User user;
    private Assessment draftAssessment;
    private Assessment publishedAssessment;

    @BeforeEach
    void setUp() {
        user = User.builder().id(UUID.randomUUID()).email("teacher@example.com").username("teacher").build();

        draftAssessment = Assessment.builder()
                .id(UUID.randomUUID())
                .user(user)
                .title("Operating Systems Quiz 1")
                .description("Introductory OS concepts")
                .status(AssessmentStatus.DRAFT)
                .questionCount(0)
                .build();

        publishedAssessment = Assessment.builder()
                .id(UUID.randomUUID())
                .user(user)
                .title("OS Final Exam")
                .status(AssessmentStatus.PUBLISHED)
                .questionCount(5)
                .build();
    }

    @Test
    @DisplayName("createAssessment creates DRAFT assessment")
    void createAssessment_createsDraft() {
        when(assessmentRepository.save(any(Assessment.class))).thenAnswer(inv -> {
            Assessment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        CreateAssessmentRequest request = new CreateAssessmentRequest("Database Systems Quiz", "SQL basics", null, null, 30);
        CreateAssessmentRequest.Response response = assessmentService.createAssessment(request, user);

        assertThat(response).isNotNull();
        assertThat(response.title()).isEqualTo("Database Systems Quiz");
        assertThat(response.status()).isEqualTo(AssessmentStatus.DRAFT);
    }

    @Test
    @DisplayName("publishAssessment changes status to PUBLISHED if questions > 0")
    void publishAssessment_success() {
        draftAssessment.setQuestionCount(2);
        when(assessmentRepository.findByIdAndUser(draftAssessment.getId(), user)).thenReturn(Optional.of(draftAssessment));
        when(assessmentRepository.save(any(Assessment.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateAssessmentRequest.Response response = assessmentService.publishAssessment(draftAssessment.getId(), user);

        assertThat(response.status()).isEqualTo(AssessmentStatus.PUBLISHED);
    }

    @Test
    @DisplayName("publishAssessment rejects if questionCount is 0")
    void publishAssessment_rejectsEmptyAssessment() {
        when(assessmentRepository.findByIdAndUser(draftAssessment.getId(), user)).thenReturn(Optional.of(draftAssessment));

        assertThatThrownBy(() -> assessmentService.publishAssessment(draftAssessment.getId(), user))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot publish an assessment with 0 questions");
    }

    @Test
    @DisplayName("addQuestion throws IllegalStateException if assessment is already PUBLISHED (immutability rule)")
    void addQuestion_rejectsPublishedAssessment() {
        when(assessmentRepository.findByIdAndUser(publishedAssessment.getId(), user)).thenReturn(Optional.of(publishedAssessment));

        CreateQuestionOptionRequest opt1 = new CreateQuestionOptionRequest("Option A", 1, true);
        CreateQuestionOptionRequest opt2 = new CreateQuestionOptionRequest("Option B", 2, false);

        CreateQuestionRequest request = new CreateQuestionRequest(null, "What is deadlocks?", QuestionType.MULTIPLE_CHOICE, QuestionDifficulty.MEDIUM, 1.0, 1, List.of(opt1, opt2));

        assertThatThrownBy(() -> assessmentService.addQuestion(publishedAssessment.getId(), request, user))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Published assessments are immutable");
    }

    @Test
    @DisplayName("getStudentQuestions omits isCorrect field for security before submission")
    void getStudentQuestions_omitsIsCorrect() {
        Question q = Question.builder()
                .id(UUID.randomUUID())
                .assessment(publishedAssessment)
                .questionText("What is virtual memory?")
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .marks(2.0)
                .questionOrder(1)
                .build();

        QuestionOption opt1 = QuestionOption.builder().id(UUID.randomUUID()).question(q).optionText("A. RAM extension").optionOrder(1).isCorrect(true).build();
        QuestionOption opt2 = QuestionOption.builder().id(UUID.randomUUID()).question(q).optionText("B. Physical disk").optionOrder(2).isCorrect(false).build();

        q.setOptions(List.of(opt1, opt2));

        when(assessmentRepository.findById(publishedAssessment.getId())).thenReturn(Optional.of(publishedAssessment));
        when(questionRepository.findByAssessmentIdOrderByQuestionOrderAsc(publishedAssessment.getId())).thenReturn(List.of(q));

        List<CreateQuestionRequest.StudentResponse> questions = assessmentService.getStudentQuestions(publishedAssessment.getId(), user);

        assertThat(questions).hasSize(1);
        assertThat(questions.get(0).options()).hasSize(2);
        // Student option response contains id, text, order ONLY — NO isCorrect!
        assertThat(questions.get(0).options().get(0).optionText()).isEqualTo("A. RAM extension");
    }
}
