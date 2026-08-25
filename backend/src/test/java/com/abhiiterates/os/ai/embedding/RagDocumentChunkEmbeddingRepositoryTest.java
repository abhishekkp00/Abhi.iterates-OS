package com.abhiiterates.os.ai.embedding;

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@ActiveProfiles("test")
class RagDocumentChunkEmbeddingRepositoryTest {

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

    private RagDocumentChunk testChunk;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder().email("test_" + UUID.randomUUID() + "@example.com").username("user_" + UUID.randomUUID()).passwordHash("pass").build());
        Resource resource = resourceRepository.save(Resource.builder().title("Resource").user(user).category(ResourceCategory.BOOK).priority(ResourcePriority.HIGH).status(ResourceStatus.ACTIVE).build());
        ResourceAttachment attachment = attachmentRepository.save(ResourceAttachment.builder().resource(resource).fileName("doc.pdf").downloadUrl("http://local").fileSize(100L).build());

        RagDocument document = documentRepository.save(RagDocument.builder()
                .resource(resource)
                .attachment(attachment)
                .fileName("doc.pdf")
                .status(IngestionStatus.COMPLETED)
                .embeddingStatus(IngestionStatus.PENDING)
                .contentHash("hash123")
                .build());

        testChunk = chunkRepository.save(RagDocumentChunk.builder()
                .document(document)
                .chunkIndex(0)
                .pageNumber(1)
                .chunkText("Sample text")
                .charCount(11)
                .build());
    }

    @Test
    @DisplayName("save and findByChunkIdAndEmbeddingModel persists vector and model metadata")
    void saveAndFind_persistsVectorAndMetadata() {
        float[] vector = new float[]{0.1f, 0.2f, 0.3f};
        RagDocumentChunkEmbedding embedding = embeddingRepository.save(RagDocumentChunkEmbedding.builder()
                .chunk(testChunk)
                .embeddingModel("text-embedding-3-small")
                .embeddingDimension(3)
                .vector(vector)
                .build());

        Optional<RagDocumentChunkEmbedding> found = embeddingRepository.findByChunkIdAndEmbeddingModel(testChunk.getId(), "text-embedding-3-small");

        assertThat(found).isPresent();
        assertThat(found.get().getEmbeddingModel()).isEqualTo("text-embedding-3-small");
        assertThat(found.get().getEmbeddingDimension()).isEqualTo(3);
        assertThat(found.get().getVector()).isEqualTo(vector);
    }

    @Test
    @DisplayName("uniqueness constraint (chunk_id, embedding_model) prevents duplicate embeddings")
    void uniquenessConstraint_preventsDuplicates() {
        float[] vector = new float[]{0.1f, 0.2f, 0.3f};
        embeddingRepository.saveAndFlush(RagDocumentChunkEmbedding.builder()
                .chunk(testChunk)
                .embeddingModel("text-embedding-3-small")
                .embeddingDimension(3)
                .vector(vector)
                .build());

        assertThatThrownBy(() -> embeddingRepository.saveAndFlush(RagDocumentChunkEmbedding.builder()
                .chunk(testChunk)
                .embeddingModel("text-embedding-3-small")
                .embeddingDimension(3)
                .vector(vector)
                .build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
