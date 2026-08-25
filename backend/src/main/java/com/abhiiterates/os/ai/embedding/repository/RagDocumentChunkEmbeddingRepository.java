package com.abhiiterates.os.ai.embedding.repository;

import com.abhiiterates.os.ai.embedding.domain.RagDocumentChunkEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RagDocumentChunkEmbeddingRepository extends JpaRepository<RagDocumentChunkEmbedding, UUID> {

    Optional<RagDocumentChunkEmbedding> findByChunkIdAndEmbeddingModel(UUID chunkId, String embeddingModel);

    List<RagDocumentChunkEmbedding> findByChunkId(UUID chunkId);

    boolean existsByChunkIdAndEmbeddingModel(UUID chunkId, String embeddingModel);

    @Modifying
    @Transactional
    @Query("DELETE FROM RagDocumentChunkEmbedding e WHERE e.chunk.document.id = :documentId AND e.embeddingModel = :embeddingModel")
    void deleteByDocumentIdAndEmbeddingModel(UUID documentId, String embeddingModel);
}
