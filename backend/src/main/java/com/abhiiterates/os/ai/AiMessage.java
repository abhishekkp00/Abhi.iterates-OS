package com.abhiiterates.os.ai;

import com.abhiiterates.os.common.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * AiMessage — a single turn in a conversation.
 * Role is stored as a string enum: USER | ASSISTANT | SYSTEM
 */
@Entity
@Table(name = "ai_messages", indexes = {
        @Index(name = "idx_ai_msg_conversation_id", columnList = "conversation_id"),
        @Index(name = "idx_ai_msg_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiMessage extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessageRole role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Optional: token count returned by the LLM provider */
    @Column(name = "token_count")
    private Integer tokenCount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversation conversation;
}
