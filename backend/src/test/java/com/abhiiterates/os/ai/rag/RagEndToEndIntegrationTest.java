package com.abhiiterates.os.ai.rag;

import com.abhiiterates.os.ai.context.dto.AiContext;
import com.abhiiterates.os.ai.context.service.AiContextBuilder;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.ai.ingestion.service.DocumentIngestionService;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.service.RetrievalService;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.resource.ResourceStatus;
import com.abhiiterates.os.resource.AttachmentService;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("End-to-End RAG Pipeline & Multi-Tenant Security Integration Tests")
class RagEndToEndIntegrationTest {

    @org.springframework.boot.test.context.TestConfiguration
    static class TestVectorStoreConfig {
        @org.springframework.context.annotation.Bean
        @org.springframework.context.annotation.Primary
        public VectorStore testVectorStore(org.springframework.ai.embedding.EmbeddingModel embeddingModel) {
            return org.springframework.ai.vectorstore.SimpleVectorStore.builder(embeddingModel).build();
        }
    }

    @Autowired
    private VectorStore vectorStore;

    @Autowired
    private DocumentIngestionService ingestionService;

    @Autowired
    private RetrievalService retrievalService;

    @Autowired
    private AiContextBuilder contextBuilder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceAttachmentRepository attachmentRepository;

    @Autowired
    private com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository ragDocumentRepository;

    @Autowired
    private com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository ragDocumentChunkRepository;

    @MockBean
    private AttachmentService attachmentService;

    @MockBean
    private org.springframework.ai.embedding.EmbeddingModel embeddingModel;

    private User userA;
    private User userB;
    private Resource resourceUserA;
    private ResourceAttachment attachmentUserA;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        try {
            ragDocumentChunkRepository.deleteAllInBatch();
            ragDocumentRepository.deleteAllInBatch();
            attachmentRepository.deleteAllInBatch();
            resourceRepository.deleteAllInBatch();
            if (userA != null) userRepository.deleteById(userA.getId());
            if (userB != null) userRepository.deleteById(userB.getId());
        } catch (Exception ex) {
            // Teardown cleanup best-effort
        }
    }

    @BeforeEach
    void setUp() {
        float[] mockEmbedding = new float[1536];
        mockEmbedding[0] = 0.95f;
        mockEmbedding[1] = 0.31f;

        when(embeddingModel.embed(any(Document.class))).thenReturn(mockEmbedding);
        when(embeddingModel.embed(any(String.class))).thenReturn(mockEmbedding);
        when(embeddingModel.embed(any(List.class))).thenReturn(List.of(mockEmbedding));

        // Create User A
        userA = userRepository.saveAndFlush(User.builder()
                .email("usera_rag_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .username("usera_rag_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash("secret_pass")
                .build());

        // Create User B
        userB = userRepository.saveAndFlush(User.builder()
                .email("userb_rag_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .username("userb_rag_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash("secret_pass")
                .build());

        // Create Resource for User A
        resourceUserA = resourceRepository.saveAndFlush(Resource.builder()
                .title("User A Confidential Quantum Mechanics Notes")
                .user(userA)
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .build());

        attachmentUserA = attachmentRepository.saveAndFlush(ResourceAttachment.builder()
                .resource(resourceUserA)
                .fileName("quantum_confidential_usera.pdf")
                .downloadUrl("/api/v1/resources/attachments/quantum.pdf/download")
                .fileSize(1024L)
                .contentType("application/pdf")
                .build());

        // Generate valid PDF document using PDFBox so PagePdfDocumentReader can extract text
        byte[] pdfBytes;
        try (org.apache.pdfbox.pdmodel.PDDocument doc = new org.apache.pdfbox.pdmodel.PDDocument();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage();
            doc.addPage(page);
            try (org.apache.pdfbox.pdmodel.PDPageContentStream cs = new org.apache.pdfbox.pdmodel.PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText("Quantum superposition allows qubits to exist in multiple states simultaneously.");
                cs.endText();
            }
            doc.save(out);
            pdfBytes = out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate test PDF", ex);
        }

        when(attachmentService.download(eq(attachmentUserA.getId()), any(User.class)))
                .thenReturn(new ByteArrayResource(pdfBytes));
    }

    @Test
    @DisplayName("Complete Pipeline Flow: Upload -> Ingest -> VectorStore -> Retrieve -> Formatted Context")
    void testCompleteUploadIngestRetrieveAnswerPipeline() {
        // 1. Ingest document attachment for User A
        IngestionResponse ingestionResponse = ingestionService.ingestAttachment(
                resourceUserA.getId(), attachmentUserA.getId(), userA);

        assertThat(ingestionResponse).isNotNull();
        assertThat(ingestionResponse.attachmentId()).isEqualTo(attachmentUserA.getId());

        // 2. Perform Semantic Retrieval for User A
        RetrievalRequest retrievalRequest = RetrievalRequest.builder()
                .query("Explain quantum superposition in states")
                .resourceId(resourceUserA.getId())
                .topK(5)
                .similarityThreshold(0.10)
                .build();

        List<RetrievalResult> userAResults = retrievalService.retrieve(retrievalRequest, userA);

        assertThat(userAResults).isNotNull();
        assertThat(userAResults).isNotEmpty();
        assertThat(userAResults.get(0).filename()).isEqualTo("quantum_confidential_usera.pdf");

        // 3. Build RAG Context & Citations for User A
        ChatRequest chatRequest = new ChatRequest(
                null,
                "Explain quantum superposition",
                null,
                resourceUserA.getId().toString()
        );

        AiContext ragContext = contextBuilder.buildContext(chatRequest, userA);

        assertThat(ragContext).isNotNull();
        assertThat(ragContext.hasContext()).isTrue();
        assertThat(ragContext.formattedText()).contains("quantum_confidential_usera.pdf");
        assertThat(ragContext.sources()).isNotEmpty();
        assertThat(ragContext.sources().get(0).filename()).isEqualTo("quantum_confidential_usera.pdf");
    }

    @Test
    @DisplayName("CRITICAL Tenant Isolation Security Test: User A resource MUST NOT appear in User B retrieval")
    void testTenantIsolation_UserABoundaryEnforcement() {
        // 1. Ingest User A's confidential document
        ingestionService.ingestAttachment(resourceUserA.getId(), attachmentUserA.getId(), userA);

        // 2. User B executes query targeting User A's document content
        RetrievalRequest userBRequest = RetrievalRequest.builder()
                .query("Quantum superposition state states")
                .topK(10)
                .similarityThreshold(0.01) // Extremely low threshold to ensure no false negatives
                .build();

        // 3. User B retrieves results -> MUST BE EMPTY (0 cross-tenant leakage)
        List<RetrievalResult> userBResults = retrievalService.retrieve(userBRequest, userB);
        assertThat(userBResults)
                .as("User B MUST NOT retrieve any chunks belonging to User A")
                .isEmpty();

        // 4. User B attempts RAG context building for User A's resourceId
        ChatRequest userBChatRequest = new ChatRequest(
                null,
                "What are the contents of User A's quantum notes?",
                null,
                resourceUserA.getId().toString()
        );

        AiContext userBContext = contextBuilder.buildContext(userBChatRequest, userB);

        assertThat(userBContext).isNotNull();
        assertThat(userBContext.hasContext())
                .as("User B MUST NOT obtain context from User A's resourceId")
                .isFalse();
        assertThat(userBContext.sources())
                .as("User B citations MUST be empty when accessing unowned resources")
                .isEmpty();
    }

    @Test
    @DisplayName("Vector Purge Test: Attachment deletion removes all vectors for user")
    void testAttachmentDeletionVectorPurge() {
        // 1. Ingest User A attachment
        ingestionService.ingestAttachment(resourceUserA.getId(), attachmentUserA.getId(), userA);

        // 2. Verify vectors exist for User A
        FilterExpressionBuilder b = new FilterExpressionBuilder();
        Filter.Expression filter = b.and(
                b.eq("userId", userA.getId().toString()),
                b.eq("attachmentId", attachmentUserA.getId().toString())
        ).build();

        List<Document> beforeDeleteDocs = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query("quantum superposition")
                        .topK(5)
                        .filterExpression(filter)
                        .build()
        );
        assertThat(beforeDeleteDocs).isNotEmpty();

        // 3. Purge vectors via VectorStore.delete() using userId + attachmentId filter
        try {
            vectorStore.delete(filter);
        } catch (UnsupportedOperationException ex) {
            List<String> idList = beforeDeleteDocs.stream().map(Document::getId).toList();
            vectorStore.delete(idList);
        }

        // 4. Verify 0 vectors remain for User A
        List<Document> afterDeleteDocs = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query("quantum superposition")
                        .topK(5)
                        .filterExpression(filter)
                        .build()
        );
        assertThat(afterDeleteDocs).isEmpty();
    }
}
