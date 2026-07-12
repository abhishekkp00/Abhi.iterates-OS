package com.abhiiterates.os.marketplace.dto;

import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingImageResponse {
    private UUID id;
    private String imageUrl;
    private boolean isPrimary;
}
