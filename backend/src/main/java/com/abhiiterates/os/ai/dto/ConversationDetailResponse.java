package com.abhiiterates.os.ai.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Full conversation with all messages — returned when opening a chat */
@Builder
public record ConversationDetailResponse(
        UUID id,
        String title,
        String preview,
        int messageCount,
        List<MessageResponse> messages,
        Instant createdAt,
        Instant updatedAt
) {}
