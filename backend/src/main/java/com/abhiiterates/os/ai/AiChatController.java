package com.abhiiterates.os.ai;

import com.abhiiterates.os.ai.dto.*;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

/**
 * AiChatController
 *
 * Endpoints:
 *   POST   /api/v1/ai/chat/stream      → SSE token streaming
 *   POST   /api/v1/ai/chat             → Blocking fallback
 *   GET    /api/v1/ai/conversations    → Paginated conversation list
 *   POST   /api/v1/ai/conversations    → Create blank conversation
 *   GET    /api/v1/ai/conversations/{id} → Full conversation with messages
 *   PATCH  /api/v1/ai/conversations/{id}/title → Rename
 *   DELETE /api/v1/ai/conversations/{id}       → Delete
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    // ── Chat ──────────────────────────────────────────────────────────────────

    /**
     * SSE Streaming endpoint — produces text/event-stream.
     * Each event is a JSON object: {"type":"token","content":"..."}
     * The frontend opens this via native fetch with streaming body reading.
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user
    ) {
        return aiChatService.streamChat(request, user);
    }

    /**
     * Non-streaming fallback — returns the full AI response at once.
     * Useful for automated testing and clients that don't support SSE.
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<MessageResponse>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        MessageResponse data = aiChatService.chat(request, user);
        return ResponseEntity.ok(ApiResponse.success(data, "Chat response generated", servletRequest.getRequestURI()));
    }

    // ── Conversations ─────────────────────────────────────────────────────────

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<Page<ConversationSummaryResponse>>> listConversations(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest servletRequest
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ConversationSummaryResponse> data = aiChatService.listConversations(user, pageable);
        return ResponseEntity.ok(ApiResponse.success(data, "Conversations retrieved", servletRequest.getRequestURI()));
    }

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationSummaryResponse>> createConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        ConversationSummaryResponse data = aiChatService.createConversation(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(data, "Conversation created", servletRequest.getRequestURI()));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<ConversationDetailResponse>> getConversation(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        ConversationDetailResponse data = aiChatService.getConversation(id, user);
        return ResponseEntity.ok(ApiResponse.success(data, "Conversation retrieved", servletRequest.getRequestURI()));
    }

    @PatchMapping("/conversations/{id}/title")
    public ResponseEntity<ApiResponse<ConversationSummaryResponse>> updateTitle(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConversationTitleRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        ConversationSummaryResponse data = aiChatService.updateTitle(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(data, "Title updated", servletRequest.getRequestURI()));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        aiChatService.deleteConversation(id, user);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted", servletRequest.getRequestURI()));
    }
}
