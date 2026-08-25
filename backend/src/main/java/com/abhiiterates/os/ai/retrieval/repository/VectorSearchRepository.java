package com.abhiiterates.os.ai.retrieval.repository;

import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;

import java.util.List;
import java.util.UUID;

public interface VectorSearchRepository {

    List<RetrievalResult> searchSimilarChunks(
            UUID userId,
            String queryVectorString,
            float[] queryVector,
            String embeddingModel,
            int topK,
            double similarityThreshold,
            UUID resourceIdFilter,
            UUID documentIdFilter
    );
}
