package com.abhiiterates.os.assessment.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record TopicPerformanceResponse(
        UUID topicId,
        String topicName,
        UUID subjectId,
        String subjectName,
        Integer totalAttempts,
        Integer totalQuestionsAttempted,
        Integer totalQuestionsCorrect,
        Double totalMarksObtained,
        Double totalMarksAvailable,
        Double averagePercentage,
        Double latestPercentage,
        Instant lastEvaluatedAt
) {}
