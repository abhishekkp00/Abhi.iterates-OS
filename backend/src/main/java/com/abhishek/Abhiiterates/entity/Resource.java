package com.abhishek.Abhiiterates.entity;

import com.abhishek.Abhiiterates.enums.ResourceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "resources")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;

    @Column(columnDefinition = "TEXT")
    private String url;

    @Column(name = "file_path", columnDefinition = "TEXT")
    private String filePath;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_processed")
    @Builder.Default
    private Boolean isProcessed = false;   // for PDF chunking later

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_goal_id")
    private LearningGoal learningGoal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "resource", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PdfChunk> pdfChunks;
}