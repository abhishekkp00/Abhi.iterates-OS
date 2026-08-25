package com.abhiiterates.os.ai.retrieval.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record RetrievalRequest(
        String query,
        Integer topK,
        Double similarityThreshold,
        UUID resourceId,
        UUID documentId,
        UUID subjectId,
        UUID topicId
) {}
