package com.abhiiterates.os.ai.ingestion.domain;

import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceAttachment;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "rag_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RagDocument extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id", nullable = false, unique = true)
    private ResourceAttachment attachment;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type")
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private IngestionStatus status;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "page_count", nullable = false)
    @Builder.Default
    private Integer pageCount = 0;

    @Column(name = "extracted_char_count", nullable = false)
    @Builder.Default
    private Long extractedCharCount = 0L;

    @Column(name = "chunk_count", nullable = false)
    @Builder.Default
    private Integer chunkCount = 0;

    @Column(name = "failure_reason", length = 1000)
    private String failureReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "embedding_status", nullable = false, length = 50)
    @Builder.Default
    private IngestionStatus embeddingStatus = IngestionStatus.PENDING;

    @Column(name = "embedding_failure_reason", length = 1000)
    private String embeddingFailureReason;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RagDocumentChunk> chunks = new ArrayList<>();
}
