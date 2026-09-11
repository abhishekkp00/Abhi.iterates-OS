package com.abhiiterates.os.ai.ingestion.repository;

import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RagDocumentRepository extends JpaRepository<RagDocument, UUID> {

    Optional<RagDocument> findByAttachmentId(UUID attachmentId);

    Optional<RagDocument> findByResourceId(UUID resourceId);

    Optional<RagDocument> findByContentHash(String contentHash);

    List<RagDocument> findByResourceUserId(UUID userId);

    List<RagDocument> findByFileNameContainingIgnoreCase(String fileName);

    Optional<RagDocument> findFirstByFileNameContainingIgnoreCase(String fileName);
}

