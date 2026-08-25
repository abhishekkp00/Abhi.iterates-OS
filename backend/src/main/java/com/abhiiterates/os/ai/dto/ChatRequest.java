package com.abhiiterates.os.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request body for sending a chat message */
public record ChatRequest(
        /** Null on the first message — backend creates conversation automatically */
        String conversationId,

        @NotBlank(message = "Message cannot be blank")
        @Size(max = 4000, message = "Message must not exceed 4000 characters")
        String message,

        /** Optional custom system prompt override */
        String systemPrompt,

        /** Optional resource ID for RAG document context retrieval */
        String resourceId,

        /** Optional topic ID for academic topic-aware RAG tutoring */
        String topicId,

        /** Optional controlled tutoring mode (EXPLAIN, SUMMARY, DEEP_DIVE, REVISION, QUESTION) */
        TutorMode tutorMode
) {
    public ChatRequest(String conversationId, String message, String systemPrompt, String resourceId) {
        this(conversationId, message, systemPrompt, resourceId, null, null);
    }
}
