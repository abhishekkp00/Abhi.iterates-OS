package com.abhiiterates.os.assessment.dto;

import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import com.abhiiterates.os.assessment.domain.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedQuestionDto {
    private String questionText;
    @Builder.Default
    private QuestionType questionType = QuestionType.MULTIPLE_CHOICE;
    @Builder.Default
    private QuestionDifficulty difficulty = QuestionDifficulty.MEDIUM;
    @Builder.Default
    private Double marks = 1.0;
    private String explanation;
    private List<GeneratedOptionDto> options;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeneratedOptionDto {
        private String optionText;
        private Boolean isCorrect;
    }
}
