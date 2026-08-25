package com.abhiiterates.os.planner.engine;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.AcademicGoalRepository;
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
 * Deterministic priority calculator for the Adaptive Study Planner.
 * <p>
 * Computes a {@link TopicPriorityFactor} for every topic the user has, using only:
 * <ul>
 *   <li>Learning state and trend (from the existing {@link LearningStateService})</li>
 *   <li>Topic recency (days since last study session)</li>
 *   <li>Academic goal deadlines</li>
 *   <li>Topic prerequisite graph (how many dependents are blocked)</li>
 * </ul>
 * <p>
 * <strong>No AI, no ML, no randomness.</strong> Given the same inputs, this will always
 * produce the same output. All weights are configurable via {@link PlannerWeightProperties}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PriorityCalculator {

    private final LearningStateService learningStateService;
    private final AcademicGoalRepository goalRepository;
    private final TopicPrerequisiteRepository prerequisiteRepository;
    private final PlannerWeightProperties weights;

    /**
     * Compute priority factors for all topics belonging to {@code user}.
     *
     * @param user The authenticated user
     * @return List of {@link TopicPriorityFactor}, sorted by rawScore descending (highest priority first)
     */
    @Transactional(readOnly = true)
    public List<TopicPriorityFactor> calculateAll(User user) {
        // 1. Load learning state for all user topics (does IDOR-safe lookup internally)
        List<LearningStateResult> states = learningStateService.getUserTopicsLearningState(
            user, null, null, null, null
        );

        if (states.isEmpty()) {
            log.debug("[PriorityCalculator] No topics found for user [{}]", user.getId());
            return Collections.emptyList();
        }

        // 2. Load active goals keyed by topicId
        List<UUID> topicIds = states.stream().map(LearningStateResult::topicId).toList();
        Map<UUID, AcademicGoal> goalsByTopicId = goalRepository
            .findActiveGoalsForTopics(user, topicIds)
            .stream()
            .collect(Collectors.toMap(g -> g.getTopic().getId(), g -> g));

        // 3. Load full prerequisite graph for this user
        List<TopicPrerequisite> allEdges = prerequisiteRepository.findAllByUserId(user.getId());

        // Build: topicId → list of prerequisite topic IDs (topics that must be done first)
        Map<UUID, List<UUID>> prerequisites = new HashMap<>();
        // Build: prerequisiteTopicId → list of dependent topic IDs (topics that are blocked by this one)
        Map<UUID, List<UUID>> dependents = new HashMap<>();

        for (TopicPrerequisite edge : allEdges) {
            UUID tid = edge.getTopic().getId();
            UUID pid = edge.getPrerequisiteTopic().getId();
            prerequisites.computeIfAbsent(tid, k -> new ArrayList<>()).add(pid);
            dependents.computeIfAbsent(pid, k -> new ArrayList<>()).add(tid);
        }

        // 4. Build a map of topicId → LearningState for quick prerequisite importance lookup
        Map<UUID, LearningState> stateByTopicId = states.stream()
            .collect(Collectors.toMap(LearningStateResult::topicId, LearningStateResult::state));

        // 5. Compute a factor for each topic
        List<TopicPriorityFactor> factors = new ArrayList<>();
        for (LearningStateResult state : states) {
            TopicPriorityFactor factor = computeFactor(
                state, goalsByTopicId.get(state.topicId()),
                dependents.getOrDefault(state.topicId(), Collections.emptyList()),
                stateByTopicId
            );
            factors.add(factor);
        }

        // 6. Sort by rawScore descending (highest priority first)
        factors.sort(Comparator.comparingDouble(TopicPriorityFactor::rawScore).reversed());

        log.debug("[PriorityCalculator] Computed {} topic priorities for user [{}]",
            factors.size(), user.getId());
        return factors;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Factor computation
    // ─────────────────────────────────────────────────────────────────────────

    private TopicPriorityFactor computeFactor(
        LearningStateResult state,
        AcademicGoal goal,
        List<UUID> dependentTopicIds,
        Map<UUID, LearningState> stateByTopicId
    ) {
        double weaknessFactor             = computeWeaknessFactor(state.state());
        double examUrgencyFactor          = 0.0;  // No separate Exam entity; future extension point
        double trendFactor                = computeTrendFactor(state.trend());
        double recencyFactor              = computeRecencyFactor(state.daysSinceLastStudied());
        double goalUrgencyFactor          = computeGoalUrgencyFactor(goal);
        double prerequisiteImportanceFactor = computePrerequisiteImportanceFactor(dependentTopicIds, stateByTopicId);

        PlannerWeightProperties.Weights w = weights.getWeights();
        double rawScore = (weaknessFactor             * w.getWeakness())
                        + (examUrgencyFactor           * w.getExamUrgency())
                        + (trendFactor                 * w.getTrend())
                        + (recencyFactor               * w.getRecency())
                        + (goalUrgencyFactor           * w.getGoalUrgency())
                        + (prerequisiteImportanceFactor * w.getPrerequisiteImportance());

        String reason = buildReason(state, goal, weaknessFactor, trendFactor, recencyFactor,
            goalUrgencyFactor, prerequisiteImportanceFactor, dependentTopicIds, stateByTopicId, rawScore);

        return new TopicPriorityFactor(
            state.topicId(), state.topicName(),
            state.subjectId(), state.subjectName(),
            weaknessFactor, examUrgencyFactor, trendFactor, recencyFactor,
            goalUrgencyFactor, prerequisiteImportanceFactor,
            rawScore, reason, state.state()
        );
    }

    // ── Individual factor computations ───────────────────────────────────────

    /**
     * WEAK = 1.0 (most urgent), INSUFFICIENT_DATA = 0.6 (needs initial engagement),
     * DEVELOPING = 0.5, STRONG = 0.0
     */
    public double computeWeaknessFactor(LearningState state) {
        return switch (state) {
            case WEAK              -> 1.0;
            case INSUFFICIENT_DATA -> 0.6;
            case DEVELOPING        -> 0.5;
            case STRONG            -> 0.0;
        };
    }

    /**
     * DECLINING = 1.0 (intervention needed), INSUFFICIENT_DATA = 0.5 (unknown),
     * STABLE = 0.5 (maintain), IMPROVING = 0.1 (momentum is good, less urgent)
     */
    public double computeTrendFactor(LearningTrend trend) {
        return switch (trend) {
            case DECLINING         -> 1.0;
            case STABLE            -> 0.5;
            case INSUFFICIENT_DATA -> 0.5;
            case IMPROVING         -> 0.1;
        };
    }

    /**
     * Topics not studied in > 14 days get maximum recency urgency.
     * Topics never studied before get 0.7 (moderate — needs initial engagement).
     * Topics studied today get 0.0.
     */
    public double computeRecencyFactor(Long daysSinceLastStudied) {
        if (daysSinceLastStudied == null) return 0.7; // never studied
        if (daysSinceLastStudied == 0)   return 0.0;
        if (daysSinceLastStudied <= 1)   return 0.1;
        if (daysSinceLastStudied <= 3)   return 0.3;
        if (daysSinceLastStudied <= 7)   return 0.5;
        if (daysSinceLastStudied <= 14)  return 0.7;
        return 1.0; // > 14 days ago
    }

    /**
     * Goal deadline urgency: closer deadline = higher factor.
     * If no active goal exists for this topic, returns 0.0.
     */
    public double computeGoalUrgencyFactor(AcademicGoal goal) {
        if (goal == null) return 0.0;
        long daysToDeadline = ChronoUnit.DAYS.between(LocalDate.now(), goal.getTargetDate());
        if (daysToDeadline <= 0)  return 1.0; // overdue
        if (daysToDeadline <= 7)  return 1.0;
        if (daysToDeadline <= 14) return 0.7;
        if (daysToDeadline <= 30) return 0.4;
        return 0.1;
    }

    /**
     * What fraction of topics that depend on THIS topic as a prerequisite are currently
     * in WEAK or INSUFFICIENT_DATA state?
     * <p>
     * Rationale: studying a prerequisite topic "unlocks" dependent topics. If many
     * dependents are blocked (weak/insufficient), this topic becomes more urgent.
     */
    public double computePrerequisiteImportanceFactor(
        List<UUID> dependentTopicIds,
        Map<UUID, LearningState> stateByTopicId
    ) {
        if (dependentTopicIds.isEmpty()) return 0.0;
        long blockedCount = dependentTopicIds.stream()
            .map(stateByTopicId::get)
            .filter(s -> s == LearningState.WEAK || s == LearningState.INSUFFICIENT_DATA)
            .count();
        return (double) blockedCount / dependentTopicIds.size();
    }

    // ── Reason string builder ─────────────────────────────────────────────────

    private String buildReason(
        LearningStateResult state,
        AcademicGoal goal,
        double weaknessFactor,
        double trendFactor,
        double recencyFactor,
        double goalUrgencyFactor,
        double prerequisiteImportanceFactor,
        List<UUID> dependentTopicIds,
        Map<UUID, LearningState> stateByTopicId,
        double rawScore
    ) {
        List<String> parts = new ArrayList<>();

        // Mastery state
        parts.add(switch (state.state()) {
            case WEAK              -> String.format("WEAK mastery (recent avg: %.0f%%)",
                state.recentAveragePercentage() != null ? state.recentAveragePercentage() : 0.0);
            case INSUFFICIENT_DATA -> "INSUFFICIENT DATA — needs initial assessment";
            case DEVELOPING        -> String.format("DEVELOPING mastery (recent avg: %.0f%%)",
                state.recentAveragePercentage() != null ? state.recentAveragePercentage() : 0.0);
            case STRONG            -> String.format("STRONG mastery (recent avg: %.0f%%)",
                state.recentAveragePercentage() != null ? state.recentAveragePercentage() : 0.0);
        });

        // Trend
        if (state.trend() == LearningTrend.DECLINING) {
            parts.add("DECLINING trend");
        } else if (state.trend() == LearningTrend.IMPROVING) {
            parts.add("IMPROVING trend");
        }

        // Recency
        if (state.daysSinceLastStudied() == null) {
            parts.add("never studied");
        } else if (state.daysSinceLastStudied() > 14) {
            parts.add(state.daysSinceLastStudied() + " days since last session");
        }

        // Goal urgency
        if (goal != null) {
            long daysToDeadline = ChronoUnit.DAYS.between(LocalDate.now(), goal.getTargetDate());
            if (daysToDeadline <= 0) {
                parts.add("goal deadline OVERDUE (target: " + goal.getTargetState() + ")");
            } else {
                parts.add("goal deadline in " + daysToDeadline + " days (target: " + goal.getTargetState() + ")");
            }
        }

        // Prerequisite importance
        if (!dependentTopicIds.isEmpty() && prerequisiteImportanceFactor > 0) {
            long blockedCount = dependentTopicIds.stream()
                .map(stateByTopicId::get)
                .filter(s -> s == LearningState.WEAK || s == LearningState.INSUFFICIENT_DATA)
                .count();
            parts.add(blockedCount + " dependent topic(s) blocked by weak prerequisites");
        }

        return String.join("; ", parts) + String.format(" [score: %.3f]", rawScore);
    }
}
