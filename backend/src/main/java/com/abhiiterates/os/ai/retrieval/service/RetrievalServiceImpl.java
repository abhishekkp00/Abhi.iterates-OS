package com.abhiiterates.os.ai.retrieval.service;

import com.abhiiterates.os.ai.embedding.config.RagEmbeddingProperties;
import com.abhiiterates.os.ai.retrieval.config.RagRetrievalProperties;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * RetrievalServiceImpl — production-grade semantic RAG retrieval using Spring AI VectorStore.
 *
 * Every call to {@link #retrieve} is scoped to the authenticated user via a mandatory
 * JSONB metadata filter on {@code userId}. If a resource / document / topic / subject
 * scope is provided, it is combined with the userId filter using an AND expression.
 *
 * Security invariants (enforced on every code path):
 *   - userId filter is ALWAYS present in the SearchRequest filter expression.
 *   - There is NO code path that calls VectorStore.similaritySearch() without userId.
 *   - Keyword / text-substring fallback is PROHIBITED by spec and does NOT exist here.
 *
 * The EmbeddingModel is NOT called manually — VectorStore.similaritySearch() embeds
 * the query internally using the same EmbeddingModel wired in AiConfig.
 *
 * Spring AI 2.0.0 SearchRequest API:
 *   SearchRequest.builder().query(...).topK(...).similarityThreshold(...).filterExpression(...).build()
 *
 * Spring AI 2.0.0 FilterExpressionBuilder API:
 *   b.eq("k", v)           → Op  (NOT Filter.Expression — call .build() on Op)
 *   b.and(Op, Op)          → Op
 *   op.build()             → Filter.Expression
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RetrievalServiceImpl implements RetrievalService {

    private static final int MAX_QUERY_LENGTH = 2000;

    private final VectorStore vectorStore;
    private final RagEmbeddingProperties embeddingProperties;
    private final RagRetrievalProperties retrievalProperties;

    @Override
    public List<RetrievalResult> retrieve(String query, User currentUser) {
        return retrieve(RetrievalRequest.builder().query(query).build(), currentUser);
    }

    @Override
    public List<RetrievalResult> retrieve(RetrievalRequest request, User currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new IllegalArgumentException(
                    "Authenticated user context is required for semantic retrieval.");
        }

        if (request == null || request.query() == null || request.query().trim().isEmpty()) {
            log.debug("Empty or blank query for user [{}]. Returning empty result set.",
                    currentUser.getId());
            return Collections.emptyList();
        }

        if (!embeddingProperties.isEnabled()) {
            log.debug("RAG embedding is disabled in configuration. Skipping retrieval for user [{}].",
                    currentUser.getId());
            return Collections.emptyList();
        }

        String normalizedQuery   = normalizeQuery(request.query());
        int    resolvedTopK      = resolveTopK(request.topK());
        double resolvedThreshold = resolveSimilarityThreshold(request.similarityThreshold());

        log.debug("Semantic retrieval: user=[{}], topK={}, threshold={}, query='{}'",
                currentUser.getId(), resolvedTopK, resolvedThreshold,
                normalizedQuery.length() > 80 ? normalizedQuery.substring(0, 80) + "..." : normalizedQuery);

        // ── Build mandatory userId filter (ALWAYS present) ────────────────────
        // FilterExpressionBuilder.eq() returns Op, not Filter.Expression.
        // To combine: b.and(b.eq(...), b.eq(...)).build() → Filter.Expression
        FilterExpressionBuilder b = new FilterExpressionBuilder();

        // Baseline: user-only scope
        FilterExpressionBuilder.Op userOp =
                b.eq("userId", currentUser.getId().toString());

        Filter.Expression scopeFilter;

        if (request.resourceId() != null) {
            // AND(userId, resourceId)
            scopeFilter = b.and(userOp, b.eq("resourceId", request.resourceId().toString())).build();
            log.debug("Retrieval scoped to resourceId=[{}]", request.resourceId());
        } else if (request.documentId() != null) {
            // AND(userId, documentId)
            scopeFilter = b.and(userOp, b.eq("documentId", request.documentId().toString())).build();
            log.debug("Retrieval scoped to documentId=[{}]", request.documentId());
        } else if (request.topicId() != null) {
            // AND(userId, topicId) — topicId stored in metadata during ingestion
            scopeFilter = b.and(userOp, b.eq("topicId", request.topicId().toString())).build();
            log.debug("Retrieval scoped to topicId=[{}]", request.topicId());
        } else if (request.subjectId() != null) {
            // AND(userId, subjectId)
            scopeFilter = b.and(userOp, b.eq("subjectId", request.subjectId().toString())).build();
            log.debug("Retrieval scoped to subjectId=[{}]", request.subjectId());
        } else {
            // User-wide: userId only
            scopeFilter = userOp.build();
        }

        // ── Primary similarity search ─────────────────────────────────────────
        SearchRequest searchRequest = SearchRequest.builder()
                .query(normalizedQuery)
                .topK(resolvedTopK)
                .similarityThreshold(resolvedThreshold)
                .filterExpression(scopeFilter)
                .build();

        List<Document> results;
        try {
            results = vectorStore.similaritySearch(searchRequest);
        } catch (Exception ex) {
            log.warn("VectorStore.similaritySearch() failed for user [{}]: {}. " +
                    "Returning empty result set (graceful degradation).",
                    currentUser.getId(), ex.getMessage());
            return Collections.emptyList();
        }

        // ── Stage 2: Relaxed threshold retry if primary returned zero hits ────
        if ((results == null || results.isEmpty()) && resolvedThreshold > 0.15) {
            log.info("Primary search returned 0 results for user [{}]. " +
                    "Retrying with relaxed threshold (0.15).", currentUser.getId());

            SearchRequest relaxedRequest = SearchRequest.builder()
                    .query(normalizedQuery)
                    .topK(resolvedTopK)
                    .similarityThreshold(0.15)
                    .filterExpression(scopeFilter)
                    .build();

            try {
                results = vectorStore.similaritySearch(relaxedRequest);
            } catch (Exception ex) {
                log.warn("Relaxed VectorStore.similaritySearch() also failed for user [{}]: {}.",
                        currentUser.getId(), ex.getMessage());
                return Collections.emptyList();
            }
        }

        if (results == null || results.isEmpty()) {
            log.info("Semantic retrieval returned 0 results for user [{}].", currentUser.getId());
            return Collections.emptyList();
        }

        List<RetrievalResult> mapped = results.stream()
                .map(this::mapDocumentToRetrievalResult)
                .toList();

        log.info("Semantic retrieval returned {} chunks for user [{}] (top score: {})",
                mapped.size(), currentUser.getId(),
                mapped.isEmpty() ? "n/a" : mapped.get(0).similarityScore());

        return mapped;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Maps a Spring AI {@link Document} returned from VectorStore.similaritySearch()
     * to a {@link RetrievalResult}. Metadata keys match those written during ingestion.
     *
     * Spring AI 2.0.0: the cosine similarity score is stored in the Document metadata
     * under the key {@code "distance"} by PgVectorStore as the raw cosine distance
     * (lower = more similar). Similarity = 1.0 - distance.
     */
    private RetrievalResult mapDocumentToRetrievalResult(Document doc) {
        Map<String, Object> meta = doc.getMetadata();

        UUID chunkId    = parseUuid(meta.get("id"));
        UUID documentId = parseUuid(meta.get("documentId"));
        UUID resourceId = parseUuid(meta.get("resourceId"));

        String  fileName  = (String) meta.getOrDefault("fileName", "document");
        Integer pageNum   = toInt(meta.get("pageNumber"));
        Integer chunkIdx  = toInt(meta.get("chunkIndex"));

        // PgVectorStore stores cosine distance in "distance" key; similarity = 1 - distance
        double distance   = toDouble(meta.get("distance"));
        double similarity = 1.0 - distance;

        return RetrievalResult.builder()
                .chunkId(chunkId)
                .documentId(documentId)
                .resourceId(resourceId)
                .documentTitle(fileName)
                .filename(fileName)
                .pageNumber(pageNum)
                .chunkIndex(chunkIdx)
                .text(doc.getText())
                .similarityScore(similarity)
                .distanceScore(distance)
                .build();
    }

    private String normalizeQuery(String query) {
        String trimmed = query.trim();
        if (trimmed.length() > MAX_QUERY_LENGTH) {
            log.warn("Query length ({}) exceeds maximum ({}). Truncating.",
                    trimmed.length(), MAX_QUERY_LENGTH);
            return trimmed.substring(0, MAX_QUERY_LENGTH);
        }
        return trimmed;
    }

    private int resolveTopK(Integer requestedTopK) {
        int k = requestedTopK != null ? requestedTopK : retrievalProperties.getTopK();
        if (k <= 0) k = retrievalProperties.getTopK();
        return Math.min(k, retrievalProperties.getMaxTopK());
    }

    private double resolveSimilarityThreshold(Double requestedThreshold) {
        if (requestedThreshold != null) {
            return Math.max(0.0, Math.min(1.0, requestedThreshold));
        }
        return Math.max(0.0, Math.min(1.0, retrievalProperties.getSimilarityThreshold()));
    }

    private UUID parseUuid(Object obj) {
        if (obj == null) return null;
        try {
            return (obj instanceof UUID u) ? u : UUID.fromString(obj.toString());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Integer toInt(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number n) return n.intValue();
        try { return Integer.parseInt(obj.toString()); } catch (NumberFormatException e) { return null; }
    }

    private double toDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(obj.toString()); } catch (NumberFormatException e) { return 0.0; }
    }
}
