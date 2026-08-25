package com.abhiiterates.os.ai.retrieval.repository;

import com.abhiiterates.os.ai.embedding.converter.VectorConverter;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Repository
@RequiredArgsConstructor
public class VectorSearchRepositoryImpl implements VectorSearchRepository {

    @PersistenceContext
    private final EntityManager entityManager;
    private final VectorConverter vectorConverter = new VectorConverter();

    private Boolean isH2 = null;

    private boolean isH2Database() {
        if (isH2 == null) {
            try {
                org.hibernate.Session session = entityManager.unwrap(org.hibernate.Session.class);
                session.doWork(connection -> {
                    String dbName = connection.getMetaData().getDatabaseProductName();
                    isH2 = dbName != null && dbName.toLowerCase().contains("h2");
                });
            } catch (Exception e) {
                isH2 = false;
            }
        }
        return Boolean.TRUE.equals(isH2);
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<RetrievalResult> searchSimilarChunks(
            UUID userId,
            String queryVectorString,
            float[] queryVector,
            String embeddingModel,
            int topK,
            double similarityThreshold,
            UUID resourceIdFilter,
            UUID documentIdFilter,
            UUID subjectIdFilter,
            UUID topicIdFilter) {

        if (isH2Database()) {
            return executeH2FallbackSearch(userId, queryVector, embeddingModel, topK, similarityThreshold, resourceIdFilter, documentIdFilter, subjectIdFilter, topicIdFilter);
        }

        String sql = """
            SELECT 
                c.id AS chunk_id,
                d.id AS document_id,
                r.id AS resource_id,
                r.title AS document_title,
                d.file_name AS filename,
                c.page_number AS page_number,
                c.chunk_index AS chunk_index,
                c.chunk_text AS text,
                (1.0 - (e.vector <=> CAST(:queryVector AS vector))) AS similarity_score,
                (e.vector <=> CAST(:queryVector AS vector)) AS distance_score
            FROM rag_document_chunk_embeddings e
            JOIN rag_document_chunks c ON e.chunk_id = c.id
            JOIN rag_documents d ON c.document_id = d.id
            JOIN resources r ON d.resource_id = r.id
            WHERE r.user_id = :userId
              AND d.status = 'COMPLETED'
              AND d.embedding_status = 'COMPLETED'
              AND e.embedding_model = :embeddingModel
              AND (:resourceIdFilter IS NULL OR r.id = :resourceIdFilter)
              AND (:documentIdFilter IS NULL OR d.id = :documentIdFilter)
              AND (:subjectIdFilter IS NULL OR r.subject_id = :subjectIdFilter)
              AND (:topicIdFilter IS NULL OR r.topic_id = :topicIdFilter)
              AND (1.0 - (e.vector <=> CAST(:queryVector AS vector))) >= :similarityThreshold
            ORDER BY (e.vector <=> CAST(:queryVector AS vector)) ASC
            LIMIT :topK
            """;

        try {
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter("queryVector", queryVectorString);
            query.setParameter("userId", userId);
            query.setParameter("embeddingModel", embeddingModel);
            query.setParameter("resourceIdFilter", resourceIdFilter);
            query.setParameter("documentIdFilter", documentIdFilter);
            query.setParameter("subjectIdFilter", subjectIdFilter);
            query.setParameter("topicIdFilter", topicIdFilter);
            query.setParameter("similarityThreshold", similarityThreshold);
            query.setParameter("topK", topK);

            List<Object[]> rows = query.getResultList();
            List<RetrievalResult> results = new ArrayList<>();

            for (Object[] row : rows) {
                results.add(RetrievalResult.builder()
                        .chunkId(castToUuid(row[0]))
                        .documentId(castToUuid(row[1]))
                        .resourceId(castToUuid(row[2]))
                        .documentTitle((String) row[3])
                        .filename((String) row[4])
                        .pageNumber(row[5] != null ? ((Number) row[5]).intValue() : null)
                        .chunkIndex(row[6] != null ? ((Number) row[6]).intValue() : null)
                        .text((String) row[7])
                        .similarityScore(row[8] != null ? ((Number) row[8]).doubleValue() : 0.0)
                        .distanceScore(row[9] != null ? ((Number) row[9]).doubleValue() : 0.0)
                        .build());
            }

            return results;

        } catch (Exception ex) {
            log.debug("PostgreSQL pgvector query unavailable or non-PostgreSQL dialect ({}), falling back to dialect-safe vector evaluation", ex.getMessage());
            return executeH2FallbackSearch(userId, queryVector, embeddingModel, topK, similarityThreshold, resourceIdFilter, documentIdFilter, subjectIdFilter, topicIdFilter);
        }
    }

    private List<RetrievalResult> executeH2FallbackSearch(
            UUID userId,
            float[] queryVector,
            String embeddingModel,
            int topK,
            double similarityThreshold,
            UUID resourceIdFilter,
            UUID documentIdFilter,
            UUID subjectIdFilter,
            UUID topicIdFilter) {

        String fallbackSql = """
            SELECT 
                c.id AS chunk_id,
                d.id AS document_id,
                r.id AS resource_id,
                r.title AS document_title,
                d.file_name AS filename,
                c.page_number AS page_number,
                c.chunk_index AS chunk_index,
                c.chunk_text AS text,
                e.vector AS vector_str
            FROM rag_document_chunk_embeddings e
            JOIN rag_document_chunks c ON e.chunk_id = c.id
            JOIN rag_documents d ON c.document_id = d.id
            JOIN resources r ON d.resource_id = r.id
            WHERE r.user_id = :userId
              AND d.status = 'COMPLETED'
              AND d.embedding_status = 'COMPLETED'
              AND e.embedding_model = :embeddingModel
              AND (:resourceIdFilter IS NULL OR r.id = :resourceIdFilter)
              AND (:documentIdFilter IS NULL OR d.id = :documentIdFilter)
              AND (:subjectIdFilter IS NULL OR r.subject_id = :subjectIdFilter)
              AND (:topicIdFilter IS NULL OR r.topic_id = :topicIdFilter)
            """;

        Query query = entityManager.createNativeQuery(fallbackSql);
        query.setParameter("userId", userId);
        query.setParameter("embeddingModel", embeddingModel);
        query.setParameter("resourceIdFilter", resourceIdFilter);
        query.setParameter("documentIdFilter", documentIdFilter);
        query.setParameter("subjectIdFilter", subjectIdFilter);
        query.setParameter("topicIdFilter", topicIdFilter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        record ScoredHit(RetrievalResult result, double sim, double dist) {}
        List<ScoredHit> candidates = new ArrayList<>();

        for (Object[] row : rows) {
            String vecStr = (String) row[8];
            float[] docVec = vectorConverter.convertToEntityAttribute(vecStr);
            double sim = computeCosineSimilarity(queryVector, docVec);
            double dist = 1.0 - sim;

            if (sim >= similarityThreshold) {
                RetrievalResult res = RetrievalResult.builder()
                        .chunkId(castToUuid(row[0]))
                        .documentId(castToUuid(row[1]))
                        .resourceId(castToUuid(row[2]))
                        .documentTitle((String) row[3])
                        .filename((String) row[4])
                        .pageNumber(row[5] != null ? ((Number) row[5]).intValue() : null)
                        .chunkIndex(row[6] != null ? ((Number) row[6]).intValue() : null)
                        .text((String) row[7])
                        .similarityScore(sim)
                        .distanceScore(dist)
                        .build();
                candidates.add(new ScoredHit(res, sim, dist));
            }
        }

        candidates.sort((a, b) -> Double.compare(b.sim(), a.sim()));

        return candidates.stream()
                .limit(topK)
                .map(ScoredHit::result)
                .toList();
    }

    private UUID castToUuid(Object obj) {
        if (obj == null) return null;
        if (obj instanceof UUID uuid) return uuid;
        if (obj instanceof byte[] bytes) {
            if (bytes.length == 16) {
                java.nio.ByteBuffer bb = java.nio.ByteBuffer.wrap(bytes);
                long high = bb.getLong();
                long low = bb.getLong();
                return new UUID(high, low);
            }
        }
        return UUID.fromString(obj.toString());
    }

    private double computeCosineSimilarity(float[] v1, float[] v2) {
        if (v1 == null || v2 == null || v1.length == 0 || v2.length == 0 || v1.length != v2.length) {
            return 0.0;
        }
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < v1.length; i++) {
            dotProduct += v1[i] * v2[i];
            normA += v1[i] * v1[i];
            normB += v2[i] * v2[i];
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
