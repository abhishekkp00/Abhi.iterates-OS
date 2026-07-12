package com.abhiiterates.os.ai;

import com.abhiiterates.os.ai.dto.*;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

public interface AiChatService {

    /**
     * Stream a chat response via Server-Sent Events.
     * The emitter fires:
     *   - tokens as they arrive  → event: "token"
     *   - conversationId (new or existing) → event: "conversationId"
     *   - completion sentinel  → event: "done"
     *   - error details         → event: "error"
     */
    SseEmitter streamChat(ChatRequest request, User user);

    /** Non-streaming fallback */
    MessageResponse chat(ChatRequest request, User user);

    // ── Conversation management ────────────────────────────────────────────

    Page<ConversationSummaryResponse> listConversations(User user, Pageable pageable);

    ConversationDetailResponse getConversation(UUID id, User user);

    ConversationSummaryResponse createConversation(CreateConversationRequest request, User user);

    ConversationSummaryResponse updateTitle(UUID id, UpdateConversationTitleRequest request, User user);

    void deleteConversation(UUID id, User user);
}
