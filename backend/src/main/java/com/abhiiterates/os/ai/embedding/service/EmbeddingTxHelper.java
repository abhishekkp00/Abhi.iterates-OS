package com.abhiiterates.os.ai.embedding.service;

import com.abhiiterates.os.ai.embedding.domain.RagDocumentChunkEmbedding;
import com.abhiiterates.os.ai.embedding.repository.RagDocumentChunkEmbeddingRepository;
import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EmbeddingTxHelper {

    private final RagDocumentRepository ragDocumentRepository;
    private final RagDocumentChunkEmbeddingRepository embeddingRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RagDocument markEmbeddingProcessing(RagDocument ragDoc) {
        ragDoc.setEmbeddingStatus(IngestionStatus.PROCESSING);
        ragDoc.setEmbeddingFailureReason(null);
        return ragDocumentRepository.save(ragDoc);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RagDocument saveBatchEmbeddingsAndComplete(RagDocument ragDoc, List<RagDocumentChunkEmbedding> embeddings) {
        if (!embeddings.isEmpty()) {
            embeddingRepository.saveAll(embeddings);
            embeddingRepository.flush();
        }

        ragDoc.setEmbeddingStatus(IngestionStatus.COMPLETED);
        ragDoc.setEmbeddingFailureReason(null);
        return ragDocumentRepository.save(ragDoc);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RagDocument markEmbeddingFailed(RagDocument ragDoc, String failureReason) {
        ragDoc.setEmbeddingStatus(IngestionStatus.FAILED);
        ragDoc.setEmbeddingFailureReason(failureReason != null && failureReason.length() > 990
                ? failureReason.substring(0, 990)
                : failureReason);
        return ragDocumentRepository.save(ragDoc);
    }
}
