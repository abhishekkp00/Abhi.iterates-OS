package com.abhiiterates.os.academic.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a directed prerequisite edge: {@code prerequisiteTopic} must be mastered
 * before studying {@code topic}. Forms a DAG (directed acyclic graph) used by the
 * Adaptive Study Planner's prerequisite graph resolver.
 * <p>
 * Integrity constraint: a topic cannot be its own prerequisite (enforced at DB level).
 */
@Entity
@Table(
    name = "topic_prerequisites",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_topic_prerequisite",
        columnNames = {"topic_id", "prerequisite_topic_id"}
    )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TopicPrerequisite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * The topic that has a prerequisite.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    /**
     * The topic that must be learned first.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prerequisite_topic_id", nullable = false)
    private Topic prerequisiteTopic;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
