package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.AcademicGoal;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.StudySession;
import com.abhiiterates.os.academic.domain.StudySessionStatus;
import com.abhiiterates.os.academic.dto.AcademicDashboardResponse;
import com.abhiiterates.os.academic.dto.ExamRequest;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.AcademicGoalRepository;
import com.abhiiterates.os.academic.repository.StudySessionRepository;
import com.abhiiterates.os.assessment.domain.AssessmentAttempt;
import com.abhiiterates.os.assessment.repository.AssessmentAttemptRepository;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.planner.dto.PlannedStudySessionResponse;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AcademicDashboardServiceImpl implements AcademicDashboardService {

    private final StudyPlanRepository studyPlanRepository;
    private final StudySessionRepository studySessionRepository;
    private final LearningStateService learningStateService;
    private final AcademicGoalRepository academicGoalRepository;
    private final ExamService examService;
    private final AssessmentAttemptRepository assessmentAttemptRepository;

    @Override
    @Transactional(readOnly = true)
    public AcademicDashboardResponse getDashboard(User user, String timeZoneId) {
        ZoneId zoneId = resolveZoneId(timeZoneId);
        LocalDate today = LocalDate.now(zoneId);

        Instant todayStart = today.atStartOfDay(zoneId).toInstant();
        Instant todayEnd = today.plusDays(1).atStartOfDay(zoneId).toInstant();

        // 1. Fetch completed study sessions today
        List<StudySession> sessionsToday = studySessionRepository
                .findByUserAndStatusAndStartedAtBetweenOrderByStartedAtDesc(user, StudySessionStatus.COMPLETED, todayStart, todayEnd);

        int actualStudyMinutesToday = sessionsToday.stream()
                .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                .sum();

        // 2. Fetch Active Study Plan
        Optional<StudyPlan> activePlanOpt = studyPlanRepository.findActiveByUser(user);

        AcademicDashboardResponse.TodayPlanSummary todayPlanSummary = null;
        AcademicDashboardResponse.PlanAdherenceSummary adherenceSummary = null;

        int plannedMinutesToday = 0;
        int todaySessionCount = 0;
        int completedSessionCountToday = 0;

        if (activePlanOpt.isPresent()) {
            StudyPlan plan = activePlanOpt.get();
            List<PlannedStudySession> plannedSessions = plan.getPlannedSessions() != null ? plan.getPlannedSessions() : Collections.emptyList();

            // Total plan adherence
            int totalPlannedSessions = plannedSessions.size();
            int completedPlannedSessions = (int) plannedSessions.stream()
                    .filter(s -> Boolean.TRUE.equals(s.getIsCompleted()))
                    .count();

            double adherencePct = totalPlannedSessions > 0
                    ? Math.round(((double) completedPlannedSessions / totalPlannedSessions * 100.0) * 10.0) / 10.0
                    : 0.0;

            int horizonDays = (plan.getPlanStartDate() != null && plan.getPlanEndDate() != null)
                    ? (int) (ChronoUnit.DAYS.between(plan.getPlanStartDate(), plan.getPlanEndDate()) + 1)
                    : 7;

            adherenceSummary = AcademicDashboardResponse.PlanAdherenceSummary.builder()
                    .periodDays(horizonDays)
                    .totalPlannedSessions(totalPlannedSessions)
                    .completedPlannedSessions(completedPlannedSessions)
                    .adherencePercentage(adherencePct)
                    .definition("completed planned sessions / total planned sessions in active plan")
                    .build();

            // Map sessions to response DTOs
            List<PlannedStudySessionResponse> sessionResponses = plannedSessions.stream()
                    .sorted(Comparator.comparingInt(PlannedStudySession::getDisplayOrder))
                    .map(this::mapPlannedSessionToResponse)
                    .collect(Collectors.toList());

            PlannedStudySessionResponse nextSession = sessionResponses.stream()
                    .filter(s -> !Boolean.TRUE.equals(s.isCompleted()))
                    .min(Comparator.comparingInt(PlannedStudySessionResponse::dayNumber)
                            .thenComparingInt(PlannedStudySessionResponse::displayOrder))
                    .orElse(null);

            todayPlanSummary = AcademicDashboardResponse.TodayPlanSummary.builder()
                    .planId(plan.getId())
                    .planStatus(plan.getStatus())
                    .needsReview(plan.getNeedsReview())
                    .staleReason(plan.getStaleReason())
                    .sessions(sessionResponses)
                    .nextSession(nextSession)
                    .build();

            // Day 1 / today's planned metrics
            List<PlannedStudySession> day1Sessions = plannedSessions.stream()
                    .filter(s -> s.getDayNumber() != null && s.getDayNumber() == 1)
                    .collect(Collectors.toList());

            plannedMinutesToday = day1Sessions.stream()
                    .mapToInt(s -> s.getRecommendedMinutes() != null ? s.getRecommendedMinutes() : 0)
                    .sum();
            todaySessionCount = day1Sessions.size();
            completedSessionCountToday = (int) day1Sessions.stream()
                    .filter(s -> Boolean.TRUE.equals(s.getIsCompleted()))
                    .count();
        } else {
            adherenceSummary = AcademicDashboardResponse.PlanAdherenceSummary.builder()
                    .periodDays(7)
                    .totalPlannedSessions(0)
                    .completedPlannedSessions(0)
                    .adherencePercentage(0.0)
                    .definition("completed planned sessions / total planned sessions in active plan")
                    .build();
        }

        // 3. Upcoming Exams
        List<ExamRequest.Response> upcomingExams = examService.getUserExams(user);
        ExamRequest.Response nextExam = upcomingExams.stream()
                .filter(e -> e.daysRemaining() >= 0)
                .min(Comparator.comparingLong(ExamRequest.Response::daysRemaining))
                .orElse(null);

        AcademicDashboardResponse.TodaySummary todaySummary = AcademicDashboardResponse.TodaySummary.builder()
                .localDate(today)
                .actualStudyMinutesToday(actualStudyMinutesToday)
                .plannedMinutesToday(plannedMinutesToday)
                .todaySessionCount(todaySessionCount)
                .completedSessionCountToday(completedSessionCountToday)
                .nextExamTitle(nextExam != null ? nextExam.title() : null)
                .daysToNextExam(nextExam != null ? nextExam.daysRemaining() : null)
                .build();

        // 4. Learning State Summaries (Weak / Developing / Overall counts)
        List<LearningStateResult> topicStates = learningStateService.getUserTopicsLearningState(user, null, null, null, null);

        int strongCount = 0;
        int developingCount = 0;
        int weakCount = 0;
        int insufficientCount = 0;

        List<AcademicDashboardResponse.WeakTopicSummary> weakTopicSummaries = new ArrayList<>();
        List<AcademicDashboardResponse.DevelopingTopicSummary> developingTopicSummaries = new ArrayList<>();

        for (LearningStateResult ts : topicStates) {
            if (ts.state() == LearningState.STRONG) {
                strongCount++;
            } else if (ts.state() == LearningState.DEVELOPING) {
                developingCount++;
                developingTopicSummaries.add(AcademicDashboardResponse.DevelopingTopicSummary.builder()
                        .topicId(ts.topicId())
                        .topicName(ts.topicName())
                        .subjectId(ts.subjectId())
                        .subjectName(ts.subjectName())
                        .state(ts.state())
                        .trend(ts.trend())
                        .recentAveragePercentage(ts.recentAveragePercentage())
                        .totalStudyMinutes(ts.totalStudyMinutes())
                        .lastStudiedAt(ts.lastStudiedAt())
                        .build());
            } else if (ts.state() == LearningState.WEAK) {
                weakCount++;
                weakTopicSummaries.add(AcademicDashboardResponse.WeakTopicSummary.builder()
                        .topicId(ts.topicId())
                        .topicName(ts.topicName())
                        .subjectId(ts.subjectId())
                        .subjectName(ts.subjectName())
                        .state(ts.state())
                        .trend(ts.trend())
                        .recentAveragePercentage(ts.recentAveragePercentage())
                        .totalStudyMinutes(ts.totalStudyMinutes())
                        .lastStudiedAt(ts.lastStudiedAt())
                        .reason(ts.reason())
                        .build());
            } else {
                insufficientCount++;
            }
        }

        AcademicDashboardResponse.LearningStateSummary stateSummary = AcademicDashboardResponse.LearningStateSummary.builder()
                .totalTopics(topicStates.size())
                .strongCount(strongCount)
                .developingCount(developingCount)
                .weakCount(weakCount)
                .insufficientDataCount(insufficientCount)
                .build();

        // 5. Active Goals
        List<AcademicGoal> activeGoals = academicGoalRepository.findByUserAndIsActiveTrueOrderByTargetDateAsc(user);
        List<AcademicDashboardResponse.GoalSummary> goalSummaries = activeGoals.stream()
                .map(g -> AcademicDashboardResponse.GoalSummary.builder()
                        .id(g.getId())
                        .topicId(g.getTopic().getId())
                        .topicName(g.getTopic().getName())
                        .subjectId(g.getTopic().getSubject() != null ? g.getTopic().getSubject().getId() : null)
                        .subjectName(g.getTopic().getSubject() != null ? g.getTopic().getSubject().getName() : null)
                        .targetState(g.getTargetState())
                        .targetDate(g.getTargetDate())
                        .daysRemaining(ChronoUnit.DAYS.between(today, g.getTargetDate()))
                        .isActive(g.getIsActive())
                        .description(g.getDescription())
                        .build())
                .collect(Collectors.toList());

        // 6. Study Activity (Past 7 days)
        Instant sevenDaysAgoStart = today.minusDays(6).atStartOfDay(zoneId).toInstant();
        List<StudySession> pastWeekSessions = studySessionRepository
                .findByUserAndStatusAndStartedAtBetweenOrderByStartedAtDesc(user, StudySessionStatus.COMPLETED, sevenDaysAgoStart, todayEnd);

        Map<LocalDate, Integer> dailyMinutesMap = new HashMap<>();
        Map<LocalDate, Integer> dailyCountMap = new HashMap<>();

        for (int i = 0; i < 7; i++) {
            LocalDate d = today.minusDays(6 - i);
            dailyMinutesMap.put(d, 0);
            dailyCountMap.put(d, 0);
        }

        int totalPastWeekMinutes = 0;
        Set<LocalDate> activeDaysSet = new HashSet<>();

        for (StudySession s : pastWeekSessions) {
            LocalDate sDate = s.getStartedAt().atZone(zoneId).toLocalDate();
            if (dailyMinutesMap.containsKey(sDate)) {
                int mins = s.getDurationMinutes() != null ? s.getDurationMinutes() : 0;
                dailyMinutesMap.put(sDate, dailyMinutesMap.get(sDate) + mins);
                dailyCountMap.put(sDate, dailyCountMap.get(sDate) + 1);
                totalPastWeekMinutes += mins;
                if (mins > 0) {
                    activeDaysSet.add(sDate);
                }
            }
        }

        List<AcademicDashboardResponse.DailyActivitySummary> dailyActivityList = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = today.minusDays(6 - i);
            dailyActivityList.add(AcademicDashboardResponse.DailyActivitySummary.builder()
                    .date(d)
                    .studyMinutes(dailyMinutesMap.get(d))
                    .sessionCount(dailyCountMap.get(d))
                    .build());
        }

        double consistencyPct = Math.round(((double) activeDaysSet.size() / 7.0 * 100.0) * 10.0) / 10.0;

        AcademicDashboardResponse.StudyActivitySummary studyActivitySummary = AcademicDashboardResponse.StudyActivitySummary.builder()
                .periodDays(7)
                .totalStudyMinutes(totalPastWeekMinutes)
                .activeDaysCount(activeDaysSet.size())
                .studyConsistencyPercentage(consistencyPct)
                .dailyActivity(dailyActivityList)
                .build();

        // 7. Recent Assessment Attempts (Top 5)
        List<AssessmentAttempt> recentAttempts = assessmentAttemptRepository
                .findByUserOrderByStartedAtDesc(user, PageRequest.of(0, 5))
                .getContent();

        List<AcademicDashboardResponse.RecentAssessmentSummary> recentAssessmentSummaries = recentAttempts.stream()
                .map(a -> AcademicDashboardResponse.RecentAssessmentSummary.builder()
                        .attemptId(a.getId())
                        .assessmentId(a.getAssessment().getId())
                        .assessmentTitle(a.getAssessment().getTitle())
                        .percentage(a.getPercentage() != null ? a.getPercentage() : 0.0)
                        .submittedAt(a.getSubmittedAt() != null ? a.getSubmittedAt() : a.getStartedAt())
                        .build())
                .collect(Collectors.toList());

        return AcademicDashboardResponse.builder()
                .todaySummary(todaySummary)
                .todayPlan(todayPlanSummary)
                .planAdherence(adherenceSummary)
                .learningStateSummary(stateSummary)
                .weakTopics(weakTopicSummaries)
                .developingTopics(developingTopicSummaries)
                .upcomingExams(upcomingExams)
                .goals(goalSummaries)
                .studyActivity(studyActivitySummary)
                .recentAssessments(recentAssessmentSummaries)
                .build();
    }

    private ZoneId resolveZoneId(String timeZoneId) {
        if (timeZoneId == null || timeZoneId.isBlank()) {
            return ZoneId.systemDefault();
        }
        try {
            return ZoneId.of(timeZoneId);
        } catch (Exception e) {
            return ZoneId.systemDefault();
        }
    }

    private PlannedStudySessionResponse mapPlannedSessionToResponse(PlannedStudySession session) {
        return PlannedStudySessionResponse.builder()
                .id(session.getId())
                .topicId(session.getTopic().getId())
                .topicName(session.getTopic().getName())
                .subjectId(session.getTopic().getSubject() != null ? session.getTopic().getSubject().getId() : null)
                .subjectName(session.getTopic().getSubject() != null ? session.getTopic().getSubject().getName() : null)
                .dayNumber(session.getDayNumber())
                .recommendedMinutes(session.getRecommendedMinutes())
                .priorityScore(session.getPriorityScore())
                .priorityReason(session.getPriorityReason())
                .sessionType(session.getSessionType())
                .isManualOverride(session.getIsManualOverride())
                .displayOrder(session.getDisplayOrder())
                .isCompleted(Boolean.TRUE.equals(session.getIsCompleted()))
                .completedAt(session.getCompletedAt())
                .actualMinutes(session.getActualMinutes())
                .build();
    }
}
