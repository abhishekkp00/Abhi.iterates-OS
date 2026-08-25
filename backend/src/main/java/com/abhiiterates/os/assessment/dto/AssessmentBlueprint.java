package com.abhiiterates.os.assessment.dto;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AssessmentBlueprint {
    private UUID topicId;
    private String topicName;
    private LearningState learningState;
    private Double accuracyPercentage;
    private QuestionDifficulty targetDifficulty;
    private int suggestedQuestionCount;
    private List<String> focusAreas;
    private String rationale;
}
