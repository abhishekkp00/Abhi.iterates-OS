package com.abhiiterates.os.admin.dto;

import java.time.Instant;

public record AdminConversationMessageDto(
        String role,
        String content,
        Integer tokenCount,
        Instant createdAt
) {}
