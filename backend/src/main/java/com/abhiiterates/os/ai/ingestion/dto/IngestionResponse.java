package com.abhiiterates.os.ai.ingestion.dto;

import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record IngestionResponse(
        UUID documentId,
        UUID resourceId,
        UUID attachmentId,
        String fileName,
        String contentType,
        IngestionStatus status,
        IngestionStatus embeddingStatus,
        String contentHash,
        int pageCount,
        long extractedCharCount,
        int chunkCount,
        String failureReason,
        String embeddingFailureReason,
        Instant createdAt,
        Instant updatedAt,
        List<ChunkResponse> chunks
) {}
