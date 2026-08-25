package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.config.LearningStateProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LearningStateCalculator {

    private final LearningStateProperties properties;

    public CalculationResult calculateState(Double recentAverage, int attemptCount) {
        if (attemptCount < properties.getMinimumAttempts() || recentAverage == null) {
            String reason = "Not enough assessment attempts available (found " + attemptCount +
                    ", minimum required is " + properties.getMinimumAttempts() + ").";
            return new CalculationResult(LearningState.INSUFFICIENT_DATA, reason);
        }

        double weakThresh = properties.getWeakThreshold();
        double devThresh = properties.getDevelopingThreshold();
        double strongThresh = properties.getStrongThreshold();

        if (recentAverage < weakThresh) {
            String reason = "Recent assessment performance (" + String.format("%.1f", recentAverage) +
                    "%) is below the configured weak threshold of " + String.format("%.1f", weakThresh) + "%.";
            return new CalculationResult(LearningState.WEAK, reason);
        } else if (recentAverage < strongThresh) {
            String reason = "Recent assessment performance (" + String.format("%.1f", recentAverage) +
                    "%) indicates developing understanding (thresholds: weak=" + String.format("%.1f", weakThresh) +
                    "%, strong=" + String.format("%.1f", strongThresh) + "%).";
            return new CalculationResult(LearningState.DEVELOPING, reason);
        } else {
            String reason = "Recent assessment performance (" + String.format("%.1f", recentAverage) +
                    "%) consistently meets or exceeds the strong threshold of " + String.format("%.1f", strongThresh) + "%.";
            return new CalculationResult(LearningState.STRONG, reason);
        }
    }

    public record CalculationResult(LearningState state, String reason) {}
}
