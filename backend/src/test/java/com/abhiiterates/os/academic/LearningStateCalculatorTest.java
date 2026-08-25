package com.abhiiterates.os.academic;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.service.LearningStateCalculator;
import com.abhiiterates.os.config.LearningStateProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class LearningStateCalculatorTest {

    private LearningStateCalculator calculator;

    @BeforeEach
    void setUp() {
        LearningStateProperties props = new LearningStateProperties();
        props.setMinimumAttempts(2);
        props.setWeakThreshold(50.0);
        props.setDevelopingThreshold(75.0);
        props.setStrongThreshold(85.0);

        calculator = new LearningStateCalculator(props);
    }

    @Test
    @DisplayName("Returns INSUFFICIENT_DATA if attempts < minimumAttempts")
    void calculateState_insufficientData() {
        LearningStateCalculator.CalculationResult result = calculator.calculateState(90.0, 1);

        assertThat(result.state()).isEqualTo(LearningState.INSUFFICIENT_DATA);
        assertThat(result.reason()).contains("Not enough assessment attempts available");
    }

    @ParameterizedTest
    @CsvSource({
            "42.0, 2, WEAK, below the configured weak threshold",
            "49.9, 2, WEAK, below the configured weak threshold",
            "50.0, 2, DEVELOPING, developing understanding",
            "74.9, 2, DEVELOPING, developing understanding",
            "84.9, 2, DEVELOPING, developing understanding",
            "85.0, 2, STRONG, meets or exceeds the strong threshold",
            "95.0, 3, STRONG, meets or exceeds the strong threshold"
    })
    @DisplayName("Calculates correct state and deterministic reason based on configured thresholds")
    void calculateState_thresholdBoundaries(double recentAvg, int attemptCount, LearningState expectedState, String expectedReasonSnippet) {
        LearningStateCalculator.CalculationResult result = calculator.calculateState(recentAvg, attemptCount);

        assertThat(result.state()).isEqualTo(expectedState);
        assertThat(result.reason()).contains(expectedReasonSnippet);
    }
}
