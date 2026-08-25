package com.abhiiterates.os.planner.dto;

import com.abhiiterates.os.academic.domain.StudySessionType;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a single recommended session line item within a study plan.
 */
@Builder
public record PlannedStudySessionResponse(
    UUID id,
    UUID topicId,
    String topicName,
    UUID subjectId,
    String subjectName,
    int dayNumber,
    int recommendedMinutes,
    double priorityScore,
    String priorityReason,
    StudySessionType sessionType,
    boolean isManualOverride,
    String overrideNotes,
    boolean isCompleted,
    Instant completedAt,
    Integer actualMinutes,
    int displayOrder
) {}
