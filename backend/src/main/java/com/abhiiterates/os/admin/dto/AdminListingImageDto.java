package com.abhiiterates.os.admin.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record AdminListingImageDto(
        UUID id,
        String imageUrl,
        boolean isPrimary
) {}
