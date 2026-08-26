package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.assessment.dto.GeneratedQuestionDto;

import java.util.List;

public interface AssessmentValidationEngine {
    List<GeneratedQuestionDto> validateAndSanitize(List<GeneratedQuestionDto> questions);
}
