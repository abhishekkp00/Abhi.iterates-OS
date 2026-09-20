package com.abhiiterates.os.ai.memory;

import com.abhiiterates.os.ai.AiConversation;
import com.abhiiterates.os.ai.AiConversationRepository;
import com.abhiiterates.os.ai.AiMessage;
import com.abhiiterates.os.ai.AiMessageRepository;
import com.abhiiterates.os.ai.MessageRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PersistentAiChatMemoryRepository — bridges Spring AI's ChatMemoryRepository
 * to the existing JPA database persistence (AiConversation and AiMessage tables).
 *
 * Security & Isolation Invariants:
 *  - Conversation messages are ordered strictly by createdAt ascending.
 *  - Only USER and ASSISTANT messages are persisted in chat history.
 *  - No vector embeddings, RAG chunks, or tokens/keys are stored in chat messages.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PersistentAiChatMemoryRepository implements ChatMemoryRepository {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

    @Override
    @Transactional(readOnly = true)
    public List<String> findConversationIds() {
        return conversationRepository.findAll().stream()
                .map(conv -> conv.getId().toString())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Message> findByConversationId(String conversationId) {
        UUID convId = parseUuid(conversationId);
        if (convId == null) {
            return List.of();
        }

        List<AiMessage> entityMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(convId);
        List<Message> springAiMessages = new ArrayList<>(entityMessages.size());

        for (AiMessage msg : entityMessages) {
            if (msg.getRole() == MessageRole.USER) {
                springAiMessages.add(new UserMessage(msg.getContent()));
            } else if (msg.getRole() == MessageRole.ASSISTANT) {
                springAiMessages.add(new AssistantMessage(msg.getContent()));
            }
        }

        log.debug("Restored {} Spring AI chat messages for conversation [{}]",
                springAiMessages.size(), conversationId);

        return springAiMessages;
    }

    @Override
    @Transactional
    public void saveAll(String conversationId, List<Message> messages) {
        UUID convId = parseUuid(conversationId);
        if (convId == null || messages == null || messages.isEmpty()) {
            return;
        }

        AiConversation conversation = conversationRepository.findById(convId).orElse(null);
        if (conversation == null) {
            log.warn("Cannot save chat memory: AiConversation not found for ID [{}]", conversationId);
            return;
        }

        List<AiMessage> existingEntities = messageRepository.findByConversationIdOrderByCreatedAtAsc(convId);
        int existingCount = existingEntities.size();

        // Avoid re-persisting already saved messages
        for (int i = existingCount; i < messages.size(); i++) {
            Message springMsg = messages.get(i);
            MessageRole role = null;

            if (springMsg.getMessageType() == MessageType.USER) {
                role = MessageRole.USER;
            } else if (springMsg.getMessageType() == MessageType.ASSISTANT) {
                role = MessageRole.ASSISTANT;
            }

            if (role != null) {
                String content = springMsg.getText() != null ? springMsg.getText() : "";
                int tokenEstimate = Math.max(1, (int) Math.ceil(content.length() / 4.0));

                AiMessage entity = AiMessage.builder()
                        .conversation(conversation)
                        .role(role)
                        .content(content)
                        .tokenCount(tokenEstimate)
                        .build();

                messageRepository.save(entity);
            }
        }
    }

    @Override
    @Transactional
    public void deleteByConversationId(String conversationId) {
        UUID convId = parseUuid(conversationId);
        if (convId != null) {
            conversationRepository.findById(convId).ifPresent(conversationRepository::delete);
        }
    }

    private UUID parseUuid(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            return UUID.fromString(str.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
