package com.abhiiterates.os.assessment.dto;

import com.abhiiterates.os.assessment.domain.AssessmentStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CreateAssessmentRequest {

    @NotBlank(message = "Assessment title is required")
    private String title;

    private String description;
    private UUID subjectId;
    private List<UUID> topicIds;
    private Integer durationMinutes;

    public CreateAssessmentRequest() {}

    public CreateAssessmentRequest(String title, String description, UUID subjectId, List<UUID> topicIds, Integer durationMinutes) {
        this.title = title;
        this.description = description;
        this.subjectId = subjectId;
        this.topicIds = topicIds;
        this.durationMinutes = durationMinutes;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public List<UUID> getTopicIds() { return topicIds; }
    public void setTopicIds(List<UUID> topicIds) { this.topicIds = topicIds; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    @Builder
    public record Response(
            UUID id,
            UUID userId,
            UUID subjectId,
            String subjectName,
            String title,
            String description,
            AssessmentStatus status,
            Integer questionCount,
            Integer durationMinutes,
            List<UUID> topicIds,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
