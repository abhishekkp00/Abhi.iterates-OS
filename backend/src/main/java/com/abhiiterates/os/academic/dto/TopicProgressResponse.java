package com.abhiiterates.os.academic.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record TopicProgressResponse(
        UUID id,
        UUID topicId,
        String topicName,
        UUID subjectId,
        String subjectName,
        Integer totalStudyMinutes,
        Integer sessionCount,
        Double averageSessionMinutes,
        Instant lastStudiedAt,
        Instant updatedAt
) {}
