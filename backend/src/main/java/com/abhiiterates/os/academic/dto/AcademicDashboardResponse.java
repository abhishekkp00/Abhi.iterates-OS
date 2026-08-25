package com.abhiiterates.os.academic.dto;

import com.abhiiterates.os.academic.domain.GoalTargetState;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.planner.dto.PlannedStudySessionResponse;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record AcademicDashboardResponse(
        TodaySummary todaySummary,
        TodayPlanSummary todayPlan,
        PlanAdherenceSummary planAdherence,
        LearningStateSummary learningStateSummary,
        List<WeakTopicSummary> weakTopics,
        List<DevelopingTopicSummary> developingTopics,
        List<ExamRequest.Response> upcomingExams,
        List<GoalSummary> goals,
        StudyActivitySummary studyActivity,
        List<RecentAssessmentSummary> recentAssessments
) {
    @Builder
    public record TodaySummary(
            LocalDate localDate,
            int actualStudyMinutesToday,
            int plannedMinutesToday,
            int todaySessionCount,
            int completedSessionCountToday,
            String nextExamTitle,
            Long daysToNextExam
    ) {}

    @Builder
    public record TodayPlanSummary(
            UUID planId,
            StudyPlanStatus planStatus,
            Boolean needsReview,
            String staleReason,
            List<PlannedStudySessionResponse> sessions,
            PlannedStudySessionResponse nextSession
    ) {}

    @Builder
    public record PlanAdherenceSummary(
            int periodDays,
            int totalPlannedSessions,
            int completedPlannedSessions,
            double adherencePercentage,
            String definition
    ) {}

    @Builder
    public record LearningStateSummary(
            int totalTopics,
            int strongCount,
            int developingCount,
            int weakCount,
            int insufficientDataCount
    ) {}

    @Builder
    public record WeakTopicSummary(
            UUID topicId,
            String topicName,
            UUID subjectId,
            String subjectName,
            LearningState state,
            LearningTrend trend,
            Double recentAveragePercentage,
            Integer totalStudyMinutes,
            Instant lastStudiedAt,
            String reason
    ) {}

    @Builder
    public record DevelopingTopicSummary(
            UUID topicId,
            String topicName,
            UUID subjectId,
            String subjectName,
            LearningState state,
            LearningTrend trend,
            Double recentAveragePercentage,
            Integer totalStudyMinutes,
            Instant lastStudiedAt
    ) {}

    @Builder
    public record GoalSummary(
            UUID id,
            UUID topicId,
            String topicName,
            UUID subjectId,
            String subjectName,
            GoalTargetState targetState,
            LocalDate targetDate,
            long daysRemaining,
            Boolean isActive,
            String description
    ) {}

    @Builder
    public record DailyActivitySummary(
            LocalDate date,
            int studyMinutes,
            int sessionCount
    ) {}

    @Builder
    public record StudyActivitySummary(
            int periodDays,
            int totalStudyMinutes,
            int activeDaysCount,
            double studyConsistencyPercentage,
            List<DailyActivitySummary> dailyActivity
    ) {}

    @Builder
    public record RecentAssessmentSummary(
            UUID attemptId,
            UUID assessmentId,
            String assessmentTitle,
            double percentage,
            Instant submittedAt
    ) {}
}
