package com.abhiiterates.os.ai.ingestion.extractor;

import com.abhiiterates.os.ai.ingestion.exception.DocumentExtractionException;
import com.abhiiterates.os.ai.ingestion.model.ExtractedDocument;
import com.abhiiterates.os.ai.ingestion.model.ExtractedPage;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Slf4j
@Component
public class PdfDocumentExtractor implements DocumentExtractor {

    @Override
    public boolean supports(String contentType, String fileName) {
        if (StringUtils.hasText(contentType) && contentType.equalsIgnoreCase("application/pdf")) {
            return true;
        }
        return StringUtils.hasText(fileName) && fileName.toLowerCase().endsWith(".pdf");
    }

    @Override
    public ExtractedDocument extract(InputStream inputStream, String fileName) {
        if (inputStream == null) {
            throw new DocumentExtractionException("PDF input stream cannot be null for file: " + fileName);
        }

        byte[] bytes;
        try {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            inputStream.transferTo(buffer);
            bytes = buffer.toByteArray();
        } catch (Exception ex) {
            throw new DocumentExtractionException("Failed to read input stream for file: " + fileName, ex);
        }

        if (bytes.length == 0) {
            throw new DocumentExtractionException("File is empty (0 bytes): " + fileName);
        }

        String contentHash = computeSha256(bytes);

        List<ExtractedPage> pages = new ArrayList<>();
        long totalCharacters = 0;

        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.isEncrypted()) {
                throw new DocumentExtractionException("Encrypted or password-protected PDF files are not supported: " + fileName);
            }

            int totalPages = document.getNumberOfPages();
            if (totalPages == 0) {
                throw new DocumentExtractionException("PDF contains no pages: " + fileName);
            }

            PDFTextStripper stripper = new PDFTextStripper();

            for (int pageNo = 1; pageNo <= totalPages; pageNo++) {
                stripper.setStartPage(pageNo);
                stripper.setEndPage(pageNo);

                String pageText = stripper.getText(document);
                pageText = (pageText != null) ? pageText : "";

                totalCharacters += pageText.length();
                pages.add(new ExtractedPage(pageNo, pageText));
            }

            if (totalCharacters == 0 || pages.stream().allMatch(p -> p.text().isBlank())) {
                throw new DocumentExtractionException("No readable text found in PDF (scanned or image-only PDFs without OCR are not supported): " + fileName);
            }

            log.info("Successfully extracted PDF [{}]: {} pages, {} characters, SHA-256: {}", fileName, totalPages, totalCharacters, contentHash);
            return new ExtractedDocument(fileName, totalPages, pages, contentHash, totalCharacters);

        } catch (DocumentExtractionException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Error extracting text from PDF file [{}]: {}", fileName, ex.getMessage(), ex);
            throw new DocumentExtractionException("Failed to parse PDF document [" + fileName + "]: " + ex.getMessage(), ex);
        }
    }

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new DocumentExtractionException("SHA-256 digest calculation failed", ex);
        }
    }
}
