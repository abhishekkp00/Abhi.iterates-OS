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
import org.springframework.http.HttpHeaders;
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
 *
 * Rate limiting:
 *   - /chat/stream: limited by ai.rate-limit.stream-requests-per-minute (default 10/min)
 *   - /chat:        limited by ai.rate-limit.chat-requests-per-minute   (default 20/min)
 *   - ADMIN role users bypass all limits.
 *   - Throttled requests receive HTTP 429 with X-RateLimit-Limit and X-RateLimit-Remaining headers.
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
// @AuthenticationPrincipal is always non-null on authenticated endpoints; compiler cannot verify this statically.
@SuppressWarnings("null")
public class AiChatController {

    private final AiChatService aiChatService;
    private final AiRateLimiterService rateLimiterService;
    private final AiProperties aiProperties;

    // ── Chat ──────────────────────────────────────────────────────────────────

    /**
     * SSE Streaming endpoint — produces text/event-stream.
     * Each event is a JSON object: {"type":"token","content":"..."}
     * The frontend opens this via native fetch with streaming body reading.
     *
     * Rate limited: {@code ai.rate-limit.stream-requests-per-minute} per user.
     * Returns HTTP 429 with X-RateLimit-* headers when the limit is exceeded.
     */
    @PostMapping(value = "/chat/stream", produces = {MediaType.TEXT_EVENT_STREAM_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<SseEmitter> streamChat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        boolean isAdmin = isAdmin(user);
        if (!rateLimiterService.tryConsumeStreamToken(user.getId(), isAdmin)) {
            long remaining = rateLimiterService.streamTokensRemaining(user.getId());
            return (ResponseEntity) buildRateLimitResponse(
                    aiProperties.getRateLimit().getStreamRequestsPerMinute(),
                    remaining,
                    "AI streaming rate limit exceeded. Please wait before sending another request.",
                    servletRequest.getRequestURI()
            );
        }

        SseEmitter emitter = aiChatService.streamChat(request, user);
        return ResponseEntity.ok()
                .header("X-RateLimit-Limit",
                        String.valueOf(aiProperties.getRateLimit().getStreamRequestsPerMinute()))
                .header("X-RateLimit-Remaining",
                        String.valueOf(rateLimiterService.streamTokensRemaining(user.getId())))
                .body(emitter);
    }

    /**
     * Non-streaming fallback — returns the full AI response at once.
     * Useful for automated testing and clients that don't support SSE.
     *
     * Rate limited: {@code ai.rate-limit.chat-requests-per-minute} per user.
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<?>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        boolean isAdmin = isAdmin(user);
        if (!rateLimiterService.tryConsumeChatToken(user.getId(), isAdmin)) {
            long remaining = rateLimiterService.chatTokensRemaining(user.getId());
            return buildRateLimitResponse(
                    aiProperties.getRateLimit().getChatRequestsPerMinute(),
                    remaining,
                    "AI chat rate limit exceeded. Please wait before sending another request.",
                    servletRequest.getRequestURI()
            );
        }

        MessageResponse data = aiChatService.chat(request, user);
        return ResponseEntity.ok()
                .header("X-RateLimit-Limit",
                        String.valueOf(aiProperties.getRateLimit().getChatRequestsPerMinute()))
                .header("X-RateLimit-Remaining",
                        String.valueOf(rateLimiterService.chatTokensRemaining(user.getId())))
                .body(ApiResponse.success(data, "Chat response generated", servletRequest.getRequestURI()));
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Returns {@code true} if the user holds the {@code ROLE_ADMIN} authority.
     * Admin users bypass all AI rate limits.
     */
    private boolean isAdmin(User user) {
        return user.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    /**
     * Builds a standardised HTTP 429 response with RFC-compliant rate limit headers.
     *
     * <p>Headers set:
     * <ul>
     *   <li>{@code X-RateLimit-Limit} — the maximum requests allowed per window</li>
     *   <li>{@code X-RateLimit-Remaining} — tokens left in the current window (always 0 here)</li>
     *   <li>{@code Retry-After} — instructs the client to retry after 60 seconds</li>
     * </ul>
     */
    private ResponseEntity<ApiResponse<?>> buildRateLimitResponse(
            int limit, long remaining, String message, String path) {

        HttpHeaders headers = new HttpHeaders();
        headers.add("X-RateLimit-Limit", String.valueOf(limit));
        headers.add("X-RateLimit-Remaining", String.valueOf(Math.max(remaining, 0)));
        headers.add("Retry-After", "60");

        ApiResponse<Void> body = ApiResponse.error(message, 429, path);
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .headers(headers)
                .body(body);
    }
}
