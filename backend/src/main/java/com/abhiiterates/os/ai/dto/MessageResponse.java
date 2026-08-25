package com.abhiiterates.os.ai.dto;

import com.abhiiterates.os.ai.MessageRole;
import com.abhiiterates.os.ai.context.dto.ContextSource;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Single message in the API response */
@Builder
public record MessageResponse(
        UUID id,
        MessageRole role,
        String content,
        Integer tokenCount,
        List<ContextSource> sources,
        Instant createdAt
) {}
