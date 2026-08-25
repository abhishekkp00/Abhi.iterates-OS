package com.abhiiterates.os.ai.ingestion.chunker;

import com.abhiiterates.os.ai.ingestion.model.ChunkOutput;
import com.abhiiterates.os.ai.ingestion.model.ExtractedDocument;
import com.abhiiterates.os.ai.ingestion.model.ExtractedPage;
import com.abhiiterates.os.ai.ingestion.normalizer.TextNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentChunker {

    private final TextNormalizer textNormalizer;

    @Value("${rag.ingestion.chunk-size:1000}")
    private int targetChunkSize;

    @Value("${rag.ingestion.chunk-overlap:150}")
    private int targetChunkOverlap;

    public List<ChunkOutput> chunkDocument(ExtractedDocument document) {
        return chunkDocument(document, this.targetChunkSize, this.targetChunkOverlap);
    }

    public List<ChunkOutput> chunkDocument(ExtractedDocument document, int chunkSize, int chunkOverlap) {
        List<ChunkOutput> chunks = new ArrayList<>();
        if (document == null || document.pages() == null || document.pages().isEmpty()) {
            return chunks;
        }

        int chunkIndex = 0;

        for (ExtractedPage page : document.pages()) {
            String normalizedText = textNormalizer.normalize(page.text());
            if (normalizedText.isBlank()) {
                continue;
            }

            // If page text fits within chunkSize, create single page chunk
            if (normalizedText.length() <= chunkSize) {
                chunkIndex++;
                chunks.add(new ChunkOutput(
                        chunkIndex,
                        page.pageNumber(),
                        page.pageNumber(),
                        page.pageNumber(),
                        normalizedText,
                        normalizedText.length()
                ));
            } else {
                // Page is larger than chunkSize: split page into overlapping chunks
                List<String> pageChunks = splitTextIntoChunks(normalizedText, chunkSize, chunkOverlap);
                for (String chunkText : pageChunks) {
                    chunkIndex++;
                    chunks.add(new ChunkOutput(
                            chunkIndex,
                            page.pageNumber(),
                            page.pageNumber(),
                            page.pageNumber(),
                            chunkText,
                            chunkText.length()
                    ));
                }
            }
        }

        log.info("Chunked document [{}] into {} chunks (chunkSize: {}, overlap: {})", document.fileName(), chunks.size(), chunkSize, chunkOverlap);
        return chunks;
    }

    private List<String> splitTextIntoChunks(String text, int chunkSize, int chunkOverlap) {
        List<String> result = new ArrayList<>();
        int length = text.length();
        int start = 0;

        while (start < length) {
            int end = Math.min(start + chunkSize, length);

            // If we are not at the end of the text, break at a clean word boundary
            if (end < length) {
                int lastSpace = text.lastIndexOf(' ', end);
                int lastNewline = text.lastIndexOf('\n', end);
                int boundary = Math.max(lastSpace, lastNewline);

                if (boundary > start + (chunkSize / 2)) {
                    end = boundary;
                }
            }

            String chunk = text.substring(start, end).trim();
            if (!chunk.isBlank()) {
                result.add(chunk);
            }

            if (end >= length) {
                break;
            }

            // Move start forward by (end - start - overlap), ensuring progress
            int step = (end - start) - chunkOverlap;
            if (step <= 0) {
                step = Math.max(1, end - start);
            }
            start += step;
        }

        return result;
    }
}
