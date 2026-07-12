package com.abhiiterates.os.ai;

import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * AiConversation — represents a single chat session between a user and the AI.
 * A conversation holds many AiMessages and is owned by one User.
 */
@Entity
@Table(name = "ai_conversations", indexes = {
        @Index(name = "idx_ai_conv_user_id", columnList = "user_id"),
        @Index(name = "idx_ai_conv_updated_at", columnList = "updated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiConversation extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Short preview of the first message for sidebar display.
     * Populated when the first user message is saved.
     */
    @Column(length = 500)
    private String preview;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<AiMessage> messages = new ArrayList<>();
}
