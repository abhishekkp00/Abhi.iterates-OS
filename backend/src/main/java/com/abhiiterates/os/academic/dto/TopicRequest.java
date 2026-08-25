package com.abhiiterates.os.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

public class TopicRequest {

    @NotNull(message = "Subject ID is required")
    private UUID subjectId;

    @NotBlank(message = "Topic name is required")
    private String name;

    private String description;
    private Integer orderIndex;

    public TopicRequest() {}

    public TopicRequest(UUID subjectId, String name, String description, Integer orderIndex) {
        this.subjectId = subjectId;
        this.name = name;
        this.description = description;
        this.orderIndex = orderIndex;
    }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    @Builder
    public record Response(
            UUID id,
            UUID subjectId,
            String subjectName,
            String name,
            String description,
            Integer orderIndex,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
