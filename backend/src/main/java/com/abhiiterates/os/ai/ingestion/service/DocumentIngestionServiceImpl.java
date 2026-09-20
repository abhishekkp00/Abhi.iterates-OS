package com.abhiiterates.os.ai.ingestion.service;

import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.ai.ingestion.dto.ChunkResponse;
import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.ai.ingestion.model.ChunkOutput;
import com.abhiiterates.os.ai.ingestion.model.ExtractedDocument;
import com.abhiiterates.os.ai.ingestion.model.ExtractedPage;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.AttachmentService;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DocumentIngestionServiceImpl — production-grade Spring AI RAG ingestion pipeline.
 *
 * Pipeline:
 *  1. Validate attachment ownership (resource belongs to authenticated user)
 *  2. Create / reset RagDocument lifecycle record (PROCESSING state)
 *  3. Download attachment bytes via AttachmentService
 *  4. Parse PDF into pages → List{@code <Document>} using Spring AI PagePdfDocumentReader
 *  5. Chunk pages into smaller segments via Spring AI TokenTextSplitter
 *  6. Enrich each chunk's metadata:
 *       userId, resourceId, attachmentId, documentId, fileName, contentType,
 *       chunkIndex, pageNumber
 *  7. Embed + persist chunks into ai_vector_store via VectorStore.add()
 *     (EmbeddingModel is called internally by VectorStore — no manual embed())
 *  8. Persist RagDocumentChunk rows (text only) for status / DTO responses
 *  9. Mark RagDocument status = COMPLETED, embeddingStatus = COMPLETED
 *
 * Security invariant:
 *   userId is injected into every Document's metadata map BEFORE VectorStore.add().
 *   All subsequent similaritySearch() calls enforce a userId filter expression.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentIngestionServiceImpl implements DocumentIngestionService {

    // ── Spring AI ──────────────────────────────────────────────────────────────
    private final VectorStore vectorStore;

    // ── Repositories + Services ────────────────────────────────────────────────
    private final ResourceAttachmentRepository attachmentRepository;
    private final RagDocumentRepository ragDocumentRepository;
    private final RagDocumentChunkRepository ragDocumentChunkRepository;
    private final AttachmentService attachmentService;
    private final IngestionTxHelper txHelper;

    // ── Chunking parameters ────────────────────────────────────────────────────
    /** Target token count per chunk (≈ 800 tokens ~ 600 words). */
    private static final int DEFAULT_CHUNK_SIZE   = 800;
    /** Minimum character count for a valid chunk (discards micro-fragments). */
    private static final int MIN_CHUNK_SIZE_CHARS = 350;
    /** Minimum characters for a chunk to be embedded (skip near-empty stubs). */
    private static final int MIN_CHUNK_TO_EMBED   = 5;
    /** Hard cap on chunks per document (prevents unbounded memory use). */
    private static final int MAX_NUM_CHUNKS       = 10_000;

    // ── Public API ─────────────────────────────────────────────────────────────

    @Override
    public IngestionResponse ingestAttachment(UUID resourceId, UUID attachmentId, User currentUser) {
        log.info("Starting Spring AI document ingestion: resource={}, attachment={}, user={}",
                resourceId, attachmentId, currentUser.getId());

        ResourceAttachment attachment = validateAttachmentOwnership(resourceId, attachmentId, currentUser);

        if (!isSupportedContentType(attachment.getContentType(), attachment.getFileName())) {
            throw new IllegalArgumentException(
                    "Unsupported document type [" + attachment.getContentType()
                    + "] for file: " + attachment.getFileName()
                    + ". Only PDF documents are currently supported.");
        }

        // Step 1: Create / reset RagDocument lifecycle record
        RagDocument ragDoc = txHelper.saveInitialStatus(attachment);

        try {
            // Step 2: Download file bytes
            org.springframework.core.io.Resource resourceFile =
                    attachmentService.download(attachmentId, currentUser);

            // Step 3: Parse PDF via Spring AI PagePdfDocumentReader
            //   One Document per page; metadata includes "page_number" (1-based).
            //   We open the InputStream only to confirm the resource is readable,
            //   then pass the Resource directly to PagePdfDocumentReader.
            List<Document> rawDocs;
            try (InputStream probe = resourceFile.getInputStream()) {
                // confirm stream opens — PagePdfDocumentReader may re-open it
                if (probe == null) {
                    throw new IllegalStateException("Attachment stream is empty for ID: " + attachmentId);
                }
            }
            PagePdfDocumentReader pdfReader = new PagePdfDocumentReader(resourceFile);
            rawDocs = pdfReader.get();

            if (rawDocs == null) {
                rawDocs = List.of();
            }

            log.debug("PDF parsed: {} raw page documents for attachment [{}]",
                    rawDocs.size(), attachmentId);

            // Step 4: Chunk pages via Spring AI TokenTextSplitter
            TokenTextSplitter splitter = TokenTextSplitter.builder()
                    .withChunkSize(DEFAULT_CHUNK_SIZE)
                    .withMinChunkSizeChars(MIN_CHUNK_SIZE_CHARS)
                    .withMinChunkLengthToEmbed(MIN_CHUNK_TO_EMBED)
                    .withMaxNumChunks(MAX_NUM_CHUNKS)
                    .withKeepSeparator(true)
                    .build();
            List<Document> chunks = rawDocs.isEmpty() ? List.of() : splitter.apply(rawDocs);

            log.debug("TokenTextSplitter produced {} chunks for attachment [{}]",
                    chunks.size(), attachmentId);

            // Step 5: Enrich metadata for security scoping and lineage tracking
            String docIdStr        = ragDoc.getId().toString();
            String userIdStr       = currentUser.getId().toString();
            String resourceIdStr   = attachment.getResource().getId().toString();
            String attachmentIdStr = attachment.getId().toString();
            String fileName        = attachment.getFileName();
            String contentType     = attachment.getContentType() != null
                    ? attachment.getContentType() : "application/pdf";

            List<Document>      enrichedChunks = new ArrayList<>(chunks.size());
            List<ChunkOutput>   chunkOutputs   = new ArrayList<>(chunks.size());
            List<ExtractedPage> syntheticPages  = new ArrayList<>(rawDocs.size());

            // Build synthetic page list for ExtractedDocument bridge to IngestionTxHelper
            for (int p = 0; p < rawDocs.size(); p++) {
                Document page = rawDocs.get(p);
                syntheticPages.add(new ExtractedPage(p + 1, page.getText() != null ? page.getText() : ""));
            }

            for (int i = 0; i < chunks.size(); i++) {
                Document chunk = chunks.get(i);

                // PagePdfDocumentReader sets "page_number" (1-based integer) in metadata
                Object rawPage = chunk.getMetadata().get("page_number");
                int pageNumber = (rawPage instanceof Number n) ? n.intValue() : 1;

                // Enriched metadata map: copy existing reader metadata + add mandatory fields
                Map<String, Object> meta = new HashMap<>(chunk.getMetadata());
                meta.put("userId",       userIdStr);         // MANDATORY security scope key
                meta.put("resourceId",   resourceIdStr);
                meta.put("attachmentId", attachmentIdStr);
                meta.put("documentId",   docIdStr);
                meta.put("fileName",     fileName);
                meta.put("contentType",  contentType);
                meta.put("chunkIndex",   i);
                meta.put("pageNumber",   pageNumber);         // normalised; always present

                enrichedChunks.add(new Document(chunk.getText(), meta));

                // Persist chunk text in relational table for getIngestionStatus() DTO
                String text = chunk.getText() != null ? chunk.getText() : "";
                chunkOutputs.add(new ChunkOutput(
                        i, pageNumber, pageNumber, pageNumber, text, text.length()));
            }

            // Step 6: Embed + persist to ai_vector_store via VectorStore.add()
            //   PgVectorStore internally calls EmbeddingModel.embed() for each chunk.
            if (!enrichedChunks.isEmpty()) {
                log.info("Calling VectorStore.add() with {} enriched chunks for attachment [{}]",
                        enrichedChunks.size(), attachmentId);
                vectorStore.add(enrichedChunks);
                log.info("VectorStore.add() COMPLETED for attachment [{}]", attachmentId);
            } else {
                log.warn("No chunks produced for attachment [{}]. VectorStore not called.", attachmentId);
            }

            // Step 7: Save chunk text rows + mark RagDocument COMPLETED
            long totalChars = chunkOutputs.stream().mapToLong(ChunkOutput::charCount).sum();
            // Content hash encodes size signature for idempotency detection
            String contentHash = totalChars + "-" + rawDocs.size() + "-" + chunks.size();

            ExtractedDocument extractedDoc = new ExtractedDocument(
                    fileName, rawDocs.size(), syntheticPages, contentHash, totalChars);

            ragDoc = txHelper.saveChunksAndComplete(ragDoc, extractedDoc, chunkOutputs);

            // Step 8: Mark embeddingStatus = COMPLETED (VectorStore.add handled embedding)
            ragDoc = txHelper.markEmbeddingCompleted(ragDoc);

            log.info("Ingestion COMPLETED for attachment [{}]: {} pages, {} chunks, {} total chars",
                    attachmentId, ragDoc.getPageCount(), ragDoc.getChunkCount(), totalChars);

            return mapToResponse(ragDoc, true);

        } catch (Exception ex) {
            log.error("Ingestion FAILED for attachment [{}]: {}", attachmentId, ex.getMessage(), ex);
            ragDoc = txHelper.markAsFailed(ragDoc,
                    ex.getMessage() != null ? ex.getMessage() : "Unknown ingestion failure");
            return mapToResponse(ragDoc, false);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public IngestionResponse getIngestionStatus(UUID resourceId, UUID attachmentId, User currentUser) {
        validateAttachmentOwnership(resourceId, attachmentId, currentUser);

        RagDocument ragDoc = ragDocumentRepository.findByAttachmentId(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ingestion record not found for attachment ID: " + attachmentId));

        return mapToResponse(ragDoc, true);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private ResourceAttachment validateAttachmentOwnership(
            UUID resourceId, UUID attachmentId, User currentUser) {
        ResourceAttachment attachment = attachmentRepository.findByIdWithResourceAndUser(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attachment not found with ID: " + attachmentId));

        if (!attachment.getResource().getId().equals(resourceId)
                || !attachment.getResource().getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Attachment not found with ID: " + attachmentId);
        }

        return attachment;
    }

    /**
     * Returns {@code true} when the MIME type or file extension indicates PDF.
     * Only PDF is supported via Spring AI {@link PagePdfDocumentReader}.
     */
    private boolean isSupportedContentType(String contentType, String fileName) {
        if (contentType != null && contentType.toLowerCase().contains("pdf")) return true;
        return fileName != null && fileName.toLowerCase().endsWith(".pdf");
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
