package com.abhiiterates.os.analytics.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceAnalyticsDto {
    private long totalResources;
    private long totalLectureNotes;
    private long totalBooks;
    private long totalCheatsheets;
    private long totalPastPapers;
    private long totalOthers;

    private List<ResourcePoint> timeline;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResourcePoint {
        private String date; // YYYY-MM-DD
        private long createdCount;
    }
}
