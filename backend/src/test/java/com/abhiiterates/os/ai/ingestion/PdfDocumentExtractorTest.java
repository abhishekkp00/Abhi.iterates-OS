package com.abhiiterates.os.ai.ingestion;

import com.abhiiterates.os.ai.ingestion.exception.DocumentExtractionException;
import com.abhiiterates.os.ai.ingestion.extractor.PdfDocumentExtractor;
import com.abhiiterates.os.ai.ingestion.model.ExtractedDocument;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PdfDocumentExtractorTest {

    private PdfDocumentExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new PdfDocumentExtractor();
    }

    @Test
    @DisplayName("extract_withValidMultiPagePdf_extractsPageAwareTextAndHash")
    void extract_withValidMultiPagePdf_extractsPageAwareTextAndHash() throws IOException {
        byte[] pdfBytes = createTestPdf("Page 1 text content.", "Page 2 text content.");
        ByteArrayInputStream inputStream = new ByteArrayInputStream(pdfBytes);

        ExtractedDocument doc = extractor.extract(inputStream, "test_notes.pdf");

        assertThat(doc).isNotNull();
        assertThat(doc.fileName()).isEqualTo("test_notes.pdf");
        assertThat(doc.pageCount()).isEqualTo(2);
        assertThat(doc.pages()).hasSize(2);
        assertThat(doc.pages().get(0).pageNumber()).isEqualTo(1);
        assertThat(doc.pages().get(0).text()).contains("Page 1 text content.");
        assertThat(doc.pages().get(1).pageNumber()).isEqualTo(2);
        assertThat(doc.pages().get(1).text()).contains("Page 2 text content.");
        assertThat(doc.contentHash()).isNotBlank();
    }

    @Test
    @DisplayName("extract_withEmptyOrCorruptStream_throwsDocumentExtractionException")
    void extract_withEmptyOrCorruptStream_throwsDocumentExtractionException() {
        ByteArrayInputStream emptyStream = new ByteArrayInputStream(new byte[0]);
        assertThatThrownBy(() -> extractor.extract(emptyStream, "empty.pdf"))
                .isInstanceOf(DocumentExtractionException.class)
                .hasMessageContaining("empty");

        ByteArrayInputStream corruptStream = new ByteArrayInputStream("Not a PDF file content".getBytes());
        assertThatThrownBy(() -> extractor.extract(corruptStream, "corrupt.pdf"))
                .isInstanceOf(DocumentExtractionException.class);
    }

    private byte[] createTestPdf(String... pageTexts) throws IOException {
        try (PDDocument document = new PDDocument()) {
            for (String text : pageTexts) {
                PDPage page = new PDPage();
                document.addPage(page);

                try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                    contentStream.beginText();
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    contentStream.newLineAtOffset(50, 700);
                    contentStream.showText(text);
                    contentStream.endText();
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }
}
