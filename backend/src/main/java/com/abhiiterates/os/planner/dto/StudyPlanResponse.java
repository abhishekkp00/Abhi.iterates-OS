package com.abhiiterates.os.planner.dto;

import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Full study plan response including all planned sessions grouped by day.
 */
@Builder
public record StudyPlanResponse(
    UUID id,
    StudyPlanStatus status,
    LocalDate planStartDate,
    LocalDate planEndDate,
    int planningHorizonDays,
    int totalPlannedMinutes,
    int totalAvailableMinutes,
    boolean capacityWarning,
    String capacityWarningMsg,
    boolean needsReview,
    String staleReason,
    List<PlannedStudySessionResponse> sessions,
    Instant createdAt,
    Instant updatedAt
) {}
