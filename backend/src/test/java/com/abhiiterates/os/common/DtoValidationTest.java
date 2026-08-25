package com.abhiiterates.os.common;

import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.resource.dto.ResourceRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class DtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void registerRequest_withInvalidEmailAndPassword_hasViolations() {
        RegisterRequest request = RegisterRequest.builder()
                .email("invalid-email")
                .username("")
                .password("short")
                .build();

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("email"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("username"));
    }

    @Test
    void registerRequest_withValidData_hasNoViolations() {
        RegisterRequest request = RegisterRequest.builder()
                .email("valid@student.edu")
                .username("validstudent")
                .password("SecureP@ss123")
                .firstName("John")
                .lastName("Doe")
                .build();

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void loginRequest_withBlankEmailOrPassword_hasViolations() {
        LoginRequest request = LoginRequest.builder()
                .email("")
                .password("")
                .build();

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertThat(violations).hasSize(2);
    }

    @Test
    void resourceRequest_withMissingTitleOrCategory_hasViolations() {
        ResourceRequest request = ResourceRequest.builder()
                .title("")
                .category(null)
                .priority(null)
                .status(null)
                .build();

        Set<ConstraintViolation<ResourceRequest>> violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("category"));
    }

    @Test
    void chatRequest_withBlankMessage_hasViolations() {
        ChatRequest request = new ChatRequest("", null, null, null);

        Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("message"));
    }
}
