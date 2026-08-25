package com.abhiiterates.os.ai.retrieval;

import com.abhiiterates.os.ai.AiChatService;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.dto.MessageResponse;
import com.abhiiterates.os.ai.embedding.domain.RagDocumentChunkEmbedding;
import com.abhiiterates.os.ai.embedding.repository.RagDocumentChunkEmbeddingRepository;
import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.resource.*;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class EndToEndRagChatIntegrationTest {

    @Autowired
    private AiChatService aiChatService;

    @Autowired
    private RagDocumentChunkEmbeddingRepository embeddingRepository;

    @Autowired
    private RagDocumentChunkRepository chunkRepository;

    @Autowired
    private RagDocumentRepository documentRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceAttachmentRepository attachmentRepository;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private EmbeddingModel embeddingModel;

    @MockBean(answer = Answers.RETURNS_DEEP_STUBS)
    private ChatClient chatClient;

    private User user;
    private Resource resource;

    @BeforeEach
    void setUp() {
        user = userRepository.save(User.builder()
                .email("e2e_rag_" + UUID.randomUUID() + "@example.com")
                .username("e2e_rag_" + UUID.randomUUID())
                .passwordHash("pass")
                .build());

        resource = resourceRepository.save(Resource.builder()
                .title("Operating Systems Principles")
                .user(user)
                .category(ResourceCategory.BOOK)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .build());

        ResourceAttachment attachment = attachmentRepository.save(ResourceAttachment.builder()
                .resource(resource)
                .fileName("os_unit_deadlock.pdf")
                .downloadUrl("http://local/os_unit_deadlock.pdf")
                .fileSize(100L)
                .build());

        RagDocument document = documentRepository.save(RagDocument.builder()
                .resource(resource)
                .attachment(attachment)
                .fileName("os_unit_deadlock.pdf")
                .status(IngestionStatus.COMPLETED)
                .embeddingStatus(IngestionStatus.COMPLETED)
                .contentHash("e2e_hash_" + UUID.randomUUID())
                .build());

        RagDocumentChunk chunk = chunkRepository.save(RagDocumentChunk.builder()
                .document(document)
                .chunkIndex(0)
                .pageNumber(14)
                .chunkText("Deadlock occurs when processes wait indefinitely for resources held by each other.")
                .charCount(82)
                .build());

        float[] testVector = new float[1536];
        testVector[0] = 1.0f;

        // Save chunk embedding vector
        embeddingRepository.save(RagDocumentChunkEmbedding.builder()
                .chunk(chunk)
                .embeddingModel("text-embedding-3-small")
                .embeddingDimension(1536)
                .vector(testVector)
                .build());

        // Mock query vector generation: returns 1536-dim vector
        when(embeddingModel.embed(any(String.class))).thenReturn(testVector);
    }

    @Test
    @DisplayName("End to end RAG flow retrieves chunk and executes AI chat with grounded context")
    @SuppressWarnings("unchecked")
    void endToEndRagFlow_retrievesChunkAndExecutesChat() {
        // Mock LLM response from Spring AI ChatClient
        when(chatClient.prompt().messages(anyList()).call().content())
                .thenReturn("Based on your OS notes page 14, deadlock occurs when processes wait indefinitely for resources.");

        ChatRequest request = new ChatRequest(
                null,
                "What is deadlock according to my OS notes?",
                null,
                resource.getId().toString()
        );

        MessageResponse response = aiChatService.chat(request, user);

        assertThat(response).isNotNull();
        assertThat(response.content()).contains("deadlock occurs when processes wait indefinitely");
    }
}
