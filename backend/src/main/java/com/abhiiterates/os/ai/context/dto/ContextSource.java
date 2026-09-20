package com.abhiiterates.os.ai.context.dto;

import lombok.Builder;

import java.util.UUID;

/**
 * Citation DTO representing a grounded document context source returned alongside RAG responses.
 */
@Builder
public record ContextSource(
        UUID chunkId,
        UUID documentId,
        UUID resourceId,
        UUID attachmentId,
        String title,
        String filename,
        Integer pageNumber,
        Integer chunkIndex,
        String snippet,
        Double similarityScore
) {}
