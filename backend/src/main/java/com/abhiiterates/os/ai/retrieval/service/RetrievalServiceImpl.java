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

        if (!embeddingProperties.isEnabled()) {
            log.debug("RAG embedding is disabled in configuration. Skipping semantic retrieval for user ID: {}", currentUser.getId());
            return Collections.emptyList();
        }

        log.debug("Generating query vector for user ID: {}, model: [{}], topK: {}, threshold: {}",
                currentUser.getId(), targetModel, resolvedTopK, resolvedThreshold);

        float[] queryVector;
        try {
            queryVector = embeddingModel.embed(normalizedQuery);
        } catch (Exception ex) {
            log.warn("Semantic vector embedding generation failed for user ID [{}]: {}. Falling back to non-RAG chat response.",
                    currentUser.getId(), ex.getMessage());
            return Collections.emptyList();
        }

        if (queryVector == null || queryVector.length == 0) {
            log.warn("Embedding model returned empty vector for user query. Returning empty result set.");
            return Collections.emptyList();
        }

        if (queryVector.length != expectedDimensions) {
            log.warn("Query vector dimension mismatch: expected {} dimensions, but received {}. Returning empty result set.",
                    expectedDimensions, queryVector.length);
            return Collections.emptyList();
        }

        String queryVectorString = vectorConverter.convertToDatabaseColumn(queryVector);

        // Stage 1: Primary Vector Search (using requested or relaxed default threshold)
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

        // Stage 2: Relaxed Vector Search if primary threshold returned 0 hits
        if (results.isEmpty() && resolvedThreshold > 0.15) {
            log.info("Primary vector search returned 0 results for user ID [{}]. Retrying with relaxed threshold (0.15).", currentUser.getId());
            results = vectorSearchRepository.searchSimilarChunks(
                    currentUser.getId(),
                    queryVectorString,
                    queryVector,
                    targetModel,
                    resolvedTopK,
                    0.15,
                    request.resourceId(),
                    request.documentId(),
                    request.subjectId(),
                    request.topicId()
            );
        }

        // Stage 3: Keyword / Text Substring Matching Fallback if vector search returned 0 hits
        if (results.isEmpty()) {
            log.info("Vector search returned 0 results for user ID [{}]. Falling back to keyword search for query [{}]", currentUser.getId(), normalizedQuery);
            results = vectorSearchRepository.searchChunksByKeyword(
                    currentUser.getId(),
                    normalizedQuery,
                    resolvedTopK,
                    request.resourceId(),
                    request.documentId()
            );
        }

        if (results.isEmpty()) {
            log.info("Multi-stage retrieval for user ID [{}] returned 0 results", currentUser.getId());
        } else {
            log.info("Multi-stage retrieval for user ID [{}] returned {} chunks (top score: {})",
                    currentUser.getId(), results.size(), results.get(0).similarityScore());
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
        if (requestedThreshold != null) {
            return Math.max(0.0, Math.min(1.0, requestedThreshold));
        }
        return Math.max(0.0, Math.min(1.0, retrievalProperties.getSimilarityThreshold()));
    }

}
