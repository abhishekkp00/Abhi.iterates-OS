package com.abhiiterates.os.admin.dto;

import lombok.Builder;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record AdminUserResponseDto(
        UUID id,
        String email,
        String username,
        String firstName,
        String lastName,
        List<String> roles,
        boolean active,
        boolean softDeleted,
        Instant createdAt
) {}
