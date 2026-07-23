package com.abhiiterates.os.analytics.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardAnalyticsDto {
    private long completedTasks;
    private double taskCompletionRate; // percentage
    private double totalStudyHours;
    private long totalAiTokens;
    private long activeListings;
    
    private List<ChartDataPoint> chartData;
    private List<String> insights;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChartDataPoint {
        private String date; // YYYY-MM-DD
        private long completedTasks;
        private double studyMinutes;
        private long aiTokens;
        private long activeListings;
    }
}
