package com.abhiiterates.os.ai.embedding;

import com.abhiiterates.os.ai.embedding.config.RagEmbeddingProperties;
import com.abhiiterates.os.ai.embedding.domain.RagDocumentChunkEmbedding;
import com.abhiiterates.os.ai.embedding.repository.RagDocumentChunkEmbeddingRepository;
import com.abhiiterates.os.ai.embedding.service.DocumentEmbeddingServiceImpl;
import com.abhiiterates.os.ai.embedding.service.EmbeddingTxHelper;
import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.embedding.EmbeddingModel;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentEmbeddingServiceImplTest {

    @Mock
    private ResourceAttachmentRepository attachmentRepository;
    @Mock
    private RagDocumentRepository ragDocumentRepository;
    @Mock
    private RagDocumentChunkRepository chunkRepository;
    @Mock
    private RagDocumentChunkEmbeddingRepository embeddingRepository;
    @Mock
    private EmbeddingModel embeddingModel;
    @Mock
    private RagEmbeddingProperties embeddingProperties;
    @Mock
    private EmbeddingTxHelper txHelper;

    @InjectMocks
    private DocumentEmbeddingServiceImpl documentEmbeddingService;

    private User testUser;
    private User otherUser;
    private Resource testResource;
    private ResourceAttachment testAttachment;
    private RagDocument testDocument;
    private RagDocumentChunk chunk1;
    private RagDocumentChunk chunk2;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(UUID.randomUUID()).email("student@example.com").build();
        otherUser = User.builder().id(UUID.randomUUID()).email("other@example.com").build();

        testResource = Resource.builder().id(UUID.randomUUID()).user(testUser).title("OS Notes").build();

        testAttachment = ResourceAttachment.builder()
                .id(UUID.randomUUID())
                .resource(testResource)
                .fileName("os_lecture.pdf")
                .contentType("application/pdf")
                .build();

        testDocument = RagDocument.builder()
                .id(UUID.randomUUID())
                .resource(testResource)
                .attachment(testAttachment)
                .fileName("os_lecture.pdf")
                .contentType("application/pdf")
                .status(IngestionStatus.COMPLETED)
                .embeddingStatus(IngestionStatus.PENDING)
                .contentHash("hash123")
                .pageCount(2)
                .chunkCount(2)
                .build();

        chunk1 = RagDocumentChunk.builder()
                .id(UUID.randomUUID())
                .document(testDocument)
                .chunkIndex(0)
                .pageNumber(1)
                .chunkText("Operating Systems Chapter 1 text...")
                .charCount(36)
                .build();

        chunk2 = RagDocumentChunk.builder()
                .id(UUID.randomUUID())
                .document(testDocument)
                .chunkIndex(1)
                .pageNumber(2)
                .chunkText("Operating Systems Chapter 2 text...")
                .charCount(36)
                .build();
    }

    @Test
    @DisplayName("generateEmbeddingsForDocument with valid chunks completes and persists embeddings")
    void generateEmbeddings_withValidChunks_completesAndPersistsEmbeddings() {
        when(embeddingProperties.isEnabled()).thenReturn(true);
        when(embeddingProperties.getModel()).thenReturn("text-embedding-3-small");
        when(embeddingProperties.getDimensions()).thenReturn(3);
        when(embeddingProperties.getBatchSize()).thenReturn(32);

        when(attachmentRepository.findByIdWithResourceAndUser(testAttachment.getId()))
                .thenReturn(Optional.of(testAttachment));
        when(ragDocumentRepository.findByAttachmentId(testAttachment.getId()))
                .thenReturn(Optional.of(testDocument));
        when(chunkRepository.findByDocumentIdOrderByChunkIndexAsc(testDocument.getId()))
                .thenReturn(List.of(chunk1, chunk2));

        when(embeddingRepository.existsByChunkIdAndEmbeddingModel(any(), eq("text-embedding-3-small")))
                .thenReturn(false);

        when(txHelper.markEmbeddingProcessing(any())).thenAnswer(inv -> {
            RagDocument doc = inv.getArgument(0);
            doc.setEmbeddingStatus(IngestionStatus.PROCESSING);
            return doc;
        });

        float[] v1 = new float[]{0.1f, 0.2f, 0.3f};
        float[] v2 = new float[]{0.4f, 0.5f, 0.6f};
        when(embeddingModel.embed(anyList())).thenReturn(List.of(v1, v2));

        when(txHelper.saveBatchEmbeddingsAndComplete(any(), anyList())).thenAnswer(inv -> {
            RagDocument doc = inv.getArgument(0);
            doc.setEmbeddingStatus(IngestionStatus.COMPLETED);
            return doc;
        });

        IngestionResponse response = documentEmbeddingService.generateEmbeddingsForDocument(
                testResource.getId(), testAttachment.getId(), testUser);

        assertThat(response.embeddingStatus()).isEqualTo(IngestionStatus.COMPLETED);
        verify(embeddingModel, times(1)).embed(List.of(chunk1.getChunkText(), chunk2.getChunkText()));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RagDocumentChunkEmbedding>> captor = ArgumentCaptor.forClass(List.class);
        verify(txHelper).saveBatchEmbeddingsAndComplete(eq(testDocument), captor.capture());

        List<RagDocumentChunkEmbedding> savedEmbeddings = captor.getValue();
        assertThat(savedEmbeddings).hasSize(2);
        assertThat(savedEmbeddings.get(0).getVector()).isEqualTo(v1);
        assertThat(savedEmbeddings.get(1).getVector()).isEqualTo(v2);
    }

    @Test
    @DisplayName("generateEmbeddingsForDocument when vector dimension mismatches marks status FAILED")
    void generateEmbeddings_whenDimensionMismatches_marksFailed() {
        when(embeddingProperties.isEnabled()).thenReturn(true);
        when(embeddingProperties.getModel()).thenReturn("text-embedding-3-small");
        when(embeddingProperties.getDimensions()).thenReturn(1536); // Expect 1536
        when(embeddingProperties.getBatchSize()).thenReturn(32);

        when(attachmentRepository.findByIdWithResourceAndUser(testAttachment.getId()))
                .thenReturn(Optional.of(testAttachment));
        when(ragDocumentRepository.findByAttachmentId(testAttachment.getId()))
                .thenReturn(Optional.of(testDocument));
        when(chunkRepository.findByDocumentIdOrderByChunkIndexAsc(testDocument.getId()))
                .thenReturn(List.of(chunk1));

        when(txHelper.markEmbeddingProcessing(any())).thenAnswer(inv -> inv.getArgument(0));

        // Model returns vector of length 3 instead of 1536
        float[] shortVector = new float[]{0.1f, 0.2f, 0.3f};
        when(embeddingModel.embed(anyList())).thenReturn(List.of(shortVector));

        when(txHelper.markEmbeddingFailed(any(), anyString())).thenAnswer(inv -> {
            RagDocument doc = inv.getArgument(0);
            doc.setEmbeddingStatus(IngestionStatus.FAILED);
            doc.setEmbeddingFailureReason(inv.getArgument(1));
            return doc;
        });

        IngestionResponse response = documentEmbeddingService.generateEmbeddingsForDocument(
                testResource.getId(), testAttachment.getId(), testUser);

        assertThat(response.embeddingStatus()).isEqualTo(IngestionStatus.FAILED);
        assertThat(response.embeddingFailureReason()).contains("dimension mismatch");
    }

    @Test
    @DisplayName("generateEmbeddingsForDocument when user is not owner throws ResourceNotFoundException")
    void generateEmbeddings_whenNotOwner_throwsResourceNotFoundException() {
        when(attachmentRepository.findByIdWithResourceAndUser(testAttachment.getId()))
                .thenReturn(Optional.of(testAttachment));

        assertThatThrownBy(() -> documentEmbeddingService.generateEmbeddingsForDocument(
                testResource.getId(), testAttachment.getId(), otherUser))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(embeddingModel);
    }

    @Test
    @DisplayName("generateEmbeddingsForDocument when chunks already embedded skips regeneration")
    void generateEmbeddings_whenAlreadyEmbedded_skipsGeneration() {
        when(embeddingProperties.isEnabled()).thenReturn(true);
        when(embeddingProperties.getModel()).thenReturn("text-embedding-3-small");
        when(embeddingProperties.getDimensions()).thenReturn(3);

        testDocument.setEmbeddingStatus(IngestionStatus.COMPLETED);

        when(attachmentRepository.findByIdWithResourceAndUser(testAttachment.getId()))
                .thenReturn(Optional.of(testAttachment));
        when(ragDocumentRepository.findByAttachmentId(testAttachment.getId()))
                .thenReturn(Optional.of(testDocument));
        when(chunkRepository.findByDocumentIdOrderByChunkIndexAsc(testDocument.getId()))
                .thenReturn(List.of(chunk1, chunk2));

        // Already exists for both chunks
        when(embeddingRepository.existsByChunkIdAndEmbeddingModel(any(), eq("text-embedding-3-small")))
                .thenReturn(true);

        IngestionResponse response = documentEmbeddingService.generateEmbeddingsForDocument(
                testResource.getId(), testAttachment.getId(), testUser);

        assertThat(response.embeddingStatus()).isEqualTo(IngestionStatus.COMPLETED);
        verifyNoInteractions(embeddingModel);
    }
}
