package com.abhiiterates.os.admin.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record AdminSellerDto(
        UUID id,
        String username,
        String email,
        String fullName
) {}
