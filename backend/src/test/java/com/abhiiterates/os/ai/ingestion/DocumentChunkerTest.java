package com.abhiiterates.os.ai.ingestion;

import com.abhiiterates.os.ai.ingestion.chunker.DocumentChunker;
import com.abhiiterates.os.ai.ingestion.model.ChunkOutput;
import com.abhiiterates.os.ai.ingestion.model.ExtractedDocument;
import com.abhiiterates.os.ai.ingestion.model.ExtractedPage;
import com.abhiiterates.os.ai.ingestion.normalizer.TextNormalizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentChunkerTest {

    private DocumentChunker chunker;

    @BeforeEach
    void setUp() {
        chunker = new DocumentChunker(new TextNormalizer());
    }

    @Test
    @DisplayName("chunkDocument_withMultiPageDocument_preservesPageMetadataAndWordBoundaries")
    void chunkDocument_withMultiPageDocument_preservesPageMetadataAndWordBoundaries() {
        ExtractedPage page1 = new ExtractedPage(1, "Operating systems manage hardware resources. Processes execute programs.");
        ExtractedPage page2 = new ExtractedPage(2, "CPU scheduling determines process execution order.");
        ExtractedDocument doc = new ExtractedDocument("os_notes.pdf", 2, List.of(page1, page2), "hash123", 115);

        List<ChunkOutput> chunks = chunker.chunkDocument(doc, 200, 30);

        assertThat(chunks).hasSize(2);
        assertThat(chunks.get(0).pageNumber()).isEqualTo(1);
        assertThat(chunks.get(0).text()).contains("hardware resources");
        assertThat(chunks.get(1).pageNumber()).isEqualTo(2);
        assertThat(chunks.get(1).text()).contains("CPU scheduling");
    }

    @Test
    @DisplayName("chunkDocument_withLargePage_splitsIntoOverlappingChunks")
    void chunkDocument_withLargePage_splitsIntoOverlappingChunks() {
        StringBuilder largeText = new StringBuilder();
        for (int i = 0; i < 50; i++) {
            largeText.append("Sentence ").append(i).append(" about operating system concepts. ");
        }

        ExtractedPage page1 = new ExtractedPage(1, largeText.toString());
        ExtractedDocument doc = new ExtractedDocument("large.pdf", 1, List.of(page1), "hash456", largeText.length());

        List<ChunkOutput> chunks = chunker.chunkDocument(doc, 200, 40);

        assertThat(chunks.size()).isGreaterThan(1);
        for (ChunkOutput chunk : chunks) {
            assertThat(chunk.pageNumber()).isEqualTo(1);
            assertThat(chunk.charCount()).isGreaterThan(0);
        }
    }
}
