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
import java.util.Map;
import java.util.Set;
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
    private final com.abhiiterates.os.resource.ResourceAttachmentRepository attachmentRepository;

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
                        buildMessageHistory(conversation, request.message(), request.systemPrompt(), request.resourceId());

                // 4. Stream tokens from the LLM
                var promptSpec = chatClient.prompt().messages(history);
                if (request.resourceId() == null || request.resourceId().isBlank()) {
                    promptSpec = promptSpec.toolCallbacks(toolRegistry.getCallbacks());
                }

                promptSpec.stream()
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
                buildMessageHistory(conversation, request.message(), request.systemPrompt(), request.resourceId());

        ExecutionContext context = ExecutionContext.builder()
                .user(user)
                .conversationId(conversation.getId().toString())
                .build();
        ToolRegistry.setContext(context);
        try {
            var promptSpec = chatClient.prompt().messages(history);
            if (request.resourceId() == null || request.resourceId().isBlank()) {
                promptSpec = promptSpec.toolCallbacks(toolRegistry.getCallbacks());
            }

            String responseContent = promptSpec.call().content();

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
            AiConversation conversation, String newUserMessage, String systemPromptOverride, String resourceIdStr) {

        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        // System prompt
        String sysPrompt = (systemPromptOverride != null && !systemPromptOverride.isBlank())
                ? systemPromptOverride
                : aiProperties.getSystemPrompt();

        // Perform RAG document context extraction if resourceId is present
        String pdfContext = extractPdfContext(resourceIdStr, newUserMessage);
        if (pdfContext != null && !pdfContext.isBlank()) {
            sysPrompt = sysPrompt + "\n\nDOCUMENT CONTEXT FOR THIS CONVERSATION:\n" + pdfContext + 
                "\n\nIMPORTANT: Use the DOCUMENT CONTEXT above to answer the user's question. If the document context does not contain the answer, use your general knowledge, but clearly state you are adding external explanation.";
        }

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

    private String extractPdfContext(String resourceIdStr, String userQuery) {
        if (resourceIdStr == null || resourceIdStr.isBlank()) {
            return "";
        }
        try {
            UUID resourceId = UUID.fromString(resourceIdStr);
            List<com.abhiiterates.os.resource.ResourceAttachment> attachments = attachmentRepository.findByResourceId(resourceId);
            if (attachments == null || attachments.isEmpty()) {
                return "";
            }
            
            // Find the first PDF attachment
            com.abhiiterates.os.resource.ResourceAttachment pdfAttachment = null;
            for (com.abhiiterates.os.resource.ResourceAttachment att : attachments) {
                if (att.getContentType() != null && att.getContentType().toLowerCase().contains("pdf")) {
                    pdfAttachment = att;
                    break;
                }
            }
            
            if (pdfAttachment == null) {
                // Fallback to first attachment
                pdfAttachment = attachments.get(0);
            }
            
            String downloadUrl = pdfAttachment.getDownloadUrl();
            String uniqueFileName = null;
            if (downloadUrl.contains("/attachments/") && downloadUrl.contains("/download")) {
                uniqueFileName = downloadUrl.substring(
                        downloadUrl.lastIndexOf("/attachments/") + 13,
                        downloadUrl.lastIndexOf("/download")
                );
            } else {
                int lastSlash = downloadUrl.lastIndexOf('/');
                if (lastSlash >= 0) {
                    uniqueFileName = downloadUrl.substring(lastSlash + 1);
                } else {
                    uniqueFileName = downloadUrl;
                }
            }
            
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads").toAbsolutePath().normalize().resolve(uniqueFileName).normalize();
            java.io.File file = filePath.toFile();
            if (!file.exists()) {
                log.warn("PDF file not found on disk: {}", file.getAbsolutePath());
                return "";
            }
            
            // Extract text page by page using PDFBox
            List<String> chunks = new ArrayList<>();
            try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(file)) {
                int pageCount = document.getNumberOfPages();
                for (int i = 0; i < pageCount; i++) {
                    org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
                    stripper.setStartPage(i + 1);
                    stripper.setEndPage(i + 1);
                    String pageText = stripper.getText(document);
                    
                    if (pageText == null || pageText.isBlank()) {
                        continue;
                    }
                    
                    String[] paragraphs = pageText.split("\\n\\n+|\\r?\\n");
                    StringBuilder currentChunk = new StringBuilder();
                    int pageNum = i + 1;
                    
                    for (String para : paragraphs) {
                        String cleanPara = para.trim();
                        if (cleanPara.isEmpty()) continue;
                        
                        if (currentChunk.length() + cleanPara.length() > 800) {
                            chunks.add("[Page " + pageNum + "] " + currentChunk.toString());
                            currentChunk = new StringBuilder();
                        }
                        if (currentChunk.length() > 0) {
                            currentChunk.append(" ");
                        }
                        currentChunk.append(cleanPara);
                    }
                    if (currentChunk.length() > 0) {
                        chunks.add("[Page " + pageNum + "] " + currentChunk.toString());
                    }
                }
            }
            
            // Fallback: If page-by-page extraction yielded nothing, extract all text at once
            if (chunks.isEmpty()) {
                String fullText = "";
                try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(file)) {
                    org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
                    fullText = stripper.getText(document);
                }
                if (fullText != null && !fullText.isBlank()) {
                    String[] paragraphs = fullText.split("\\n\\n+|\\r?\\n");
                    StringBuilder currentChunk = new StringBuilder();
                    for (String para : paragraphs) {
                        String cleanPara = para.trim();
                        if (cleanPara.isEmpty()) continue;
                        if (currentChunk.length() + cleanPara.length() > 1000) {
                            chunks.add(currentChunk.toString());
                            currentChunk = new StringBuilder();
                        }
                        if (currentChunk.length() > 0) {
                            currentChunk.append(" ");
                        }
                        currentChunk.append(cleanPara);
                    }
                    if (currentChunk.length() > 0) {
                        chunks.add(currentChunk.toString());
                    }
                }
            }
            
            if (chunks.isEmpty()) {
                return "";
            }
            
            // Retrieve top 5 most relevant chunks using enhanced term matching
            final String queryLower = userQuery.toLowerCase();
            String cleanQuery = queryLower.replaceAll("[^a-zA-Z0-9\\s]", " ");
            String[] queryTerms = cleanQuery.split("\\s+");
            
            Set<String> stopWords = Set.of(
                "what", "where", "when", "how", "who", "which", "why", "this", "that", "these", "those",
                "then", "them", "their", "they", "with", "from", "some", "have", "been", "will", "would",
                "should", "could", "about", "other", "their", "there"
            );
            
            List<Map.Entry<String, Double>> scoredChunks = new ArrayList<>();
            for (String chunk : chunks) {
                double score = 0.0;
                String chunkLower = chunk.toLowerCase();
                
                if (chunkLower.contains(queryLower)) {
                    score += 15.0; // exact query phrase match
                }
                
                int matchedTerms = 0;
                for (String term : queryTerms) {
                    if (term.length() < 3 || stopWords.contains(term)) continue;
                    if (chunkLower.contains(term)) {
                        score += 2.0;
                        matchedTerms++;
                    }
                }
                
                if (matchedTerms > 1) {
                    score += matchedTerms * 2.0; // bonus for matching multiple terms
                }
                
                if (score > 0.0) {
                    scoredChunks.add(new java.util.AbstractMap.SimpleEntry<>(chunk, score));
                }
            }
            
            // Sort by relevance score descending
            scoredChunks.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
            
            // Format top chunks into context
            StringBuilder contextBuilder = new StringBuilder();
            contextBuilder.append("Here is the most relevant section/context retrieved from the PDF document '")
                          .append(pdfAttachment.getFileName()).append("':\n\n");
            
            int count = 0;
            for (Map.Entry<String, Double> entry : scoredChunks) {
                contextBuilder.append("--- CONTEXT SEGMENT ").append(count + 1).append(" ---\n")
                              .append(entry.getKey()).append("\n\n");
                count++;
                if (count >= 5) break;
            }
            
            if (count == 0) {
                contextBuilder.append("--- GENERAL DOCUMENT PREVIEW ---\n");
                int charsAdded = 0;
                for (String chunk : chunks) {
                    if (charsAdded + chunk.length() > 2000) break;
                    contextBuilder.append(chunk).append("\n\n");
                    charsAdded += chunk.length();
                }
            }
            
            return contextBuilder.toString();
        } catch (Exception e) {
            log.error("Failed to perform RAG text extraction", e);
            return "";
        }
    }

    /**
     * Persists user + assistant messages to the conversation.
     * Returns the saved assistant message (used as the response DTO source).
     */
    @Transactional
    protected AiMessage saveMessages(AiConversation conversation, String userContent, String assistantContent) {
        // Estimate token counts using the standard ~4 characters-per-token heuristic.
        // This is used as a proxy since the Groq streaming API does not return
        // per-message token usage in the SSE delta events.
        int userTokens     = Math.max(1, (int) Math.ceil(userContent.length()      / 4.0));
        int assistantTokens = Math.max(1, (int) Math.ceil(assistantContent.length() / 4.0));

        AiMessage userMsg = AiMessage.builder()
                .role(MessageRole.USER)
                .content(userContent)
                .tokenCount(userTokens)
                .conversation(conversation)
                .build();

        AiMessage assistantMsg = AiMessage.builder()
                .role(MessageRole.ASSISTANT)
                .content(assistantContent)
                .tokenCount(assistantTokens)
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
