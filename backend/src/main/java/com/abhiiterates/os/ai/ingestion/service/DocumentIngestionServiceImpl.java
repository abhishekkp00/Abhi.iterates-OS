package com.abhiiterates.os.ai.ingestion.service;

import com.abhiiterates.os.ai.ingestion.chunker.DocumentChunker;
import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.ai.ingestion.dto.ChunkResponse;
import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.ai.ingestion.extractor.PdfDocumentExtractor;
import com.abhiiterates.os.ai.ingestion.model.ChunkOutput;
import com.abhiiterates.os.ai.ingestion.model.ExtractedDocument;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.AttachmentService;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentIngestionServiceImpl implements DocumentIngestionService {

    private final ResourceAttachmentRepository attachmentRepository;
    private final RagDocumentRepository ragDocumentRepository;
    private final PdfDocumentExtractor pdfDocumentExtractor;
    private final DocumentChunker documentChunker;
    private final AttachmentService attachmentService;
    private final IngestionTxHelper txHelper;

    @Override
    public IngestionResponse ingestAttachment(UUID resourceId, UUID attachmentId, User currentUser) {
        log.info("Starting document ingestion for resource ID: {}, attachment ID: {}, user ID: {}", resourceId, attachmentId, currentUser.getId());

        ResourceAttachment attachment = validateAttachmentOwnership(resourceId, attachmentId, currentUser);

        if (!pdfDocumentExtractor.supports(attachment.getContentType(), attachment.getFileName())) {
            throw new IllegalArgumentException("Unsupported document type [" + attachment.getContentType() + "] for file: " + attachment.getFileName());
        }

        RagDocument ragDoc = txHelper.saveInitialStatus(attachment);

        try {
            // Read file stream from attachment service
            org.springframework.core.io.Resource resourceFile = attachmentService.download(attachmentId, currentUser);
            ExtractedDocument extractedDoc;
            try (InputStream inputStream = resourceFile.getInputStream()) {
                extractedDoc = pdfDocumentExtractor.extract(inputStream, attachment.getFileName());
            }

            // Idempotency check: If already completed with identical content hash, return existing status
            if (ragDoc.getStatus() == IngestionStatus.COMPLETED
                    && extractedDoc.contentHash().equals(ragDoc.getContentHash())) {
                log.info("Document [{}] already successfully ingested with hash {}. Returning cached result.", attachment.getFileName(), extractedDoc.contentHash());
                return mapToResponse(ragDoc, true);
            }

            // Chunk document
            List<ChunkOutput> chunkOutputs = documentChunker.chunkDocument(extractedDoc);

            // Save chunks and complete status in transaction
            ragDoc = txHelper.saveChunksAndComplete(ragDoc, extractedDoc, chunkOutputs);

            log.info("Document ingestion successfully COMPLETED for attachment [{}]: {} pages, {} chunks", attachmentId, ragDoc.getPageCount(), ragDoc.getChunkCount());
            return mapToResponse(ragDoc, true);

        } catch (Exception ex) {
            log.error("Document ingestion FAILED for attachment [{}]: {}", attachmentId, ex.getMessage(), ex);
            ragDoc = txHelper.markAsFailed(ragDoc, ex.getMessage() != null ? ex.getMessage() : "Unknown ingestion failure");
            return mapToResponse(ragDoc, false);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public IngestionResponse getIngestionStatus(UUID resourceId, UUID attachmentId, User currentUser) {
        validateAttachmentOwnership(resourceId, attachmentId, currentUser);

        RagDocument ragDoc = ragDocumentRepository.findByAttachmentId(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ingestion record not found for attachment ID: " + attachmentId));

        return mapToResponse(ragDoc, true);
    }

    public ResourceAttachment validateAttachmentOwnership(UUID resourceId, UUID attachmentId, User currentUser) {
        ResourceAttachment attachment = attachmentRepository.findByIdWithResourceAndUser(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        if (!attachment.getResource().getId().equals(resourceId)
                || !attachment.getResource().getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Attachment not found with ID: " + attachmentId);
        }

        return attachment;
    }

    private IngestionResponse mapToResponse(RagDocument ragDoc, boolean includeChunks) {
        List<ChunkResponse> chunkResponses = new ArrayList<>();
        if (includeChunks && ragDoc.getChunks() != null) {
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
                .contentHash(ragDoc.getContentHash())
                .pageCount(ragDoc.getPageCount())
                .extractedCharCount(ragDoc.getExtractedCharCount())
                .chunkCount(ragDoc.getChunkCount())
                .failureReason(ragDoc.getFailureReason())
                .createdAt(ragDoc.getCreatedAt())
                .updatedAt(ragDoc.getUpdatedAt())
                .chunks(chunkResponses)
                .build();
    }
}
