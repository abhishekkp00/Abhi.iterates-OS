package com.abhiiterates.os.analytics.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAnalyticsDto {
    private long totalConversations;
    private long totalQueries;
    private long totalTokens;
    private double avgMessagesPerConversation;

    private List<AiPoint> timeline;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiPoint {
        private String date; // YYYY-MM-DD
        private long tokenCount;
        private long queryCount;
    }
}
