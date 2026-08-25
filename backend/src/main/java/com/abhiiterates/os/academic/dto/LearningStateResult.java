package com.abhiiterates.os.academic.dto;

import com.abhiiterates.os.academic.domain.EvidenceLevel;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.LearningTrend;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record LearningStateResult(
        UUID topicId,
        String topicName,
        UUID subjectId,
        String subjectName,
        LearningState state,
        LearningTrend trend,
        Double recentAveragePercentage,
        Double historicalAveragePercentage,
        Integer assessmentAttemptCount,
        Integer totalStudyMinutes,
        Integer studySessionCount,
        Instant lastStudiedAt,
        Instant lastAssessmentAt,
        Long daysSinceLastStudied,
        Long daysSinceLastAssessment,
        EvidenceLevel evidenceLevel,
        String reason
) {}
