package com.abhiiterates.os.analytics.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceAnalyticsDto {
    private long totalListings;
    private long activeListings;
    private long soldListings;
    private BigDecimal totalRevenue;

    private long totalBooks;
    private long totalElectronics;
    private long totalHousing;
    private long totalServices;
    private long totalClothing;
    private long totalOthers;

    private List<MarketplacePoint> timeline;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MarketplacePoint {
        private String date; // YYYY-MM-DD
        private long createdCount;
        private long soldCount;
    }
}
