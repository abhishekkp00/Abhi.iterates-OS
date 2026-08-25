package com.abhiiterates.os.ai.ingestion.model;

public record ChunkOutput(
        int chunkIndex,
        int pageNumber,
        Integer startPage,
        Integer endPage,
        String text,
        int charCount
) {}
