package com.abhiiterates.os.ai.ingestion.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record ChunkResponse(
        UUID id,
        int chunkIndex,
        int pageNumber,
        Integer startPage,
        Integer endPage,
        String chunkText,
        int charCount
) {}
