package com.abhiiterates.os.ai.embedding;

import com.abhiiterates.os.ai.embedding.converter.VectorConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VectorConverterTest {

    private VectorConverter vectorConverter;

    @BeforeEach
    void setUp() {
        vectorConverter = new VectorConverter();
    }

    @Test
    @DisplayName("convertToDatabaseColumn formats float array to pgvector string")
    void convertToDatabaseColumn_withValidFloatArray_formatsCorrectly() {
        float[] input = new float[]{0.1f, -0.25f, 3.14159f};
        String result = vectorConverter.convertToDatabaseColumn(input);
        assertThat(result).isEqualTo("[0.1,-0.25,3.14159]");
    }

    @Test
    @DisplayName("convertToDatabaseColumn with null array returns null")
    void convertToDatabaseColumn_withNull_returnsNull() {
        String result = vectorConverter.convertToDatabaseColumn(null);
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("convertToEntityAttribute parses pgvector string to float array")
    void convertToEntityAttribute_withValidString_parsesCorrectly() {
        String dbData = "[0.1, -0.25, 3.14159]";
        float[] result = vectorConverter.convertToEntityAttribute(dbData);
        assertThat(result).containsExactly(0.1f, -0.25f, 3.14159f);
    }

    @Test
    @DisplayName("convertToEntityAttribute with empty/null string returns empty array")
    void convertToEntityAttribute_withNullOrEmpty_returnsEmptyArray() {
        assertThat(vectorConverter.convertToEntityAttribute(null)).isEmpty();
        assertThat(vectorConverter.convertToEntityAttribute("")).isEmpty();
        assertThat(vectorConverter.convertToEntityAttribute("[]")).isEmpty();
    }
}
