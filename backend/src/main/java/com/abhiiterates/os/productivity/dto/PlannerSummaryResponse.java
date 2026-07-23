package com.abhiiterates.os.productivity.dto;

import lombok.Builder;

@Builder
public record PlannerSummaryResponse(
    long totalTasks,
    long completedTasks,
    long pendingTasks,
    double completionRate,
    long highPriorityPendingCount,
    long upcomingDeadlinesCount,
    long todayTasksCount
) {}
