package com.abhiiterates.os.assessment.dto;

import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateAdaptiveAssessmentRequest {

    @NotNull(message = "Topic ID is mandatory for adaptive assessment generation.")
    private UUID topicId;

    private UUID subjectId;

    @Min(value = 1, message = "Question count must be at least 1.")
    @Max(value = 25, message = "Maximum 25 questions allowed per generated assessment.")
    @Builder.Default
    private int questionCount = 5;

    private QuestionDifficulty difficulty;

    @Builder.Default
    private boolean includeResources = true;
}
