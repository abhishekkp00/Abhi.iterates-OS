package com.abhiiterates.os.ai.context.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record ContextSource(
        UUID chunkId,
        UUID documentId,
        UUID resourceId,
        String title,
        String filename,
        Integer pageNumber,
        Integer chunkIndex,
        double similarityScore
) {}
