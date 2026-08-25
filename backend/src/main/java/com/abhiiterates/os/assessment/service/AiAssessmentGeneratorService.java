package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.assessment.dto.CreateAssessmentRequest;
import com.abhiiterates.os.assessment.dto.GenerateAdaptiveAssessmentRequest;
import com.abhiiterates.os.user.User;

public interface AiAssessmentGeneratorService {
    CreateAssessmentRequest.Response generateAdaptiveAssessment(GenerateAdaptiveAssessmentRequest request, User user);
}
