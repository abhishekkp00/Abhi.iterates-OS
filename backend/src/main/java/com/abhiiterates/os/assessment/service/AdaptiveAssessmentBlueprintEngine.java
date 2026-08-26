package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.assessment.dto.AssessmentBlueprint;
import com.abhiiterates.os.assessment.dto.GenerateAdaptiveAssessmentRequest;
import com.abhiiterates.os.user.User;

public interface AdaptiveAssessmentBlueprintEngine {
    AssessmentBlueprint buildBlueprint(GenerateAdaptiveAssessmentRequest request, User user);
}
