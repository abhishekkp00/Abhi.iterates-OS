package com.abhiiterates.os.ai.retrieval.service;

import com.abhiiterates.os.ai.embedding.config.RagEmbeddingProperties;
import com.abhiiterates.os.ai.embedding.converter.VectorConverter;
import com.abhiiterates.os.ai.retrieval.config.RagRetrievalProperties;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.repository.VectorSearchRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RetrievalServiceImpl implements RetrievalService {

    private static final int MAX_QUERY_LENGTH = 2000;

    private final VectorSearchRepository vectorSearchRepository;
    private final EmbeddingModel embeddingModel;
    private final RagEmbeddingProperties embeddingProperties;
    private final RagRetrievalProperties retrievalProperties;
    private final VectorConverter vectorConverter = new VectorConverter();

    @Override
    public List<RetrievalResult> retrieve(String query, User currentUser) {
        return retrieve(RetrievalRequest.builder().query(query).build(), currentUser);
    }

    @Override
    public List<RetrievalResult> retrieve(RetrievalRequest request, User currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new IllegalArgumentException("Authenticated user context is required for semantic retrieval.");
        }

        if (request == null || request.query() == null || request.query().trim().isEmpty()) {
            log.debug("Empty or blank query provided for user ID: {}. Returning empty result set.", currentUser.getId());
            return Collections.emptyList();
        }

        String normalizedQuery = normalizeQuery(request.query());
        int resolvedTopK = resolveTopK(request.topK());
        double resolvedThreshold = resolveSimilarityThreshold(request.similarityThreshold());
        String targetModel = embeddingProperties.getModel();
        int expectedDimensions = embeddingProperties.getDimensions();

        log.debug("Generating query vector for user ID: {}, model: [{}], topK: {}, threshold: {}",
                currentUser.getId(), targetModel, resolvedTopK, resolvedThreshold);

        float[] queryVector = embeddingModel.embed(normalizedQuery);

        if (queryVector == null || queryVector.length == 0) {
            throw new IllegalStateException("Embedding model returned empty vector for user query.");
        }

        if (queryVector.length != expectedDimensions) {
            throw new IllegalStateException("Query vector dimension mismatch: expected "
                    + expectedDimensions + " dimensions, but received " + queryVector.length);
        }

        String queryVectorString = vectorConverter.convertToDatabaseColumn(queryVector);

        List<RetrievalResult> results = vectorSearchRepository.searchSimilarChunks(
                currentUser.getId(),
                queryVectorString,
                queryVector,
                targetModel,
                resolvedTopK,
                resolvedThreshold,
                request.resourceId(),
                request.documentId(),
                request.subjectId(),
                request.topicId()
        );

        if (results.isEmpty()) {
            log.info("Semantic retrieval for user ID [{}] returned 0 results (threshold: {}, topK: {})",
                    currentUser.getId(), resolvedThreshold, resolvedTopK);
        } else {
            log.info("Semantic retrieval for user ID [{}] returned {} chunks (top score: {}, threshold: {}, topK: {})",
                    currentUser.getId(), results.size(), results.get(0).similarityScore(), resolvedThreshold, resolvedTopK);
        }

        return results;
    }

    private String normalizeQuery(String query) {
        String trimmed = query.trim();
        if (trimmed.length() > MAX_QUERY_LENGTH) {
            log.warn("Query length ({}) exceeds maximum limit ({}). Truncating query.", trimmed.length(), MAX_QUERY_LENGTH);
            return trimmed.substring(0, MAX_QUERY_LENGTH);
        }
        return trimmed;
    }

    private int resolveTopK(Integer requestedTopK) {
        int k = requestedTopK != null ? requestedTopK : retrievalProperties.getTopK();
        if (k <= 0) {
            k = retrievalProperties.getTopK();
        }
        return Math.min(k, retrievalProperties.getMaxTopK());
    }

    private double resolveSimilarityThreshold(Double requestedThreshold) {
        double threshold = requestedThreshold != null ? requestedThreshold : retrievalProperties.getSimilarityThreshold();
        return Math.max(0.0, Math.min(1.0, threshold));
    }
}
