package com.abhiiterates.os.ai.ingestion.extractor;

import com.abhiiterates.os.ai.ingestion.model.ExtractedDocument;

import java.io.InputStream;

public interface DocumentExtractor {

    boolean supports(String contentType, String fileName);

    ExtractedDocument extract(InputStream inputStream, String fileName);
}
