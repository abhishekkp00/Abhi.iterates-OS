package com.abhiiterates.os.academic.dto;

import com.abhiiterates.os.academic.domain.StudySessionStatus;
import com.abhiiterates.os.academic.domain.StudySessionType;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record StudySessionResponse(
        UUID id,
        UUID userId,
        UUID topicId,
        String topicName,
        UUID subjectId,
        String subjectName,
        Instant startedAt,
        Instant endedAt,
        Integer durationMinutes,
        StudySessionStatus status,
        StudySessionType sessionType,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {}
