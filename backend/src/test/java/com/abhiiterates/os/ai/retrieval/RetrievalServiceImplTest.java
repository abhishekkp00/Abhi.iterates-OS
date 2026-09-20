package com.abhiiterates.os.ai.retrieval;

import com.abhiiterates.os.ai.embedding.config.RagEmbeddingProperties;
import com.abhiiterates.os.ai.retrieval.config.RagRetrievalProperties;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.service.RetrievalServiceImpl;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RetrievalServiceImplTest {

    @Mock
    private VectorStore vectorStore;
    @Mock
    private RagEmbeddingProperties embeddingProperties;
    @Mock
    private RagRetrievalProperties retrievalProperties;

    @InjectMocks
    private RetrievalServiceImpl retrievalService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(UUID.randomUUID()).email("user@example.com").build();
        when(embeddingProperties.isEnabled()).thenReturn(true);
    }

    @Test
    @DisplayName("retrieve with empty or null query returns empty list")
    void retrieve_withEmptyOrNullQuery_returnsEmptyList() {
        assertThat(retrievalService.retrieve("", testUser)).isEmpty();
        assertThat(retrievalService.retrieve("   ", testUser)).isEmpty();
        assertThat(retrievalService.retrieve((String) null, testUser)).isEmpty();

        verifyNoInteractions(vectorStore);
    }

    @Test
    @DisplayName("retrieve with null user throws IllegalArgumentException")
    void retrieve_withNullUser_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> retrievalService.retrieve("deadlock", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("user context is required");

        verifyNoInteractions(vectorStore);
    }

    @Test
    @DisplayName("retrieve with valid query executes similaritySearch on VectorStore and maps documents")
    void retrieve_withValidQuery_executesSearchAndReturnsHits() {
        when(retrievalProperties.getTopK()).thenReturn(5);
        when(retrievalProperties.getMaxTopK()).thenReturn(50);
        when(retrievalProperties.getSimilarityThreshold()).thenReturn(0.60);

        UUID docId = UUID.randomUUID();
        UUID resId = UUID.randomUUID();

        Document springAiDoc = Document.builder()
                .id("chunk-123")
                .text("Deadlock happens when processes wait for resources.")
                .metadata(Map.of(
                        "userId", testUser.getId().toString(),
                        "documentId", docId.toString(),
                        "resourceId", resId.toString(),
                        "documentTitle", "OS Notes",
                        "fileName", "os.pdf",
                        "pageNumber", 1,
                        "chunkIndex", 0,
                        "distance", 0.08
                ))
                .score(0.92)
                .build();

        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of(springAiDoc));

        List<RetrievalResult> results = retrievalService.retrieve("What is deadlock?", testUser);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).text()).contains("Deadlock happens");
        assertThat(results.get(0).similarityScore()).isEqualTo(0.92);
        assertThat(results.get(0).documentTitle()).isEqualTo("OS Notes");

        verify(vectorStore).similaritySearch(any(SearchRequest.class));
    }

    @Test
    @DisplayName("retrieve bounds topK to configured maximum limit")
    void retrieve_boundsTopKToMaxLimit() {
        when(retrievalProperties.getTopK()).thenReturn(5);
        when(retrievalProperties.getMaxTopK()).thenReturn(10); // Max 10
        when(retrievalProperties.getSimilarityThreshold()).thenReturn(0.5);

        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of());

        RetrievalRequest request = RetrievalRequest.builder()
                .query("deadlock")
                .topK(100) // Client requests 100
                .build();

        retrievalService.retrieve(request, testUser);

        verify(vectorStore).similaritySearch(any(SearchRequest.class));
    }
}
