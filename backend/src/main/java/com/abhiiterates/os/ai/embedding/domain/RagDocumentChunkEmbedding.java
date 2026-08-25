package com.abhiiterates.os.ai.embedding.domain;

import com.abhiiterates.os.ai.embedding.converter.VectorConverter;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.common.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "rag_document_chunk_embeddings",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_rag_embedding_chunk_model", columnNames = {"chunk_id", "embedding_model"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RagDocumentChunkEmbedding extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chunk_id", nullable = false)
    private RagDocumentChunk chunk;

    @Column(name = "embedding_model", nullable = false)
    private String embeddingModel;

    @Column(name = "embedding_dimension", nullable = false)
    private Integer embeddingDimension;

    @Convert(converter = VectorConverter.class)
    @Column(name = "vector", nullable = false, columnDefinition = "vector")
    private float[] vector;
}
