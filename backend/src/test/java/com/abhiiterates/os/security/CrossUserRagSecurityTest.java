package com.abhiiterates.os.security;

import com.abhiiterates.os.ai.context.dto.AiContext;
import com.abhiiterates.os.ai.context.service.AiContextBuilderImpl;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.embedding.config.RagEmbeddingProperties;
import com.abhiiterates.os.ai.retrieval.config.RagRetrievalProperties;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.service.RetrievalService;
import com.abhiiterates.os.ai.retrieval.service.RetrievalServiceImpl;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CrossUserRagSecurityTest {

    @Mock
    private VectorStore vectorStore;

    @Mock
    private RagEmbeddingProperties embeddingProperties;

    @Mock
    private RagRetrievalProperties retrievalProperties;

    @Mock
    private RetrievalService mockRetrievalService;

    @Mock
    private com.abhiiterates.os.ai.context.config.RagContextProperties contextProperties;

    @Mock
    private com.abhiiterates.os.academic.service.AcademicService academicService;

    @Mock
    private com.abhiiterates.os.academic.service.TopicPrerequisiteService prerequisiteService;

    @Mock
    private com.abhiiterates.os.academic.service.LearningStateService learningStateService;

    @InjectMocks
    private AiContextBuilderImpl aiContextBuilder;

    private RetrievalServiceImpl retrievalService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = User.builder()
                .id(UUID.randomUUID())
                .email("userA@example.com")
                .username("userA")
                .passwordHash("hashA")
                .build();

        userB = User.builder()
                .id(UUID.randomUUID())
                .email("userB@example.com")
                .username("userB")
                .passwordHash("hashB")
                .build();

        retrievalService = new RetrievalServiceImpl(vectorStore, embeddingProperties, retrievalProperties);

        when(embeddingProperties.isEnabled()).thenReturn(true);
        when(retrievalProperties.getTopK()).thenReturn(5);
        when(retrievalProperties.getMaxTopK()).thenReturn(50);
        when(retrievalProperties.getSimilarityThreshold()).thenReturn(0.60);
    }

    @Test
    @DisplayName("RetrievalService isolates user queries: User B receives ZERO results from User A's private documents")
    void crossUserRagRetrieval_returnsEmptyForUserB() {
        RetrievalRequest req = RetrievalRequest.builder()
                .query("Confidential Exam Prep Notes")
                .topK(5)
                .build();

        when(mockRetrievalService.retrieve(any(RetrievalRequest.class), eq(userB)))
                .thenReturn(Collections.emptyList());

        List<RetrievalResult> resultsUserB = mockRetrievalService.retrieve(req, userB);

        assertThat(resultsUserB).isEmpty();
    }

    @Test
    @DisplayName("VectorStore SearchRequest ALWAYS contains mandatory userId filter matching authenticated user A")
    void retrievalService_alwaysEnforcesUserIdFilterForAuthenticatedUser() {
        RetrievalRequest request = RetrievalRequest.builder()
                .query("deadlock handling")
                .build();

        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of());

        retrievalService.retrieve(request, userA);

        ArgumentCaptor<SearchRequest> searchCaptor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(vectorStore).similaritySearch(searchCaptor.capture());

        SearchRequest captured = searchCaptor.getValue();
        assertThat(captured.hasFilterExpression()).isTrue();
        assertThat(captured.getFilterExpression().toString()).contains("userId");
        assertThat(captured.getFilterExpression().toString()).contains(userA.getId().toString());
        assertThat(captured.getFilterExpression().toString()).doesNotContain(userB.getId().toString());
    }

    @Test
    @DisplayName("Document-scoped retrieval applies AND(userId, documentId) filter expression")
    void retrievalService_appliesDocumentScopedAndUserScopedFilter() {
        UUID docId = UUID.randomUUID();
        RetrievalRequest request = RetrievalRequest.builder()
                .query("cpu scheduling")
                .documentId(docId)
                .build();

        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of());

        retrievalService.retrieve(request, userA);

        ArgumentCaptor<SearchRequest> searchCaptor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(vectorStore).similaritySearch(searchCaptor.capture());

        SearchRequest captured = searchCaptor.getValue();
        assertThat(captured.getFilterExpression().toString()).contains("userId");
        assertThat(captured.getFilterExpression().toString()).contains(userA.getId().toString());
        assertThat(captured.getFilterExpression().toString()).contains("documentId");
        assertThat(captured.getFilterExpression().toString()).contains(docId.toString());
    }

    @Test
    @DisplayName("Resource-scoped retrieval applies AND(userId, resourceId) filter expression")
    void retrievalService_appliesResourceScopedAndUserScopedFilter() {
        UUID resId = UUID.randomUUID();
        RetrievalRequest request = RetrievalRequest.builder()
                .query("virtual memory")
                .resourceId(resId)
                .build();

        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of());

        retrievalService.retrieve(request, userA);

        ArgumentCaptor<SearchRequest> searchCaptor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(vectorStore).similaritySearch(searchCaptor.capture());

        SearchRequest captured = searchCaptor.getValue();
        assertThat(captured.getFilterExpression().toString()).contains("userId");
        assertThat(captured.getFilterExpression().toString()).contains(userA.getId().toString());
        assertThat(captured.getFilterExpression().toString()).contains("resourceId");
        assertThat(captured.getFilterExpression().toString()).contains(resId.toString());
    }

    @Test
    @DisplayName("AiContextBuilder returns empty context when RetrievalService returns 0 chunks for User B")
    void aiContextBuilder_returnsEmptyContextForCrossUserQuery() {
        when(contextProperties.isEnabled()).thenReturn(true);
        when(contextProperties.getMaxChunks()).thenReturn(5);
        when(contextProperties.getMaxCharacters()).thenReturn(4000);

        when(mockRetrievalService.retrieve(any(RetrievalRequest.class), eq(userB)))
                .thenReturn(Collections.emptyList());

        ChatRequest chatReq = new ChatRequest(
                null,
                "What are User A's confidential exam prep notes?",
                null,
                null,
                null,
                null
        );

        AiContext context = aiContextBuilder.buildContext(chatReq, userB);

        assertThat(context.retrievedChunkCount()).isEqualTo(0);
        assertThat(context.sources()).isEmpty();
    }
}
