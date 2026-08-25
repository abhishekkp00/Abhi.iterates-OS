package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.assessment.domain.TopicAssessmentPerformance;
import com.abhiiterates.os.config.LearningStateProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TrendCalculator {

    private final LearningStateProperties properties;

    public LearningTrend calculateTrend(List<TopicAssessmentPerformance> sortedPerformancesDesc) {
        if (sortedPerformancesDesc == null || sortedPerformancesDesc.size() < 2) {
            return LearningTrend.INSUFFICIENT_DATA;
        }

        int recentWindow = properties.getTrend().getRecentWindow();
        int previousWindow = properties.getTrend().getPreviousWindow();
        double meaningfulChange = properties.getTrend().getMeaningfulChange();

        List<TopicAssessmentPerformance> recentList = sortedPerformancesDesc.subList(0, Math.min(recentWindow, sortedPerformancesDesc.size()));
        double recentAvg = recentList.stream().mapToDouble(TopicAssessmentPerformance::getPercentage).average().orElse(0.0);

        if (sortedPerformancesDesc.size() <= recentList.size()) {
            return LearningTrend.INSUFFICIENT_DATA;
        }

        List<TopicAssessmentPerformance> prevList = sortedPerformancesDesc.subList(recentList.size(), Math.min(recentList.size() + previousWindow, sortedPerformancesDesc.size()));
        double prevAvg = prevList.stream().mapToDouble(TopicAssessmentPerformance::getPercentage).average().orElse(0.0);

        double diff = recentAvg - prevAvg;

        if (diff > meaningfulChange) {
            return LearningTrend.IMPROVING;
        } else if (diff < -meaningfulChange) {
            return LearningTrend.DECLINING;
        } else {
            return LearningTrend.STABLE;
        }
    }
}
