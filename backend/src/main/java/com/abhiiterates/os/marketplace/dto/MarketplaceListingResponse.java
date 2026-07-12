package com.abhiiterates.os.marketplace.dto;

import com.abhiiterates.os.marketplace.ListingCategory;
import com.abhiiterates.os.marketplace.ListingCondition;
import com.abhiiterates.os.marketplace.ListingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceListingResponse {
    private UUID id;
    private String title;
    private String description;
    private BigDecimal price;
    private boolean negotiable;
    private ListingCategory category;
    private ListingCondition condition;
    private String location;
    private ListingStatus status;
    private String tags;
    private SellerResponse seller;
    private List<ListingImageResponse> images;
    private Instant createdAt;
    private Instant updatedAt;
}
