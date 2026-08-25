package com.abhiiterates.os.assessment.dto;

import com.abhiiterates.os.assessment.domain.AttemptStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record AssessmentAttemptResponse(
        UUID id,
        UUID userId,
        UUID assessmentId,
        String assessmentTitle,
        Instant startedAt,
        Instant submittedAt,
        AttemptStatus status,
        Double totalMarks,
        Double obtainedMarks,
        Double percentage,
        Integer totalQuestions,
        Integer correctAnswersCount,
        List<AnswerResult> answerResults,
        Instant createdAt
) {
    @Builder
    public record AnswerResult(
            UUID questionId,
            String questionText,
            UUID selectedOptionId,
            String selectedOptionText,
            Boolean isCorrect,
            Double marksAwarded,
            Double questionMarks
    ) {}
}
