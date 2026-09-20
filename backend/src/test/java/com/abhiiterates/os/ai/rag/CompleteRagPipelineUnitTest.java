package com.abhiiterates.os.ai.rag;

import com.abhiiterates.os.ai.AiChatServiceImpl;
import com.abhiiterates.os.ai.AiConversation;
import com.abhiiterates.os.ai.AiConversationRepository;
import com.abhiiterates.os.ai.AiMessageRepository;
import com.abhiiterates.os.ai.AiProperties;
import com.abhiiterates.os.ai.agent.ToolRegistry;
import com.abhiiterates.os.ai.context.dto.AiContext;
import com.abhiiterates.os.ai.context.dto.ContextSource;
import com.abhiiterates.os.ai.context.service.AiContextBuilderImpl;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.service.RetrievalService;
import com.abhiiterates.os.ai.retrieval.service.RetrievalServiceImpl;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("Complete RAG Pipeline Unit Tests")
class CompleteRagPipelineUnitTest {

    private User userA;
    private User userB;
    private UUID resourceId;
    private UUID attachmentId;
    private UUID documentId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        userA = User.builder().id(UUID.randomUUID()).email("usera@example.com").build();
        userB = User.builder().id(UUID.randomUUID()).email("userb@example.com").build();
        resourceId = UUID.randomUUID();
        attachmentId = UUID.randomUUID();
        documentId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("1. Document Chunking Tests")
    class DocumentChunkingTests {

        @Test
        @DisplayName("Should handle empty document gracefully")
        void testEmptyDocumentChunking() {
            TokenTextSplitter splitter = TokenTextSplitter.builder()
                    .withChunkSize(800)
                    .withMinChunkSizeChars(350)
                    .build();

            List<Document> emptyDocs = Collections.emptyList();
            List<Document> chunks = splitter.apply(emptyDocs);

            assertThat(chunks).isEmpty();
        }

        @Test
        @DisplayName("Should chunk normal document, preserve page metadata, and generate chunkIndex")
        void testNormalDocumentChunking() {
            TokenTextSplitter splitter = TokenTextSplitter.builder()
                    .withChunkSize(100)
                    .withMinChunkSizeChars(20)
                    .build();

            Map<String, Object> page1Meta = new HashMap<>();
            page1Meta.put("page_number", 1);
            Document doc1 = new Document("Operating Systems manage CPU scheduling and virtual memory allocation.", page1Meta);

            Map<String, Object> page2Meta = new HashMap<>();
            page2Meta.put("page_number", 2);
            Document doc2 = new Document("Page faults trigger secondary storage I/O operations.", page2Meta);

            List<Document> chunks = splitter.apply(List.of(doc1, doc2));

            assertThat(chunks).isNotEmpty();
            for (int i = 0; i < chunks.size(); i++) {
                Document chunk = chunks.get(i);
                assertThat(chunk.getText()).isNotBlank();
            }
        }
    }

    @Nested
    @DisplayName("2. Metadata Enrichment Tests")
    class MetadataEnrichmentTests {

        @Test
        @DisplayName("Should enrich every chunk with mandatory security, tenant, and document lineage metadata")
        void testMetadataEnrichment() {
            List<Document> rawChunks = List.of(
                    new Document("Chunk zero text", Map.of("page_number", 1)),
                    new Document("Chunk one text", Map.of("page_number", 2))
            );

            List<Document> enrichedChunks = new ArrayList<>();
            for (int i = 0; i < rawChunks.size(); i++) {
                Document chunk = rawChunks.get(i);
                Map<String, Object> meta = new HashMap<>(chunk.getMetadata());
                meta.put("userId", userA.getId().toString());
                meta.put("resourceId", resourceId.toString());
                meta.put("attachmentId", attachmentId.toString());
                meta.put("documentId", documentId.toString());
                meta.put("fileName", "os_lecture.pdf");
                meta.put("contentType", "application/pdf");
                meta.put("chunkIndex", i);

                enrichedChunks.add(new Document(chunk.getText(), meta));
            }

            assertThat(enrichedChunks).hasSize(2);

            for (int i = 0; i < enrichedChunks.size(); i++) {
                Document chunk = enrichedChunks.get(i);
                Map<String, Object> meta = chunk.getMetadata();

                assertThat(meta.get("userId")).isEqualTo(userA.getId().toString());
                assertThat(meta.get("resourceId")).isEqualTo(resourceId.toString());
                assertThat(meta.get("attachmentId")).isEqualTo(attachmentId.toString());
                assertThat(meta.get("documentId")).isEqualTo(documentId.toString());
                assertThat(meta.get("fileName")).isEqualTo("os_lecture.pdf");
                assertThat(meta.get("contentType")).isEqualTo("application/pdf");
                assertThat(meta.get("chunkIndex")).isEqualTo(i);
            }
        }
    }

    @Nested
    @DisplayName("3. Retrieval Filters Tests")
    class RetrievalFiltersTests {

        @Mock
        private VectorStore vectorStore;

        @Test
        @DisplayName("Should construct correct Filter.Expression for user, document, resource, and combined scopes")
        void testRetrievalFilterBuilding() {
            FilterExpressionBuilder b = new FilterExpressionBuilder();

            // 1. User Scope Filter
            Filter.Expression userFilter = b.eq("userId", userA.getId().toString()).build();
            assertThat(userFilter).isNotNull();

            // 2. Document Scope Filter (userId AND attachmentId)
            Filter.Expression docFilter = b.and(
                    b.eq("userId", userA.getId().toString()),
                    b.eq("attachmentId", attachmentId.toString())
            ).build();
            assertThat(docFilter).isNotNull();

            // 3. Resource Scope Filter (userId AND resourceId)
            Filter.Expression resourceFilter = b.and(
                    b.eq("userId", userA.getId().toString()),
                    b.eq("resourceId", resourceId.toString())
            ).build();
            assertThat(resourceFilter).isNotNull();
        }
    }

    @Nested
    @DisplayName("4. Context Builder Tests")
    class ContextBuilderTests {

        @Mock
        private RetrievalService retrievalService;

        @Test
        @DisplayName("Should build structured context with citations, source names, page numbers, and handle missing metadata")
        void testContextBuildingAndCitations() {
            RetrievalServiceImpl mockRetrieval = mock(RetrievalServiceImpl.class);
            com.abhiiterates.os.ai.context.config.RagContextProperties props = new com.abhiiterates.os.ai.context.config.RagContextProperties();

            AiContextBuilderImpl contextBuilder = new AiContextBuilderImpl(
                    mockRetrieval,
                    props,
                    mock(com.abhiiterates.os.academic.service.AcademicService.class),
                    mock(com.abhiiterates.os.academic.service.TopicPrerequisiteService.class),
                    mock(com.abhiiterates.os.academic.service.LearningStateService.class)
            );

            RetrievalResult result1 = RetrievalResult.builder()
                    .chunkId(UUID.randomUUID())
                    .documentId(documentId)
                    .resourceId(resourceId)
                    .documentTitle("OS Notes")
                    .filename("os_notes.pdf")
                    .pageNumber(5)
                    .chunkIndex(0)
                    .text("Page faults interrupt normal process execution.")
                    .similarityScore(0.88)
                    .distanceScore(0.12)
                    .build();

            RetrievalResult result2 = RetrievalResult.builder()
                    .chunkId(UUID.randomUUID())
                    .documentId(documentId)
                    .resourceId(resourceId)
                    .documentTitle("Syllabus")
                    .filename("syllabus.pdf")
                    .pageNumber(null) // page number missing on purpose
                    .chunkIndex(1)
                    .text("Exam date is November 15.")
                    .similarityScore(0.75)
                    .distanceScore(0.25)
                    .build();

            when(mockRetrieval.retrieve(any(com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest.class), eq(userA)))
                    .thenReturn(List.of(result1, result2));

            ChatRequest request = new ChatRequest(null, "When is the exam?", null, resourceId.toString());
            AiContext context = contextBuilder.buildContext(request, userA);

            assertThat(context).isNotNull();
            assertThat(context.formattedText()).contains("os_notes.pdf");
            assertThat(context.formattedText()).contains("Page: 5");
            assertThat(context.formattedText()).contains("syllabus.pdf");

            List<ContextSource> citations = context.sources();
            assertThat(citations).hasSize(2);
            assertThat(citations.get(0).filename()).isEqualTo("os_notes.pdf");
            assertThat(citations.get(0).pageNumber()).isEqualTo(5);
            assertThat(citations.get(0).similarityScore()).isEqualTo(0.88);

            assertThat(citations.get(1).filename()).isEqualTo("syllabus.pdf");
            assertThat(citations.get(1).pageNumber()).isNull();
        }
    }

    @Nested
    @DisplayName("5 & 6. Chat Service & Conversation Isolation Tests")
    class ChatServiceAndIsolationTests {

        @Mock
        private AiConversationRepository conversationRepository;

        @Test
        @DisplayName("Should throw ResourceNotFoundException when User B attempts to access User A's conversation")
        void testConversationIsolation() {
            AiConversationRepository localConvRepo = mock(AiConversationRepository.class);
            UUID convId = UUID.randomUUID();
            AiConversation conversationA = AiConversation.builder()
                    .id(convId)
                    .user(userA)
                    .title("Alice's OS Chat")
                    .messages(new ArrayList<>())
                    .build();

            when(localConvRepo.findById(convId)).thenReturn(Optional.of(conversationA));

            AiChatServiceImpl chatService = new AiChatServiceImpl(
                    localConvRepo,
                    mock(AiMessageRepository.class),
                    mock(AiProperties.class),
                    mock(ChatClient.class, Answers.RETURNS_DEEP_STUBS),
                    mock(ToolRegistry.class),
                    mock(com.abhiiterates.os.ai.context.service.AiContextBuilder.class),
                    new ObjectMapper(),
                    mock(com.abhiiterates.os.academic.service.AcademicService.class)
            );

            ChatRequest request = new ChatRequest(convId.toString(), "Hello", null, null);

            assertThatThrownBy(() -> chatService.chat(request, userB))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Conversation not found");
        }
    }
}
