package com.abhiiterates.os.ai.retrieval;

import com.abhiiterates.os.ai.embedding.domain.RagDocumentChunkEmbedding;
import com.abhiiterates.os.ai.embedding.repository.RagDocumentChunkEmbeddingRepository;
import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.repository.VectorSearchRepository;
import com.abhiiterates.os.resource.*;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Import(com.abhiiterates.os.ai.retrieval.repository.VectorSearchRepositoryImpl.class)
class VectorSearchRepositoryIntegrationTest {

    @Autowired
    private VectorSearchRepository vectorSearchRepository;

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

    private User userA;
    private User userB;

    private RagDocumentChunk chunkA_Deadlock;
    private RagDocumentChunk chunkA_CpuScheduling;
    private RagDocumentChunk chunkB_UserBNotes;

    @BeforeEach
    void setUp() {
        userA = userRepository.save(User.builder().email("userA_" + UUID.randomUUID() + "@example.com").username("userA_" + UUID.randomUUID()).passwordHash("pass").build());
        userB = userRepository.save(User.builder().email("userB_" + UUID.randomUUID() + "@example.com").username("userB_" + UUID.randomUUID()).passwordHash("pass").build());

        Resource resA = resourceRepository.save(Resource.builder().title("Operating Systems Notes").user(userA).category(ResourceCategory.BOOK).priority(ResourcePriority.HIGH).status(ResourceStatus.ACTIVE).build());
        ResourceAttachment attA = attachmentRepository.save(ResourceAttachment.builder().resource(resA).fileName("os.pdf").downloadUrl("http://local/os.pdf").fileSize(100L).build());

        RagDocument docA = documentRepository.save(RagDocument.builder()
                .resource(resA)
                .attachment(attA)
                .fileName("os.pdf")
                .status(IngestionStatus.COMPLETED)
                .embeddingStatus(IngestionStatus.COMPLETED)
                .contentHash("hashA")
                .build());

        chunkA_Deadlock = chunkRepository.save(RagDocumentChunk.builder()
                .document(docA)
                .chunkIndex(0)
                .pageNumber(1)
                .chunkText("Deadlock occurs when processes wait indefinitely for resources.")
                .charCount(60)
                .build());

        chunkA_CpuScheduling = chunkRepository.save(RagDocumentChunk.builder()
                .document(docA)
                .chunkIndex(1)
                .pageNumber(2)
                .chunkText("CPU scheduling determines which process receives processor time.")
                .charCount(60)
                .build());

        // User A embeddings: Chunk A (Deadlock) vector [1.0, 0.0, 0.0], Chunk B (CPU) vector [0.0, 1.0, 0.0]
        embeddingRepository.save(RagDocumentChunkEmbedding.builder()
                .chunk(chunkA_Deadlock)
                .embeddingModel("text-embedding-3-small")
                .embeddingDimension(3)
                .vector(new float[]{1.0f, 0.0f, 0.0f})
                .build());

        embeddingRepository.save(RagDocumentChunkEmbedding.builder()
                .chunk(chunkA_CpuScheduling)
                .embeddingModel("text-embedding-3-small")
                .embeddingDimension(3)
                .vector(new float[]{0.0f, 1.0f, 0.0f})
                .build());

        // User B resource & embedding: vector [1.0, 0.0, 0.0] (Same vector direction as Deadlock, but owned by User B!)
        Resource resB = resourceRepository.save(Resource.builder().title("User B Private Document").user(userB).category(ResourceCategory.BOOK).priority(ResourcePriority.HIGH).status(ResourceStatus.ACTIVE).build());
        ResourceAttachment attB = attachmentRepository.save(ResourceAttachment.builder().resource(resB).fileName("private.pdf").downloadUrl("http://local/private.pdf").fileSize(100L).build());

        RagDocument docB = documentRepository.save(RagDocument.builder()
                .resource(resB)
                .attachment(attB)
                .fileName("private.pdf")
                .status(IngestionStatus.COMPLETED)
                .embeddingStatus(IngestionStatus.COMPLETED)
                .contentHash("hashB")
                .build());

        chunkB_UserBNotes = chunkRepository.save(RagDocumentChunk.builder()
                .document(docB)
                .chunkIndex(0)
                .pageNumber(1)
                .chunkText("User B secret private exam questions.")
                .charCount(40)
                .build());

        embeddingRepository.save(RagDocumentChunkEmbedding.builder()
                .chunk(chunkB_UserBNotes)
                .embeddingModel("text-embedding-3-small")
                .embeddingDimension(3)
                .vector(new float[]{1.0f, 0.0f, 0.0f})
                .build());
    }

    @Test
    @DisplayName("searchSimilarChunks returns closest vector hit first")
    void searchSimilarChunks_returnsClosestVectorFirst() {
        float[] queryVec = new float[]{0.9f, 0.1f, 0.0f}; // Closest to Deadlock [1.0, 0.0, 0.0]
        String queryVecStr = "[0.9,0.1,0.0]";

        List<RetrievalResult> results = vectorSearchRepository.searchSimilarChunks(
                userA.getId(), queryVecStr, queryVec, "text-embedding-3-small", 5, 0.0, null, null);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).chunkId()).isEqualTo(chunkA_Deadlock.getId());
        assertThat(results.get(0).text()).contains("Deadlock occurs");
        assertThat(results.get(0).similarityScore()).isGreaterThan(results.get(1).similarityScore());
    }

    @Test
    @DisplayName("searchSimilarChunks enforces user authorization isolation preventing cross-user data leaks")
    void searchSimilarChunks_enforcesUserAuthorizationIsolation() {
        float[] queryVec = new float[]{1.0f, 0.0f, 0.0f}; // Matches User B's vector [1.0, 0.0, 0.0] exactly
        String queryVecStr = "[1.0,0.0,0.0]";

        // Query executed in User A's context
        List<RetrievalResult> userAResults = vectorSearchRepository.searchSimilarChunks(
                userA.getId(), queryVecStr, queryVec, "text-embedding-3-small", 5, 0.0, null, null);

        // Verify User A receives only User A's chunks and NEVER User B's secret notes
        assertThat(userAResults).noneMatch(r -> r.chunkId().equals(chunkB_UserBNotes.getId()));
        assertThat(userAResults).allMatch(r -> r.resourceId().equals(chunkA_Deadlock.getDocument().getResource().getId()));

        // Query executed in User B's context
        List<RetrievalResult> userBResults = vectorSearchRepository.searchSimilarChunks(
                userB.getId(), queryVecStr, queryVec, "text-embedding-3-small", 5, 0.0, null, null);

        assertThat(userBResults).hasSize(1);
        assertThat(userBResults.get(0).chunkId()).isEqualTo(chunkB_UserBNotes.getId());
    }

    @Test
    @DisplayName("searchSimilarChunks filters out chunks below similarity threshold")
    void searchSimilarChunks_filtersBelowThreshold() {
        float[] queryVec = new float[]{1.0f, 0.0f, 0.0f}; // Matches Deadlock [1,0,0] (sim=1.0), CPU [0,1,0] (sim=0.0)
        String queryVecStr = "[1.0,0.0,0.0]";

        List<RetrievalResult> results = vectorSearchRepository.searchSimilarChunks(
                userA.getId(), queryVecStr, queryVec, "text-embedding-3-small", 5, 0.60, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).chunkId()).isEqualTo(chunkA_Deadlock.getId());
    }

    @Test
    @DisplayName("searchSimilarChunks respects topK limit")
    void searchSimilarChunks_respectsTopKLimit() {
        float[] queryVec = new float[]{0.5f, 0.5f, 0.0f};
        String queryVecStr = "[0.5,0.5,0.0]";

        List<RetrievalResult> results = vectorSearchRepository.searchSimilarChunks(
                userA.getId(), queryVecStr, queryVec, "text-embedding-3-small", 1, 0.0, null, null);

        assertThat(results).hasSize(1);
    }
}
