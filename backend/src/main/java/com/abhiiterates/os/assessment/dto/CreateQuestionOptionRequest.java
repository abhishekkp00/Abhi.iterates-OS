package com.abhiiterates.os.assessment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.UUID;

public class CreateQuestionOptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    @NotNull(message = "Option order is required")
    private Integer optionOrder;

    @NotNull(message = "isCorrect flag is required")
    private Boolean isCorrect;

    public CreateQuestionOptionRequest() {}

    public CreateQuestionOptionRequest(String optionText, Integer optionOrder, Boolean isCorrect) {
        this.optionText = optionText;
        this.optionOrder = optionOrder;
        this.isCorrect = isCorrect;
    }

    public String getOptionText() { return optionText; }
    public void setOptionText(String optionText) { this.optionText = optionText; }

    public Integer getOptionOrder() { return optionOrder; }
    public void setOptionOrder(Integer optionOrder) { this.optionOrder = optionOrder; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    // Student view - OMIT ISCORRECT FOR SECURITY BEFORE SUBMISSION!
    @Builder
    public record StudentResponse(
            UUID id,
            String optionText,
            Integer optionOrder
    ) {}

    // Owner view - Only available to the assessment creator in draft mode!
    @Builder
    public record OwnerResponse(
            UUID id,
            String optionText,
            Integer optionOrder,
            Boolean isCorrect
    ) {}
}
