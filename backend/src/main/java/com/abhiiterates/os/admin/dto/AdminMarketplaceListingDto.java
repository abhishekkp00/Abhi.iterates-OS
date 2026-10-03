package com.abhiiterates.os.admin.dto;

import com.abhiiterates.os.marketplace.ListingCategory;
import com.abhiiterates.os.marketplace.ListingCondition;
import com.abhiiterates.os.marketplace.ListingStatus;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record AdminMarketplaceListingDto(
        UUID id,
        String title,
        String description,
        BigDecimal price,
        boolean negotiable,
        ListingCategory category,
        ListingCondition condition,
        String location,
        ListingStatus status,
        String tags,
        AdminSellerDto seller,
        List<AdminListingImageDto> images,
        Instant createdAt,
        Instant updatedAt
) {}
