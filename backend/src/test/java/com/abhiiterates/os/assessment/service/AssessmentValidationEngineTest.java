package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import com.abhiiterates.os.assessment.domain.QuestionType;
import com.abhiiterates.os.assessment.dto.GeneratedQuestionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AssessmentValidationEngineTest {

    private AssessmentValidationEngine validationEngine;

    @BeforeEach
    void setUp() {
        validationEngine = new AssessmentValidationEngineImpl();
    }

    @Test
    @DisplayName("Valid questions are sanitized and approved")
    void valid_questions_sanitized() {
        List<GeneratedQuestionDto.GeneratedOptionDto> options = List.of(
                GeneratedQuestionDto.GeneratedOptionDto.builder().optionText("Opt 1").isCorrect(true).build(),
                GeneratedQuestionDto.GeneratedOptionDto.builder().optionText("Opt 2").isCorrect(false).build(),
                GeneratedQuestionDto.GeneratedOptionDto.builder().optionText("Opt 3").isCorrect(false).build(),
                GeneratedQuestionDto.GeneratedOptionDto.builder().optionText("Opt 4").isCorrect(false).build()
        );

        GeneratedQuestionDto q = GeneratedQuestionDto.builder()
                .questionText("What is TCP?")
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .difficulty(QuestionDifficulty.MEDIUM)
                .marks(1.0)
                .options(options)
                .build();

        List<GeneratedQuestionDto> validated = validationEngine.validateAndSanitize(List.of(q));

        assertThat(validated).hasSize(1);
        assertThat(validated.get(0).getQuestionText()).isEqualTo("What is TCP?");
        assertThat(validated.get(0).getOptions()).hasSize(4);
    }

    @Test
    @DisplayName("Question missing correct option gets option 0 auto-marked as correct")
    void missing_correct_option_autofixed() {
        List<GeneratedQuestionDto.GeneratedOptionDto> options = new ArrayList<>(List.of(
                GeneratedQuestionDto.GeneratedOptionDto.builder().optionText("Opt 1").isCorrect(false).build(),
                GeneratedQuestionDto.GeneratedOptionDto.builder().optionText("Opt 2").isCorrect(false).build()
        ));

        GeneratedQuestionDto q = GeneratedQuestionDto.builder()
                .questionText("What is IP?")
                .options(options)
                .build();

        List<GeneratedQuestionDto> validated = validationEngine.validateAndSanitize(List.of(q));

        assertThat(validated).hasSize(1);
        assertThat(validated.get(0).getOptions().get(0).getIsCorrect()).isTrue();
    }

    @Test
    @DisplayName("Empty question list throws IllegalArgumentException")
    void empty_list_throws() {
        assertThatThrownBy(() -> validationEngine.validateAndSanitize(List.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
