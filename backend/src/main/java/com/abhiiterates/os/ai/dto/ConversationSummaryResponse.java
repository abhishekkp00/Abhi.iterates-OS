package com.abhiiterates.os.ai.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/** Lightweight conversation summary — used in sidebar list (no messages) */
@Builder
public record ConversationSummaryResponse(
        UUID id,
        String title,
        String preview,
        int messageCount,
        Instant createdAt,
        Instant updatedAt
) {}
