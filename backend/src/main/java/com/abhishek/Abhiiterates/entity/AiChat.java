package com.abhishek.Abhiiterates.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_chats")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AiChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(nullable = false, length = 10)   // "user" or "assistant"
    private String role;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "context_used", columnDefinition = "TEXT")
    private String contextUsed;   // chunks used for RAG response

    @Column(name = "model_used", length = 100)
    private String modelUsed;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_goal_id")
    private LearningGoal learningGoal;
}