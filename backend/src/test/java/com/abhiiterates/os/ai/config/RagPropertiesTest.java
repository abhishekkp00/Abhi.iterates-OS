package com.abhiiterates.os.ai.config;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("RagProperties Unit Tests")
class RagPropertiesTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Should initialize with valid default Spring AI and project-specific values")
    void testDefaults() {
        RagProperties properties = new RagProperties();

        assertTrue(properties.isEnabled());
        assertEquals(800, properties.getChunkSize());
        assertEquals(350, properties.getMinChunkSizeChars());
        assertEquals(5, properties.getMinChunkLengthToEmbed());
        assertEquals(10000, properties.getMaxNumChunks());
        assertEquals(5, properties.getTopK());
        assertEquals(50, properties.getMaxTopK());
        assertEquals(0.60, properties.getSimilarityThreshold(), 0.001);
        assertEquals(4000, properties.getMaxContextChars());

        Set<ConstraintViolation<RagProperties>> violations = validator.validate(properties);
        assertTrue(violations.isEmpty(), "Default properties should be valid");
    }

    @Test
    @DisplayName("Should trigger Bean Validation constraints for invalid values")
    void testValidationFailure() {
        RagProperties properties = new RagProperties();
        properties.setChunkSize(10); // Below min 50
        properties.setMinChunkSizeChars(0); // Below min 1
        properties.setTopK(0); // Below min 1
        properties.setSimilarityThreshold(1.5); // Above max 1.0

        Set<ConstraintViolation<RagProperties>> violations = validator.validate(properties);
        assertFalse(violations.isEmpty(), "Should report violations for invalid values");
        assertTrue(violations.size() >= 4);
    }
}
