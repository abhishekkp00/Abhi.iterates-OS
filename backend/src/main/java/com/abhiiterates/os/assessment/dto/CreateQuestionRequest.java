package com.abhiiterates.os.assessment.dto;

import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import com.abhiiterates.os.assessment.domain.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CreateQuestionRequest {

    private UUID topicId;

    @NotBlank(message = "Question text is required")
    private String questionText;

    private QuestionType questionType = QuestionType.MULTIPLE_CHOICE;
    private QuestionDifficulty difficulty = QuestionDifficulty.MEDIUM;

    @NotNull(message = "Marks must be specified")
    @Min(value = 1, message = "Marks must be greater than 0")
    private Double marks = 1.0;

    @NotNull(message = "Question order is required")
    private Integer questionOrder;

    @NotEmpty(message = "At least two options are required for multiple-choice questions")
    @Valid
    private List<CreateQuestionOptionRequest> options;

    public CreateQuestionRequest() {}

    public CreateQuestionRequest(UUID topicId, String questionText, QuestionType questionType, QuestionDifficulty difficulty, Double marks, Integer questionOrder, List<CreateQuestionOptionRequest> options) {
        this.topicId = topicId;
        this.questionText = questionText;
        this.questionType = questionType;
        this.difficulty = difficulty;
        this.marks = marks;
        this.questionOrder = questionOrder;
        this.options = options;
    }

    public UUID getTopicId() { return topicId; }
    public void setTopicId(UUID topicId) { this.topicId = topicId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }

    public QuestionDifficulty getDifficulty() { return difficulty; }
    public void setDifficulty(QuestionDifficulty difficulty) { this.difficulty = difficulty; }

    public Double getMarks() { return marks; }
    public void setMarks(Double marks) { this.marks = marks; }

    public Integer getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }

    public List<CreateQuestionOptionRequest> getOptions() { return options; }
    public void setOptions(List<CreateQuestionOptionRequest> options) { this.options = options; }

    // Student Response - NO ISCORRECT!
    @Builder
    public record StudentResponse(
            UUID id,
            UUID assessmentId,
            UUID topicId,
            String topicName,
            String questionText,
            QuestionType questionType,
            QuestionDifficulty difficulty,
            Double marks,
            Integer questionOrder,
            List<CreateQuestionOptionRequest.StudentResponse> options,
            Instant createdAt
    ) {}

    // Owner Response - Includes isCorrect for edit mode
    @Builder
    public record OwnerResponse(
            UUID id,
            UUID assessmentId,
            UUID topicId,
            String topicName,
            String questionText,
            QuestionType questionType,
            QuestionDifficulty difficulty,
            Double marks,
            Integer questionOrder,
            List<CreateQuestionOptionRequest.OwnerResponse> options,
            Instant createdAt
    ) {}
}
