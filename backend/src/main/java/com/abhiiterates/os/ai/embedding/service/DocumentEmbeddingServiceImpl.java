package com.abhiiterates.os.ai.embedding.service;

import com.abhiiterates.os.ai.embedding.config.RagEmbeddingProperties;
import com.abhiiterates.os.ai.embedding.domain.RagDocumentChunkEmbedding;
import com.abhiiterates.os.ai.embedding.repository.RagDocumentChunkEmbeddingRepository;
import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.ai.ingestion.dto.ChunkResponse;
import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentEmbeddingServiceImpl implements DocumentEmbeddingService {

    private final ResourceAttachmentRepository attachmentRepository;
    private final RagDocumentRepository ragDocumentRepository;
    private final RagDocumentChunkRepository chunkRepository;
    private final RagDocumentChunkEmbeddingRepository embeddingRepository;
    private final EmbeddingModel embeddingModel;
    private final RagEmbeddingProperties embeddingProperties;
    private final EmbeddingTxHelper txHelper;

    @Override
    public IngestionResponse generateEmbeddingsForDocument(UUID resourceId, UUID attachmentId, User currentUser) {
        log.info("Starting embedding generation for resource ID: {}, attachment ID: {}, user ID: {}", resourceId, attachmentId, currentUser.getId());

        ResourceAttachment attachment = validateAttachmentOwnership(resourceId, attachmentId, currentUser);

        RagDocument ragDoc = ragDocumentRepository.findByAttachmentId(attachment.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ingestion record not found for attachment ID: " + attachmentId));

        if (ragDoc.getStatus() != IngestionStatus.COMPLETED) {
            throw new IllegalStateException("Cannot generate embeddings for document that has not completed text extraction. Current status: " + ragDoc.getStatus());
        }

        if (!embeddingProperties.isEnabled()) {
            log.info("Embedding generation is disabled by configuration for document ID: {}", ragDoc.getId());
            return mapToResponse(ragDoc);
        }

        String targetModel = embeddingProperties.getModel();
        int expectedDimensions = embeddingProperties.getDimensions();

        List<RagDocumentChunk> chunks = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(ragDoc.getId());
        if (chunks.isEmpty()) {
            log.warn("No text chunks found for document ID: {}. Skipping embedding generation.", ragDoc.getId());
            ragDoc = txHelper.saveBatchEmbeddingsAndComplete(ragDoc, List.of());
            return mapToResponse(ragDoc);
        }

        // Idempotency check: Filter chunks that need embedding
        List<RagDocumentChunk> chunksToEmbed = new ArrayList<>();
        for (RagDocumentChunk chunk : chunks) {
            boolean exists = embeddingRepository.existsByChunkIdAndEmbeddingModel(chunk.getId(), targetModel);
            if (!exists) {
                chunksToEmbed.add(chunk);
            }
        }

        if (chunksToEmbed.isEmpty() && ragDoc.getEmbeddingStatus() == IngestionStatus.COMPLETED) {
            log.info("All {} chunks for document ID: {} already have valid embeddings for model [{}]. Skipping.", chunks.size(), ragDoc.getId(), targetModel);
            return mapToResponse(ragDoc);
        }

        ragDoc = txHelper.markEmbeddingProcessing(ragDoc);

        try {
            List<RagDocumentChunkEmbedding> newEmbeddings = new ArrayList<>();
            int batchSize = Math.max(1, embeddingProperties.getBatchSize());

            for (int i = 0; i < chunksToEmbed.size(); i += batchSize) {
                List<RagDocumentChunk> batchChunks = chunksToEmbed.subList(i, Math.min(i + batchSize, chunksToEmbed.size()));
                List<String> batchTexts = batchChunks.stream().map(RagDocumentChunk::getChunkText).toList();

                log.debug("Calling embedding model [{}] for batch of {} chunks (chunk indices {}-{})",
                        targetModel, batchChunks.size(), batchChunks.get(0).getChunkIndex(), batchChunks.get(batchChunks.size() - 1).getChunkIndex());

                List<float[]> vectors = embeddingModel.embed(batchTexts);

                if (vectors == null || vectors.size() != batchChunks.size()) {
                    throw new IllegalStateException("Embedding model returned invalid response size. Expected: "
                            + batchChunks.size() + ", got: " + (vectors != null ? vectors.size() : 0));
                }

                for (int j = 0; j < batchChunks.size(); j++) {
                    RagDocumentChunk chunk = batchChunks.get(j);
                    float[] vector = vectors.get(j);

                    if (vector == null || vector.length == 0) {
                        throw new IllegalStateException("Received empty embedding vector for chunk index: " + chunk.getChunkIndex());
                    }

                    if (vector.length != expectedDimensions) {
                        throw new IllegalStateException("Embedding vector dimension mismatch for chunk index " + chunk.getChunkIndex()
                                + ": expected " + expectedDimensions + " dimensions, but received " + vector.length);
                    }

                    newEmbeddings.add(RagDocumentChunkEmbedding.builder()
                            .chunk(chunk)
                            .embeddingModel(targetModel)
                            .embeddingDimension(expectedDimensions)
                            .vector(vector)
                            .build());
                }
            }

            ragDoc = txHelper.saveBatchEmbeddingsAndComplete(ragDoc, newEmbeddings);
            log.info("Embedding generation COMPLETED for document ID [{}]: {} chunks embedded with model [{}]",
                    ragDoc.getId(), newEmbeddings.size(), targetModel);
            return mapToResponse(ragDoc);

        } catch (Exception ex) {
            log.error("Embedding generation FAILED for document ID [{}]: {}", ragDoc.getId(), ex.getMessage(), ex);
            ragDoc = txHelper.markEmbeddingFailed(ragDoc, ex.getMessage() != null ? ex.getMessage() : "Unknown embedding generation failure");
            return mapToResponse(ragDoc);
        }
    }

    private ResourceAttachment validateAttachmentOwnership(UUID resourceId, UUID attachmentId, User currentUser) {
        ResourceAttachment attachment = attachmentRepository.findByIdWithResourceAndUser(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        if (!attachment.getResource().getId().equals(resourceId)
                || !attachment.getResource().getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Attachment not found with ID: " + attachmentId);
        }

        return attachment;
    }

    private IngestionResponse mapToResponse(RagDocument ragDoc) {
        List<ChunkResponse> chunkResponses = new ArrayList<>();
        if (ragDoc.getChunks() != null) {
            for (RagDocumentChunk chunk : ragDoc.getChunks()) {
                chunkResponses.add(ChunkResponse.builder()
                        .id(chunk.getId())
                        .chunkIndex(chunk.getChunkIndex())
                        .pageNumber(chunk.getPageNumber())
                        .startPage(chunk.getStartPage())
                        .endPage(chunk.getEndPage())
                        .chunkText(chunk.getChunkText())
                        .charCount(chunk.getCharCount())
                        .build());
            }
        }

        return IngestionResponse.builder()
                .documentId(ragDoc.getId())
                .resourceId(ragDoc.getResource().getId())
                .attachmentId(ragDoc.getAttachment().getId())
                .fileName(ragDoc.getFileName())
                .contentType(ragDoc.getContentType())
                .status(ragDoc.getStatus())
                .embeddingStatus(ragDoc.getEmbeddingStatus())
                .contentHash(ragDoc.getContentHash())
                .pageCount(ragDoc.getPageCount())
                .extractedCharCount(ragDoc.getExtractedCharCount())
                .chunkCount(ragDoc.getChunkCount())
                .failureReason(ragDoc.getFailureReason())
                .embeddingFailureReason(ragDoc.getEmbeddingFailureReason())
                .createdAt(ragDoc.getCreatedAt())
                .updatedAt(ragDoc.getUpdatedAt())
                .chunks(chunkResponses)
                .build();
    }
}
