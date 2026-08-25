package com.abhiiterates.os.ai.ingestion.service;

import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.ai.ingestion.model.ChunkOutput;
import com.abhiiterates.os.ai.ingestion.model.ExtractedDocument;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.resource.ResourceAttachment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class IngestionTxHelper {

    private final RagDocumentRepository ragDocumentRepository;
    private final RagDocumentChunkRepository ragDocumentChunkRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RagDocument saveInitialStatus(ResourceAttachment attachment) {
        RagDocument ragDoc = ragDocumentRepository.findByAttachmentId(attachment.getId())
                .orElseGet(() -> RagDocument.builder()
                        .resource(attachment.getResource())
                        .attachment(attachment)
                        .fileName(attachment.getFileName())
                        .contentType(attachment.getContentType())
                        .contentHash("PENDING_HASH")
                        .status(IngestionStatus.PENDING)
                        .build());

        ragDoc.setStatus(IngestionStatus.PROCESSING);
        ragDoc.setFailureReason(null);
        return ragDocumentRepository.save(ragDoc);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RagDocument saveChunksAndComplete(RagDocument ragDoc, ExtractedDocument extractedDoc, List<ChunkOutput> chunkOutputs) {
        ragDocumentChunkRepository.deleteByDocumentId(ragDoc.getId());
        ragDocumentChunkRepository.flush();

        List<RagDocumentChunk> chunkEntities = new ArrayList<>();
        for (ChunkOutput chunk : chunkOutputs) {
            chunkEntities.add(RagDocumentChunk.builder()
                    .document(ragDoc)
                    .chunkIndex(chunk.chunkIndex())
                    .pageNumber(chunk.pageNumber())
                    .startPage(chunk.startPage())
                    .endPage(chunk.endPage())
                    .chunkText(chunk.text())
                    .charCount(chunk.charCount())
                    .build());
        }

        List<RagDocumentChunk> savedChunks = ragDocumentChunkRepository.saveAll(chunkEntities);

        ragDoc.setStatus(IngestionStatus.COMPLETED);
        ragDoc.setContentHash(extractedDoc.contentHash());
        ragDoc.setPageCount(extractedDoc.pageCount());
        ragDoc.setExtractedCharCount(extractedDoc.totalCharacterCount());
        ragDoc.setChunkCount(savedChunks.size());
        ragDoc.setChunks(savedChunks);
        return ragDocumentRepository.save(ragDoc);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RagDocument markAsFailed(RagDocument ragDoc, String failureReason) {
        ragDoc.setStatus(IngestionStatus.FAILED);
        ragDoc.setFailureReason(failureReason != null && failureReason.length() > 990 ? failureReason.substring(0, 990) : failureReason);
        return ragDocumentRepository.save(ragDoc);
    }
}
