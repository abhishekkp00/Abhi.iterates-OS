package com.abhiiterates.os.ai.ingestion.controller;

import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.ai.ingestion.service.DocumentIngestionService;
import com.abhiiterates.os.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resources/{resourceId}/attachments/{attachmentId}/ingest")
@RequiredArgsConstructor
@Tag(name = "Document Ingestion", description = "RAG Document Ingestion & Chunking API")
@SecurityRequirement(name = "bearerAuth")
public class DocumentIngestionController {

    private final DocumentIngestionService documentIngestionService;

    @PostMapping
    @Operation(summary = "Ingest PDF attachment", description = "Extracts page-aware text and chunks document for RAG indexing")
    public ResponseEntity<IngestionResponse> ingestAttachment(
            @PathVariable UUID resourceId,
            @PathVariable UUID attachmentId,
            @AuthenticationPrincipal User currentUser) {
        IngestionResponse response = documentIngestionService.ingestAttachment(resourceId, attachmentId, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    @Operation(summary = "Get ingestion status", description = "Retrieves document ingestion status, page count, and chunk metadata")
    public ResponseEntity<IngestionResponse> getIngestionStatus(
            @PathVariable UUID resourceId,
            @PathVariable UUID attachmentId,
            @AuthenticationPrincipal User currentUser) {
        IngestionResponse response = documentIngestionService.getIngestionStatus(resourceId, attachmentId, currentUser);
        return ResponseEntity.ok(response);
    }
}
