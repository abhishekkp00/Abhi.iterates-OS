package com.abhiiterates.os.ai.retrieval.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record RetrievalResult(
        UUID chunkId,
        UUID documentId,
        UUID resourceId,
        String documentTitle,
        String filename,
        Integer pageNumber,
        Integer chunkIndex,
        String text,
        double similarityScore,
        double distanceScore
) {}
