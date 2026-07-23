package com.abhiiterates.os.marketplace.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreResourceDto {
    private UUID id;
    private String title;
    private String description;
    private String category;
    private BigDecimal priceInRupees;
    private Instant expiryDate;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String previewUrl;
    private boolean active;
    private String tags;
    private Instant createdAt;
    
    // Student purchase status fields
    private boolean isPurchased;
    private boolean isExpired;
    private Instant purchaseExpiresAt;
    private String paymentRefId;
}
