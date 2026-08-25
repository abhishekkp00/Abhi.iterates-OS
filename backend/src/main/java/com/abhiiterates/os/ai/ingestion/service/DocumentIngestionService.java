package com.abhiiterates.os.ai.ingestion.service;

import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.user.User;

import java.util.UUID;

public interface DocumentIngestionService {

    IngestionResponse ingestAttachment(UUID resourceId, UUID attachmentId, User currentUser);

    IngestionResponse getIngestionStatus(UUID resourceId, UUID attachmentId, User currentUser);
}
