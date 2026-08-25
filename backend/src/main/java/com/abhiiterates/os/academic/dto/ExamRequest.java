package com.abhiiterates.os.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class ExamRequest {

    @NotBlank(message = "Exam title is required")
    private String title;

    private String description;
    private UUID subjectId;

    @NotNull(message = "Exam date is required")
    private LocalDate examDate;

    private List<UUID> topicIds;

    public ExamRequest() {}

    public ExamRequest(String title, String description, UUID subjectId, LocalDate examDate, List<UUID> topicIds) {
        this.title = title;
        this.description = description;
        this.subjectId = subjectId;
        this.examDate = examDate;
        this.topicIds = topicIds;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }

    public List<UUID> getTopicIds() { return topicIds; }
    public void setTopicIds(List<UUID> topicIds) { this.topicIds = topicIds; }

    @Builder
    public record Response(
            UUID id,
            UUID userId,
            UUID subjectId,
            String subjectName,
            String title,
            String description,
            LocalDate examDate,
            long daysRemaining,
            int totalTopicsCount,
            int assessedTopicsCount,
            double assessmentCoveragePercentage,
            List<UUID> topicIds,
            java.time.Instant createdAt,
            java.time.Instant updatedAt
    ) {}
}
