package com.abhiiterates.os.common;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO designed to demonstrate Jakarta Validation constraints and responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationTestDto {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email format")
    private String email;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(STUDENT|CREATOR|ADMIN)$", message = "Role must be STUDENT, CREATOR, or ADMIN")
    private String role;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number must be in E.164 format (e.g. +919876543210)")
    private String phoneNumber;
}
