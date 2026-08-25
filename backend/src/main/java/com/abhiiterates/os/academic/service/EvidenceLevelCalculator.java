package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.EvidenceLevel;
import com.abhiiterates.os.config.LearningStateProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EvidenceLevelCalculator {

    private final LearningStateProperties properties;

    public EvidenceLevel calculateEvidenceLevel(int attemptCount) {
        if (attemptCount >= properties.getEvidence().getHighAttempts()) {
            return EvidenceLevel.HIGH;
        } else if (attemptCount >= properties.getEvidence().getMediumAttempts()) {
            return EvidenceLevel.MEDIUM;
        } else {
            return EvidenceLevel.LOW;
        }
    }
}
