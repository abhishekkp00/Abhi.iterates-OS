package com.abhiiterates.os.ai.ingestion;

import com.abhiiterates.os.ai.ingestion.normalizer.TextNormalizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TextNormalizerTest {

    private TextNormalizer normalizer;

    @BeforeEach
    void setUp() {
        normalizer = new TextNormalizer();
    }

    @Test
    @DisplayName("normalize_withCarriageReturnsAndControlChars_cleansText")
    void normalize_withCarriageReturnsAndControlChars_cleansText() {
        String raw = "Line 1\r\nLine 2\r\nLine 3\u0007\u0000";
        String result = normalizer.normalize(raw);

        assertThat(result).isEqualTo("Line 1\nLine 2\nLine 3");
    }

    @Test
    @DisplayName("normalize_withHyphenatedLineBreak_rejoinsWordSafely")
    void normalize_withHyphenatedLineBreak_rejoinsWordSafely() {
        String raw = "An oper-\nating system manages processes.";
        String result = normalizer.normalize(raw);

        assertThat(result).isEqualTo("An operating system manages processes.");
    }

    @Test
    @DisplayName("normalize_withMultipleBlankLines_preservesParagraphStructure")
    void normalize_withMultipleBlankLines_preservesParagraphStructure() {
        String raw = "Paragraph 1\n\n\n\n\nParagraph 2";
        String result = normalizer.normalize(raw);

        assertThat(result).isEqualTo("Paragraph 1\n\nParagraph 2");
    }

    @Test
    @DisplayName("normalize_withBlankInput_returnsEmptyString")
    void normalize_withBlankInput_returnsEmptyString() {
        assertThat(normalizer.normalize(null)).isEqualTo("");
        assertThat(normalizer.normalize("   ")).isEqualTo("");
    }
}
