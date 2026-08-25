package com.abhiiterates.os.ai.retrieval;

import com.abhiiterates.os.ai.embedding.config.RagEmbeddingProperties;
import com.abhiiterates.os.ai.retrieval.config.RagRetrievalProperties;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.repository.VectorSearchRepository;
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
import org.springframework.ai.embedding.EmbeddingModel;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RetrievalServiceImplTest {

    @Mock
    private VectorSearchRepository vectorSearchRepository;
    @Mock
    private EmbeddingModel embeddingModel;
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
    }

    @Test
    @DisplayName("retrieve with empty or null query returns empty list")
    void retrieve_withEmptyOrNullQuery_returnsEmptyList() {
        assertThat(retrievalService.retrieve("", testUser)).isEmpty();
        assertThat(retrievalService.retrieve("   ", testUser)).isEmpty();
        assertThat(retrievalService.retrieve((String) null, testUser)).isEmpty();

        verifyNoInteractions(embeddingModel, vectorSearchRepository);
    }

    @Test
    @DisplayName("retrieve with null user throws IllegalArgumentException")
    void retrieve_withNullUser_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> retrievalService.retrieve("deadlock", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("user context is required");

        verifyNoInteractions(embeddingModel, vectorSearchRepository);
    }

    @Test
    @DisplayName("retrieve with valid query generates query vector and returns repository hits")
    void retrieve_withValidQuery_generatesVectorAndReturnsHits() {
        when(embeddingProperties.getModel()).thenReturn("text-embedding-3-small");
        when(embeddingProperties.getDimensions()).thenReturn(3);
        when(retrievalProperties.getTopK()).thenReturn(5);
        when(retrievalProperties.getMaxTopK()).thenReturn(50);
        when(retrievalProperties.getSimilarityThreshold()).thenReturn(0.60);

        float[] queryVector = new float[]{0.1f, 0.2f, 0.3f};
        when(embeddingModel.embed("What is deadlock?")).thenReturn(queryVector);

        RetrievalResult hit = RetrievalResult.builder()
                .chunkId(UUID.randomUUID())
                .documentId(UUID.randomUUID())
                .resourceId(UUID.randomUUID())
                .documentTitle("OS Notes")
                .filename("os.pdf")
                .pageNumber(1)
                .chunkIndex(0)
                .text("Deadlock happens when processes wait for resources.")
                .similarityScore(0.92)
                .distanceScore(0.08)
                .build();

        when(vectorSearchRepository.searchSimilarChunks(
                eq(testUser.getId()),
                anyString(),
                eq(queryVector),
                eq("text-embedding-3-small"),
                eq(5),
                eq(0.60),
                isNull(),
                isNull()
        )).thenReturn(List.of(hit));

        List<RetrievalResult> results = retrievalService.retrieve("What is deadlock?", testUser);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).text()).contains("Deadlock happens");
        assertThat(results.get(0).similarityScore()).isEqualTo(0.92);

        verify(embeddingModel).embed("What is deadlock?");
    }

    @Test
    @DisplayName("retrieve when query vector dimension mismatches throws IllegalStateException")
    void retrieve_whenDimensionMismatches_throwsIllegalStateException() {
        when(embeddingProperties.getModel()).thenReturn("text-embedding-3-small");
        when(embeddingProperties.getDimensions()).thenReturn(1536); // Expect 1536
        when(retrievalProperties.getTopK()).thenReturn(5);
        when(retrievalProperties.getMaxTopK()).thenReturn(50);

        float[] wrongVector = new float[]{0.1f, 0.2f, 0.3f}; // Size 3
        when(embeddingModel.embed("deadlock")).thenReturn(wrongVector);

        assertThatThrownBy(() -> retrievalService.retrieve("deadlock", testUser))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Query vector dimension mismatch");

        verifyNoInteractions(vectorSearchRepository);
    }

    @Test
    @DisplayName("retrieve bounds topK to configured maximum limit")
    void retrieve_boundsTopKToMaxLimit() {
        when(embeddingProperties.getModel()).thenReturn("text-embedding-3-small");
        when(embeddingProperties.getDimensions()).thenReturn(3);
        when(retrievalProperties.getTopK()).thenReturn(5);
        when(retrievalProperties.getMaxTopK()).thenReturn(10); // Max 10
        when(retrievalProperties.getSimilarityThreshold()).thenReturn(0.5);

        when(embeddingModel.embed("deadlock")).thenReturn(new float[]{0.1f, 0.2f, 0.3f});
        when(vectorSearchRepository.searchSimilarChunks(any(), any(), any(), any(), eq(10), anyDouble(), any(), any()))
                .thenReturn(List.of());

        RetrievalRequest request = RetrievalRequest.builder()
                .query("deadlock")
                .topK(100) // Client requests 100
                .build();

        retrievalService.retrieve(request, testUser);

        // Verify topK was capped to maxTopK (10)
        verify(vectorSearchRepository).searchSimilarChunks(
                eq(testUser.getId()), any(), any(), any(), eq(10), eq(0.5), any(), any());
    }
}
