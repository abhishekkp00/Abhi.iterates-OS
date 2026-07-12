package com.abhiiterates.os.ai.dto;

import com.abhiiterates.os.ai.MessageRole;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/** Single message in the API response */
@Builder
public record MessageResponse(
        UUID id,
        MessageRole role,
        String content,
        Integer tokenCount,
        Instant createdAt
) {}
