package com.abhiiterates.os.marketplace.store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreResourceRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Category is required")
    private String category; // Placement, General, Semester Notes, etc.

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must be positive or zero")
    private BigDecimal priceInRupees;

    private Instant expiryDate;

    @NotBlank(message = "File URL or attachment is required")
    private String fileUrl;

    private String fileName;
    private Long fileSize;
    private String previewUrl;
    private String tags;
}
