package com.abhiiterates.os.ai;

import com.abhiiterates.os.ai.agent.ExecutionContext;
import com.abhiiterates.os.ai.agent.ToolRegistry;
import com.abhiiterates.os.ai.dto.*;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AiChatServiceImpl implements AiChatService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiProperties aiProperties;
    private final ChatClient chatClient;
    private final ToolRegistry toolRegistry;

    /** Virtual thread executor — won't block a carrier thread during LLM I/O */
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // ── Streaming ─────────────────────────────────────────────────────────────

    @Override
    public SseEmitter streamChat(ChatRequest request, User user) {
        // Timeout: 5 minutes for very long responses
        SseEmitter emitter = new SseEmitter(300_000L);

        executor.submit(() -> {
            StringBuilder responseBuffer = new StringBuilder();

            try {
                // 1. Resolve or create conversation
                AiConversation conversation = resolveConversation(request, user);
                final String conversationId = conversation.getId().toString();

                // 2. Emit conversationId so frontend can update the URL immediately
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data("{\"type\":\"conversationId\",\"content\":\"" + conversationId + "\"}"));

                // Build ExecutionContext with tool callbacks
                ExecutionContext context = ExecutionContext.builder()
                        .user(user)
                        .conversationId(conversationId)
                        .listener(new ExecutionContext.ToolExecutionListener() {
                            @Override
                            public void onToolStarted(String toolName, String arguments) {
                                try {
                                    emitter.send(SseEmitter.event()
                                            .name("message")
                                            .data("{\"type\":\"tool_start\",\"name\":\"" + toolName + "\",\"arguments\":" + escapeJson(arguments) + "}"));
                                } catch (IOException e) {
                                    log.warn("Failed to send tool_start SSE event", e);
                                }
                            }

                            @Override
                            public void onToolCompleted(String toolName, String result) {
                                try {
                                    emitter.send(SseEmitter.event()
                                            .name("message")
                                            .data("{\"type\":\"tool_end\",\"name\":\"" + toolName + "\",\"result\":" + escapeJson(result) + "}"));
                                } catch (IOException e) {
                                    log.warn("Failed to send tool_end SSE event", e);
                                }
                            }
                        })
                        .build();

                ToolRegistry.setContext(context);

                // 3. Build Spring AI message history
                List<org.springframework.ai.chat.messages.Message> history =
                        buildMessageHistory(conversation, request.message());

                // 4. Stream tokens from the LLM
                chatClient.prompt()
                        .messages(history)
                        .toolCallbacks(toolRegistry.getCallbacks())
                        .stream()
                        .chatResponse()
                        .doOnNext(chatResponse -> {
                            String token = extractToken(chatResponse);
                            if (token != null && !token.isEmpty()) {
                                responseBuffer.append(token);
                                try {
                                    emitter.send(SseEmitter.event()
                                            .name("message")
                                            .data("{\"type\":\"token\",\"content\":" +
                                                    escapeJson(token) + "}"));
                                } catch (IOException e) {
                                    log.warn("SSE send interrupted for conversation {}", conversationId);
                                    throw new RuntimeException(e);
                                }
                            }
                        })
                        .doOnComplete(() -> {
                            try {
                                // 5. Persist both messages transactionally
                                saveMessages(conversation, request.message(), responseBuffer.toString());

                                // 6. Signal completion
                                emitter.send(SseEmitter.event()
                                        .name("message")
                                        .data("{\"type\":\"done\"}"));
                                emitter.complete();
                            } catch (Exception e) {
                                log.error("Error finalising SSE stream", e);
                                emitter.completeWithError(e);
                            }
                        })
                        .doOnError(err -> {
                            log.error("LLM stream error", err);
                            try {
                                emitter.send(SseEmitter.event()
                                        .name("message")
                                        .data("{\"type\":\"error\",\"content\":" +
                                                escapeJson(err.getMessage()) + "}"));
                            } catch (IOException ignored) {}
                            emitter.completeWithError(err);
                        })
                        .doFinally(signalType -> ToolRegistry.clearContext())
                        .blockLast(); // blocking inside virtual thread is safe

            } catch (Exception ex) {
                log.error("Unexpected SSE stream failure", ex);
                try {
                    emitter.send(SseEmitter.event()
                            .name("message")
                            .data("{\"type\":\"error\",\"content\":" +
                                    escapeJson(ex.getMessage()) + "}"));
                } catch (IOException ignored) {}
                emitter.completeWithError(ex);
            }
        });

        emitter.onTimeout(emitter::complete);
        emitter.onError((ex) -> log.warn("SSE emitter error", ex));

        return emitter;
    }

    // ── Non-streaming fallback ────────────────────────────────────────────────

    @Override
    @Transactional
    public MessageResponse chat(ChatRequest request, User user) {
        AiConversation conversation = resolveConversation(request, user);
        List<org.springframework.ai.chat.messages.Message> history =
                buildMessageHistory(conversation, request.message());

        ExecutionContext context = ExecutionContext.builder()
                .user(user)
                .conversationId(conversation.getId().toString())
                .build();
        ToolRegistry.setContext(context);
        try {
            String responseContent = chatClient.prompt()
                    .messages(history)
                    .toolCallbacks(toolRegistry.getCallbacks())
                    .call()
                    .content();

            AiMessage saved = saveMessages(conversation, request.message(), responseContent);

            return MessageResponse.builder()
                    .id(saved.getId())
                    .role(MessageRole.ASSISTANT)
                    .content(responseContent)
                    .createdAt(saved.getCreatedAt())
                    .build();
        } finally {
            ToolRegistry.clearContext();
        }
    }

    // ── Conversation CRUD ─────────────────────────────────────────────────────

    @Override
    public Page<ConversationSummaryResponse> listConversations(User user, Pageable pageable) {
        return conversationRepository
                .findByUserOrderByUpdatedAtDesc(user, pageable)
                .map(this::toSummary);
    }

    @Override
    public ConversationDetailResponse getConversation(UUID id, User user) {
        AiConversation conv = conversationRepository.findByIdAndUserWithMessages(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + id));
        return toDetail(conv);
    }

    @Override
    @Transactional
    public ConversationSummaryResponse createConversation(CreateConversationRequest request, User user) {
        String title = (request.title() != null && !request.title().isBlank())
                ? request.title()
                : "New Chat";

        AiConversation conv = AiConversation.builder()
                .title(title)
                .user(user)
                .build();

        return toSummary(conversationRepository.save(conv));
    }

    @Override
    @Transactional
    public ConversationSummaryResponse updateTitle(UUID id, UpdateConversationTitleRequest request, User user) {
        AiConversation conv = conversationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + id));
        conv.setTitle(request.title());
        return toSummary(conversationRepository.save(conv));
    }

    @Override
    @Transactional
    public void deleteConversation(UUID id, User user) {
        AiConversation conv = conversationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + id));
        conversationRepository.delete(conv);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Resolves existing conversation from request.conversationId,
     * or creates a new one if null/absent.
     */
    @Transactional
    protected AiConversation resolveConversation(ChatRequest request, User user) {
        if (request.conversationId() != null && !request.conversationId().isBlank()) {
            try {
                UUID id = UUID.fromString(request.conversationId());
                return conversationRepository.findByIdAndUserWithMessages(id, user)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Conversation not found: " + request.conversationId()));
            } catch (IllegalArgumentException ex) {
                // Temp ID from frontend (e.g. "new-1234") — create a new conversation
            }
        }

        // Auto-title from first 50 chars of message
        String title = request.message().length() > 50
                ? request.message().substring(0, 47) + "…"
                : request.message();

        AiConversation conv = AiConversation.builder()
                .title(title)
                .preview(request.message().substring(0, Math.min(request.message().length(), 200)))
                .user(user)
                .messages(new ArrayList<>())
                .build();

        return conversationRepository.save(conv);
    }

    /**
     * Builds the Spring AI message list including:
     * 1. System prompt
     * 2. Full conversation history (USER + ASSISTANT alternating)
     * 3. New user message at the end
     */
    private List<org.springframework.ai.chat.messages.Message> buildMessageHistory(
            AiConversation conversation, String newUserMessage) {

        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        // System prompt
        String sysPrompt = aiProperties.getSystemPrompt();
        messages.add(new SystemMessage(sysPrompt));

        // Historical messages
        for (AiMessage msg : conversation.getMessages()) {
            if (msg.getRole() == MessageRole.USER) {
                messages.add(new UserMessage(msg.getContent()));
            } else if (msg.getRole() == MessageRole.ASSISTANT) {
                messages.add(new AssistantMessage(msg.getContent()));
            }
        }

        // New user message
        messages.add(new UserMessage(newUserMessage));

        return messages;
    }

    /**
     * Persists user + assistant messages to the conversation.
     * Returns the saved assistant message (used as the response DTO source).
     */
    @Transactional
    protected AiMessage saveMessages(AiConversation conversation, String userContent, String assistantContent) {
        AiMessage userMsg = AiMessage.builder()
                .role(MessageRole.USER)
                .content(userContent)
                .conversation(conversation)
                .build();

        AiMessage assistantMsg = AiMessage.builder()
                .role(MessageRole.ASSISTANT)
                .content(assistantContent)
                .conversation(conversation)
                .build();

        messageRepository.save(userMsg);
        AiMessage saved = messageRepository.save(assistantMsg);

        // Update conversation preview if it's the first message
        if (conversation.getPreview() == null || conversation.getPreview().isBlank()) {
            conversation.setPreview(userContent.substring(0, Math.min(userContent.length(), 200)));
        }
        conversationRepository.save(conversation);

        return saved;
    }

    private String extractToken(ChatResponse response) {
        if (response == null || response.getResult() == null) return null;
        var output = response.getResult().getOutput();
        if (output == null) return null;
        return output.getText();
    }

    /** Safely escape a string for inline JSON string embedding */
    private String escapeJson(String value) {
        if (value == null) return "\"\"";
        return "\"" + value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")
                + "\"";
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private ConversationSummaryResponse toSummary(AiConversation conv) {
        int msgCount = messageRepository.countByConversationId(conv.getId());
        return ConversationSummaryResponse.builder()
                .id(conv.getId())
                .title(conv.getTitle())
                .preview(conv.getPreview())
                .messageCount(msgCount)
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }

    private ConversationDetailResponse toDetail(AiConversation conv) {
        List<MessageResponse> msgs = conv.getMessages().stream()
                .map(m -> MessageResponse.builder()
                        .id(m.getId())
                        .role(m.getRole())
                        .content(m.getContent())
                        .tokenCount(m.getTokenCount())
                        .createdAt(m.getCreatedAt())
                        .build())
                .toList();

        return ConversationDetailResponse.builder()
                .id(conv.getId())
                .title(conv.getTitle())
                .preview(conv.getPreview())
                .messageCount(msgs.size())
                .messages(msgs)
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }
}
