package com.abhiiterates.os.ai.context.dto;

import lombok.Builder;

import java.util.Collections;
import java.util.List;

@Builder
public record AiContext(
        String formattedText,
        List<ContextSource> sources,
        int retrievedChunkCount
) {
    public static AiContext empty() {
        return AiContext.builder()
                .formattedText("")
                .sources(Collections.emptyList())
                .retrievedChunkCount(0)
                .build();
    }

    public boolean hasContext() {
        return sources != null && !sources.isEmpty() && formattedText != null && !formattedText.isBlank();
    }
}
