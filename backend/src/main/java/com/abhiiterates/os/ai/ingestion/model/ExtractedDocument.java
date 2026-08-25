package com.abhiiterates.os.ai.ingestion.model;

import java.util.List;

public record ExtractedDocument(
        String fileName,
        int pageCount,
        List<ExtractedPage> pages,
        String contentHash,
        long totalCharacterCount
) {}
