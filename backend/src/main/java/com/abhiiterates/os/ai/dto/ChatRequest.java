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

        /** Optional custom system prompt override (for power users / future templates) */
        String systemPrompt
) {}
