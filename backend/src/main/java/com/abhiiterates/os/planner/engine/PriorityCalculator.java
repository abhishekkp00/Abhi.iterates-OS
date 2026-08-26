package com.abhiiterates.os.planner.engine;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.AcademicGoalRepository;
import com.abhiiterates.os.academic.repository.ExamRepository;
import com.abhiiterates.os.academic.repository.TopicPrerequisiteRepository;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.planner.config.PlannerWeightProperties;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Deterministic, explainable, and multi-component Topic Priority Engine.
 * <p>
 * Computes a {@link TopicPriorityFactor} for every topic belonging to a user using:
 * <ul>
 *   <li>Weakness component (LearningState)</li>
 *   <li>Exam urgency component (associated exams only, taking max urgency)</li>
 *   <li>Learning trend component</li>
 *   <li>Recency component</li>
 *   <li>Goal urgency component</li>
 *   <li>Prerequisite importance component (bounded dependency propagation)</li>
 *   <li>Neglect component</li>
 * </ul>
 *
 * <strong>Strictly deterministic: no LLM, no ML models, no randomness.</strong>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PriorityCalculator {

    private final LearningStateService learningStateService;
    private final AcademicGoalRepository goalRepository;
    private final TopicPrerequisiteRepository prerequisiteRepository;
    private final ExamRepository examRepository;
    private final PlannerWeightProperties plannerProps;

    @Transactional(readOnly = true)
    public List<TopicPriorityFactor> calculateAll(User user) {
        // 1. Fetch learning state results for user topics
        List<LearningStateResult> states = learningStateService.getUserTopicsLearningState(
            user, null, null, null, null
        );

        if (states.isEmpty()) {
            log.debug("[PriorityCalculator] No topics found for user [{}]", user.getId());
            return Collections.emptyList();
        }

        List<UUID> topicIds = states.stream().map(LearningStateResult::topicId).toList();

        // 2. Load active goals keyed by topicId
        Map<UUID, AcademicGoal> goalsByTopicId = goalRepository
            .findActiveGoalsForTopics(user, topicIds)
            .stream()
            .collect(Collectors.toMap(g -> g.getTopic().getId(), g -> g, (a, b) -> a));

        // 3. Load upcoming exams and build map: topicId → list of exams for that topic
        List<Exam> upcomingExams = examRepository.findUpcomingExamsWithTopics(user, LocalDate.now());
        Map<UUID, List<Exam>> examsByTopicId = new HashMap<>();
        for (Exam exam : upcomingExams) {
            if (exam.getTopics() != null) {
                for (Topic t : exam.getTopics()) {
                    examsByTopicId.computeIfAbsent(t.getId(), k -> new ArrayList<>()).add(exam);
                }
            }
        }

        // 4. Load prerequisite graph
        List<TopicPrerequisite> allEdges = prerequisiteRepository.findAllByUserId(user.getId());
        Map<UUID, List<UUID>> dependents = new HashMap<>();
        for (TopicPrerequisite edge : allEdges) {
            UUID tid = edge.getTopic().getId();
            UUID pid = edge.getPrerequisiteTopic().getId();
            dependents.computeIfAbsent(pid, k -> new ArrayList<>()).add(tid);
        }

        Map<UUID, LearningStateResult> stateByTopicId = states.stream()
            .collect(Collectors.toMap(LearningStateResult::topicId, s -> s));

        // 5. Compute factors for each topic
        List<TopicPriorityFactor> factors = new ArrayList<>();
        for (LearningStateResult state : states) {
            TopicPriorityFactor factor = computeFactor(
                state,
                goalsByTopicId.get(state.topicId()),
                examsByTopicId.getOrDefault(state.topicId(), Collections.emptyList()),
                dependents.getOrDefault(state.topicId(), Collections.emptyList()),
                stateByTopicId
            );
            factors.add(factor);
        }

        // 6. Deterministic sorting: rawScore descending, tie-breakers: exam urgency > weakness > oldest study > topicId
        factors.sort(Comparator.comparingDouble(TopicPriorityFactor::rawScore).reversed()
            .thenComparing(Comparator.comparingDouble(TopicPriorityFactor::examUrgencyFactor).reversed())
            .thenComparing(Comparator.comparingDouble(TopicPriorityFactor::weaknessFactor).reversed())
            .thenComparing(Comparator.comparingDouble(TopicPriorityFactor::neglectFactor).reversed())
            .thenComparing(TopicPriorityFactor::topicId));

        log.debug("[PriorityCalculator] Computed {} topic priorities for user [{}]", factors.size(), user.getId());
        return factors;
    }

    private TopicPriorityFactor computeFactor(
        LearningStateResult state,
        AcademicGoal goal,
        List<Exam> relevantExams,
        List<UUID> dependentTopicIds,
        Map<UUID, LearningStateResult> stateByTopicId
    ) {
        double weaknessFactor              = computeWeaknessFactor(state.state());
        double examUrgencyFactor           = computeExamUrgencyFactor(relevantExams);
        double trendFactor                 = computeTrendFactor(state.trend());
        double recencyFactor               = computeRecencyFactor(state.daysSinceLastStudied());
        double goalUrgencyFactor           = computeGoalUrgencyFactor(goal);
        double prerequisiteImportanceFactor  = computePrerequisiteImportanceFactor(dependentTopicIds, stateByTopicId);
        double neglectFactor               = computeNeglectFactor(state);

        PlannerWeightProperties.Weights w = plannerProps.getWeights();
        double rawScore = (weaknessFactor               * w.getWeakness())
                        + (examUrgencyFactor            * w.getExamUrgency())
                        + (trendFactor                  * w.getTrend())
                        + (recencyFactor                * w.getRecency())
                        + (goalUrgencyFactor            * w.getGoalUrgency())
                        + (prerequisiteImportanceFactor  * w.getPrerequisiteImportance())
                        + (neglectFactor                * w.getNeglect());

        // Clamp raw score to [0.0, 1.0]
        rawScore = Math.max(0.0, Math.min(1.0, rawScore));

        boolean isHighEffortLowPerf = checkHighEffortLowPerformance(state);
        StudySessionType strategy   = determineStrategy(state, relevantExams, isHighEffortLowPerf);

        String reason = buildReason(
            state, goal, relevantExams, weaknessFactor, trendFactor, recencyFactor,
            goalUrgencyFactor, prerequisiteImportanceFactor, neglectFactor,
            dependentTopicIds, stateByTopicId, rawScore, isHighEffortLowPerf
        );

        return new TopicPriorityFactor(
            state.topicId(), state.topicName(),
            state.subjectId(), state.subjectName(),
            weaknessFactor, examUrgencyFactor, trendFactor, recencyFactor,
            goalUrgencyFactor, prerequisiteImportanceFactor, neglectFactor,
            rawScore, reason, state.state(), strategy, isHighEffortLowPerf
        );
    }

    public double computeWeaknessFactor(LearningState state) {
        if (state == null) return 0.6;
        return switch (state) {
            case WEAK              -> 1.0;
            case INSUFFICIENT_DATA -> 0.6;
            case DEVELOPING        -> 0.5;
            case STRONG            -> 0.0;
        };
    }

    /**
     * Compute exam urgency ONLY for exams associated with this topic.
     * Takes max urgency across multiple exams to avoid unfair accumulation.
     */
    public double computeExamUrgencyFactor(List<Exam> relevantExams) {
        if (relevantExams == null || relevantExams.isEmpty()) return 0.0;
        double maxUrgency = 0.0;
        LocalDate now = LocalDate.now();

        for (Exam exam : relevantExams) {
            long days = ChronoUnit.DAYS.between(now, exam.getExamDate());
            double u;
            if (days <= 6)      u = 1.0;
            else if (days <= 14) u = 0.7;
            else if (days <= 30) u = 0.4;
            else                 u = 0.1;
            maxUrgency = Math.max(maxUrgency, u);
        }
        return maxUrgency;
    }

    public double computeTrendFactor(LearningTrend trend) {
        if (trend == null) return 0.5;
        return switch (trend) {
            case DECLINING         -> 1.0;
            case STABLE            -> 0.5;
            case INSUFFICIENT_DATA -> 0.5;
            case IMPROVING         -> 0.1;
        };
    }

    public double computeRecencyFactor(Long daysSinceLastStudied) {
        if (daysSinceLastStudied == null) return 0.7; // never studied
        if (daysSinceLastStudied == 0)    return 0.0;
        if (daysSinceLastStudied <= 1)    return 0.1;
        if (daysSinceLastStudied <= 3)    return 0.3;
        if (daysSinceLastStudied <= 7)    return 0.5;
        if (daysSinceLastStudied <= 14)   return 0.7;
        return 1.0; // > 14 days
    }

    public double computeGoalUrgencyFactor(AcademicGoal goal) {
        if (goal == null) return 0.0;
        long daysToDeadline = ChronoUnit.DAYS.between(LocalDate.now(), goal.getTargetDate());
        if (daysToDeadline <= 7)  return 1.0;
        if (daysToDeadline <= 14) return 0.7;
        if (daysToDeadline <= 30) return 0.4;
        return 0.1;
    }

    public double computePrerequisiteImportanceFactor(
        List<UUID> dependentTopicIds,
        Map<UUID, LearningStateResult> stateByTopicId
    ) {
        if (dependentTopicIds.isEmpty()) return 0.0;
        long blockedCount = dependentTopicIds.stream()
            .map(stateByTopicId::get)
            .filter(Objects::nonNull)
            .filter(s -> s.state() == LearningState.WEAK || s.state() == LearningState.INSUFFICIENT_DATA)
            .count();
        return (double) blockedCount / dependentTopicIds.size();
    }

    public double computeNeglectFactor(LearningStateResult state) {
        if (state.daysSinceLastStudied() == null) return 0.8;
        if (state.daysSinceLastStudied() > 14 && (state.totalStudyMinutes() == null || state.totalStudyMinutes() < 60)) {
            return 1.0;
        }
        return computeRecencyFactor(state.daysSinceLastStudied());
    }

    public boolean checkHighEffortLowPerformance(LearningStateResult state) {
        int threshold = plannerProps.getEngine().getHighEffortMinutesThreshold();
        int studyMins = state.totalStudyMinutes() != null ? state.totalStudyMinutes() : 0;
        double accuracy = state.recentAveragePercentage() != null ? state.recentAveragePercentage() : 0.0;
        return (studyMins >= threshold && state.state() == LearningState.WEAK) || (studyMins >= threshold && accuracy < 50.0);
    }

    public StudySessionType determineStrategy(LearningStateResult state, List<Exam> relevantExams, boolean isHighEffortLowPerf) {
        LearningState ls = state.state() != null ? state.state() : LearningState.INSUFFICIENT_DATA;
        LearningTrend tr = state.trend() != null ? state.trend() : LearningTrend.INSUFFICIENT_DATA;
        boolean hasUpcomingExam = relevantExams != null && !relevantExams.isEmpty();
        boolean lowEvidence = state.assessmentAttemptCount() == null || state.assessmentAttemptCount() < 2;

        if (isHighEffortLowPerf) {
            return StudySessionType.READING; // Prerequisite review or reading strategy
        }
        if (ls == LearningState.WEAK && lowEvidence) {
            return StudySessionType.STUDY;
        }
        if (ls == LearningState.WEAK && !lowEvidence) {
            return StudySessionType.PRACTICE;
        }
        if (ls == LearningState.DEVELOPING && tr == LearningTrend.IMPROVING) {
            return StudySessionType.PRACTICE;
        }
        if (ls == LearningState.STRONG && hasUpcomingExam) {
            return StudySessionType.REVISION;
        }
        if (ls == LearningState.STRONG && !hasUpcomingExam) {
            return StudySessionType.STUDY; // Maintenance
        }
        return StudySessionType.STUDY;
    }

    private String buildReason(
        LearningStateResult state,
        AcademicGoal goal,
        List<Exam> relevantExams,
        double weaknessFactor,
        double trendFactor,
        double recencyFactor,
        double goalUrgencyFactor,
        double prerequisiteImportanceFactor,
        double neglectFactor,
        List<UUID> dependentTopicIds,
        Map<UUID, LearningStateResult> stateByTopicId,
        double rawScore,
        boolean isHighEffortLowPerf
    ) {
        List<String> parts = new ArrayList<>();

        if (isHighEffortLowPerf) {
            parts.add(String.format("HIGH EFFORT / LOW PERFORMANCE (%d min studied, WEAK performance) — prerequisite review recommended",
                state.totalStudyMinutes() != null ? state.totalStudyMinutes() : 0));
        } else {
            parts.add(switch (state.state()) {
                case WEAK              -> String.format("WEAK mastery (recent avg: %.0f%%)",
                    state.recentAveragePercentage() != null ? state.recentAveragePercentage() : 0.0);
                case INSUFFICIENT_DATA -> "INSUFFICIENT DATA — limited assessment evidence";
                case DEVELOPING        -> String.format("DEVELOPING mastery (recent avg: %.0f%%)",
                    state.recentAveragePercentage() != null ? state.recentAveragePercentage() : 0.0);
                case STRONG            -> String.format("STRONG mastery (recent avg: %.0f%%)",
                    state.recentAveragePercentage() != null ? state.recentAveragePercentage() : 0.0);
            });
        }

        if (relevantExams != null && !relevantExams.isEmpty()) {
            Exam closest = relevantExams.get(0);
            long days = ChronoUnit.DAYS.between(LocalDate.now(), closest.getExamDate());
            parts.add(String.format("Exam '%s' in %d day(s)", closest.getTitle(), Math.max(0, days)));
        }

        if (state.trend() == LearningTrend.DECLINING) {
            parts.add("DECLINING performance trend");
        } else if (state.trend() == LearningTrend.IMPROVING) {
            parts.add("IMPROVING trend");
        }

        if (goal != null) {
            long daysToDeadline = ChronoUnit.DAYS.between(LocalDate.now(), goal.getTargetDate());
            parts.add(String.format("Goal deadline in %d day(s)", Math.max(0, daysToDeadline)));
        }

        if (!dependentTopicIds.isEmpty() && prerequisiteImportanceFactor > 0) {
            List<String> blockedNames = dependentTopicIds.stream()
                .map(stateByTopicId::get)
                .filter(Objects::nonNull)
                .filter(s -> s.state() == LearningState.WEAK || s.state() == LearningState.INSUFFICIENT_DATA)
                .map(LearningStateResult::topicName)
                .toList();
            if (!blockedNames.isEmpty()) {
                parts.add("Prerequisite for high-priority topic(s): " + String.join(", ", blockedNames));
            }
        }

        return String.join("; ", parts) + String.format(" [Priority Score: %.2f]", rawScore);
    }
}
