package com.abhiiterates.os.marketplace.store.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpiPurchaseRequest {

    @NotBlank(message = "UPI Reference ID / UTR is required")
    private String paymentRefId;
}
