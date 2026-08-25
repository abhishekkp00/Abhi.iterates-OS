package com.abhiiterates.os.academic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

public class SubjectRequest {

    @NotBlank(message = "Subject name is required")
    private String name;

    private String code;
    private String color;
    private String description;

    public SubjectRequest() {}

    public SubjectRequest(String name, String code, String color, String description) {
        this.name = name;
        this.code = code;
        this.color = color;
        this.description = description;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    @Builder
    public record Response(
            UUID id,
            String name,
            String code,
            String color,
            String description,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
