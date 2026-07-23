package com.abhiiterates.os.analytics.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductivityAnalyticsDto {
    private long totalTasks;
    private long completedTasks;
    private long inProgressTasks;
    private long todoTasks;

    private long highPriorityCompleted;
    private long highPriorityTotal;
    
    private long mediumPriorityCompleted;
    private long mediumPriorityTotal;
    
    private long lowPriorityCompleted;
    private long lowPriorityTotal;

    private List<ProductivityPoint> timeline;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductivityPoint {
        private String date; // YYYY-MM-DD
        private long completedCount;
        private long createdCount;
    }
}
