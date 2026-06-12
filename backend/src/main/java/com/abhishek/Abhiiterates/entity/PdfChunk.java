package com.abhishek.Abhiiterates.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "pdf_chunks")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PdfChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // Store vector as float array — pgvector maps via custom type
    // We use a simple float[] here; Spring AI will handle embeddings later
    @Column(name = "embedding", columnDefinition = "vector(1536)")
    private String embedding;   // stored as string, cast handled in native query

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(name = "token_count")
    private Integer tokenCount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;
}