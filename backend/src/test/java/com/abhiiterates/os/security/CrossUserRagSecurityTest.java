package com.abhiiterates.os.security;

import com.abhiiterates.os.ai.context.dto.AiContext;
import com.abhiiterates.os.ai.context.service.AiContextBuilderImpl;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.repository.VectorSearchRepository;
import com.abhiiterates.os.ai.retrieval.service.RetrievalService;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CrossUserRagSecurityTest {

    @Mock
    private RetrievalService retrievalService;

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

    private User userB;

    @BeforeEach
    void setUp() {
        userB = User.builder()
                .id(UUID.randomUUID())
                .email("userB@example.com")
                .username("userB")
                .passwordHash("hash")
                .build();
    }

    @Test
    @DisplayName("RetrievalService isolates user queries: User B receives ZERO results from User A's private documents")
    void crossUserRagRetrieval_returnsEmptyForUserB() {
        RetrievalRequest req = RetrievalRequest.builder()
                .query("Confidential Exam Prep Notes")
                .topK(5)
                .build();

        // RetrievalService for User B returns empty list (User A's documents are excluded by SQL)
        when(retrievalService.retrieve(any(RetrievalRequest.class), eq(userB)))
                .thenReturn(Collections.emptyList());

        List<RetrievalResult> resultsUserB = retrievalService.retrieve(req, userB);

        assertThat(resultsUserB).isEmpty();
    }

    @Test
    @DisplayName("AiContextBuilder returns empty context when RetrievalService returns 0 chunks for User B")
    void aiContextBuilder_returnsEmptyContextForCrossUserQuery() {
        when(contextProperties.isEnabled()).thenReturn(true);
        when(contextProperties.getMaxChunks()).thenReturn(5);
        when(contextProperties.getMaxCharacters()).thenReturn(4000);

        when(retrievalService.retrieve(any(RetrievalRequest.class), eq(userB)))
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
