package com.abhiiterates.os.admin.dto;

import lombok.Builder;
import java.time.Instant;
import java.util.UUID;

@Builder
public record AdminConversationResponseDto(
        UUID id,
        String title,
        String username,
        int messageCount,
        int totalTokens,
        double estimatedCost,
        Instant updatedAt,
        String model
) {}
