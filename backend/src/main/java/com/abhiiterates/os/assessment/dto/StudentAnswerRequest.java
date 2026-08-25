package com.abhiiterates.os.assessment.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class StudentAnswerRequest {

    @NotNull(message = "Question ID is required")
    private UUID questionId;

    @NotNull(message = "Selected option ID is required")
    private UUID selectedOptionId;

    public StudentAnswerRequest() {}

    public StudentAnswerRequest(UUID questionId, UUID selectedOptionId) {
        this.questionId = questionId;
        this.selectedOptionId = selectedOptionId;
    }

    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }

    public UUID getSelectedOptionId() { return selectedOptionId; }
    public void setSelectedOptionId(UUID selectedOptionId) { this.selectedOptionId = selectedOptionId; }
}
