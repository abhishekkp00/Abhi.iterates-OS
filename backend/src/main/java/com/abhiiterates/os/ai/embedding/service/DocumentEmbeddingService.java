package com.abhiiterates.os.ai.embedding.service;

import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.user.User;

import java.util.UUID;

public interface DocumentEmbeddingService {

    IngestionResponse generateEmbeddingsForDocument(UUID resourceId, UUID attachmentId, User currentUser);
}
