package com.abhiiterates.os.ai.ingestion.repository;

import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface RagDocumentChunkRepository extends JpaRepository<RagDocumentChunk, UUID> {

    List<RagDocumentChunk> findByDocumentIdOrderByChunkIndexAsc(UUID documentId);

    @Modifying
    @Transactional
    void deleteByDocumentId(UUID documentId);
}
