package com.abhiiterates.os.marketplace.dto;

import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String avatarUrl;
}
