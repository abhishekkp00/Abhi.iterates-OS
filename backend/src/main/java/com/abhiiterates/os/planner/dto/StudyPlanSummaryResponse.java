package com.abhiiterates.os.planner.dto;

import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Lightweight plan list item for the "My Plans" index view.
 */
@Builder
public record StudyPlanSummaryResponse(
    UUID id,
    StudyPlanStatus status,
    LocalDate planStartDate,
    LocalDate planEndDate,
    int totalPlannedMinutes,
    int sessionCount,
    boolean capacityWarning,
    Instant createdAt,
    Instant updatedAt
) {}
