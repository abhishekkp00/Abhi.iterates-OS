package com.abhiiterates.os.academic.dto;

import com.abhiiterates.os.academic.domain.ExamStudyPhase;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.academic.domain.StudySessionType;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record ExamCoverageResponse(
        UUID examId,
        String examTitle,
        LocalDate examDate,
        long daysRemaining,
        ExamStudyPhase globalPhase,
        int totalTopicsCount,
        int studiedTopicsCount,
        int assessedTopicsCount,
        double studyCoveragePercentage,
        double assessmentCoveragePercentage,
        int weakTopicsCount,
        int developingTopicsCount,
        int strongTopicsCount,
        int insufficientDataTopicsCount,
        String recommendedStrategySummary,
        List<ExamTopicBreakdownItem> topicBreakdown
) {
    @Builder
    public record ExamTopicBreakdownItem(
            UUID topicId,
            String topicName,
            UUID subjectId,
            String subjectName,
            LearningState learningState,
            LearningTrend trend,
            int studyMinutes,
            Double recentAccuracyPercentage,
            int assessmentAttemptCount,
            StudySessionType recommendedStrategy,
            ExamStudyPhase topicPhase,
            double priorityScore,
            String reason
    ) {}
}
