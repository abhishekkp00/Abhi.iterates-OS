package com.abhiiterates.os.academic;

import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.academic.service.TrendCalculator;
import com.abhiiterates.os.assessment.domain.TopicAssessmentPerformance;
import com.abhiiterates.os.config.LearningStateProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TrendCalculatorTest {

    private TrendCalculator trendCalculator;

    @BeforeEach
    void setUp() {
        LearningStateProperties props = new LearningStateProperties();
        props.getTrend().setRecentWindow(3);
        props.getTrend().setPreviousWindow(3);
        props.getTrend().setMeaningfulChange(5.0);

        trendCalculator = new TrendCalculator(props);
    }

    @Test
    @DisplayName("Returns INSUFFICIENT_DATA when performances count < 2")
    void calculateTrend_insufficientData() {
        assertThat(trendCalculator.calculateTrend(Collections.emptyList())).isEqualTo(LearningTrend.INSUFFICIENT_DATA);
        assertThat(trendCalculator.calculateTrend(List.of(TopicAssessmentPerformance.builder().percentage(80.0).build()))).isEqualTo(LearningTrend.INSUFFICIENT_DATA);
    }

    @Test
    @DisplayName("Detects IMPROVING trend when recent window average > previous window average + delta")
    void calculateTrend_improving() {
        // Performances in DESC order (most recent first): [90, 85, 80] vs older [60, 55, 50]
        List<TopicAssessmentPerformance> perfList = List.of(
                TopicAssessmentPerformance.builder().percentage(90.0).build(),
                TopicAssessmentPerformance.builder().percentage(85.0).build(),
                TopicAssessmentPerformance.builder().percentage(80.0).build(),
                TopicAssessmentPerformance.builder().percentage(60.0).build(),
                TopicAssessmentPerformance.builder().percentage(55.0).build(),
                TopicAssessmentPerformance.builder().percentage(50.0).build()
        );

        LearningTrend trend = trendCalculator.calculateTrend(perfList);
        assertThat(trend).isEqualTo(LearningTrend.IMPROVING);
    }

    @Test
    @DisplayName("Detects DECLINING trend when recent window average < previous window average - delta")
    void calculateTrend_declining() {
        // Most recent first: [40, 45, 50] vs older [85, 90, 95]
        List<TopicAssessmentPerformance> perfList = List.of(
                TopicAssessmentPerformance.builder().percentage(40.0).build(),
                TopicAssessmentPerformance.builder().percentage(45.0).build(),
                TopicAssessmentPerformance.builder().percentage(50.0).build(),
                TopicAssessmentPerformance.builder().percentage(85.0).build(),
                TopicAssessmentPerformance.builder().percentage(90.0).build(),
                TopicAssessmentPerformance.builder().percentage(95.0).build()
        );

        LearningTrend trend = trendCalculator.calculateTrend(perfList);
        assertThat(trend).isEqualTo(LearningTrend.DECLINING);
    }

    @Test
    @DisplayName("Detects STABLE trend when change is within meaningfulChange delta")
    void calculateTrend_stable() {
        // Most recent first: [80, 82] vs older [81, 79]
        List<TopicAssessmentPerformance> perfList = List.of(
                TopicAssessmentPerformance.builder().percentage(80.0).build(),
                TopicAssessmentPerformance.builder().percentage(82.0).build(),
                TopicAssessmentPerformance.builder().percentage(81.0).build(),
                TopicAssessmentPerformance.builder().percentage(79.0).build()
        );

        LearningTrend trend = trendCalculator.calculateTrend(perfList);
        assertThat(trend).isEqualTo(LearningTrend.STABLE);
    }
}
