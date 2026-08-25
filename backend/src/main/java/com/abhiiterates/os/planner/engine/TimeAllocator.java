package com.abhiiterates.os.planner.engine;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.planner.config.PlannerWeightProperties;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.academic.domain.StudySessionType;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Allocates recommended study time across a planning horizon.
 * <p>
 * Given a prioritized list of {@link TopicPriorityFactor}s, the allocator:
 * <ol>
 *   <li>Computes a recommended session length per topic (based on mastery state and urgency)</li>
 *   <li>Distributes sessions across days, respecting {@code availableMinutesPerDay} per day</li>
 *   <li>Applies prerequisite-aware ordering so prerequisite topics appear on earlier days</li>
 *   <li>Detects capacity overflow and sets {@code capacityWarning} on the plan</li>
 * </ol>
 * <p>
 * <strong>No session is ever shorter than {@code minMinutes} or longer than {@code maxMinutes}.</strong>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TimeAllocator {

    private final PlannerWeightProperties plannerProps;
    private final TopicRepository topicRepository;

    /**
     * Result of a single allocation run.
     */
    public record AllocationResult(
        List<PlannedStudySession> sessions,
        int totalPlannedMinutes,
        int totalAvailableMinutes,
        boolean capacityWarning,
        String capacityWarningMsg
    ) {}

    /**
     * Allocate sessions for the given priority factors.
     *
     * @param prioritizedFactors Topics sorted by priority (highest first) from PriorityCalculator
     * @param topoOrder          Topologically ordered topic IDs from PrerequisiteGraphResolver
     * @param user               Authenticated user
     * @param plan               The StudyPlan entity being populated (id must be set)
     * @param availableMinutesPerDay   Daily capacity
     * @param planningHorizonDays      Number of days in the plan
     * @param preferredSessionMinutes  User's preferred session length (used as a hint)
     * @return AllocationResult with sessions assigned to days
     */
    public AllocationResult allocate(
        List<TopicPriorityFactor> prioritizedFactors,
        List<UUID> topoOrder,
        User user,
        StudyPlan plan,
        int availableMinutesPerDay,
        int planningHorizonDays,
        int preferredSessionMinutes
    ) {
        PlannerWeightProperties.Session sessionCfg = plannerProps.getSession();
        int totalAvailableMinutes = availableMinutesPerDay * planningHorizonDays;

        // Build a priority-rank lookup: topicId → priorityFactor
        Map<UUID, TopicPriorityFactor> factorByTopicId = new LinkedHashMap<>();
        for (TopicPriorityFactor f : prioritizedFactors) {
            factorByTopicId.put(f.topicId(), f);
        }

        // Determine final ordering respecting both topological order and priority:
        // Topics with prerequisites appear before their dependents, but within
        // the same "tier" (no prerequisites), higher-priority topics appear first.
        List<UUID> orderedTopicIds = mergeTopologicalAndPriority(topoOrder, prioritizedFactors);

        // Day capacity tracker: day 1..N with remaining minutes per day
        int[] dayRemainingMinutes = new int[planningHorizonDays];
        Arrays.fill(dayRemainingMinutes, availableMinutesPerDay);

        List<PlannedStudySession> sessions = new ArrayList<>();
        int totalPlannedMinutes = 0;
        int displayOrder = 0;
        int currentDay = 1; // 1-based

        for (UUID topicId : orderedTopicIds) {
            TopicPriorityFactor factor = factorByTopicId.get(topicId);
            if (factor == null) continue; // topic not in prioritized list (filtered out)

            int sessionMinutes = computeSessionLength(factor, sessionCfg, preferredSessionMinutes);

            // Find the next available day slot
            int allocatedDay = -1;
            for (int d = currentDay - 1; d < planningHorizonDays; d++) {
                if (dayRemainingMinutes[d] >= sessionMinutes) {
                    allocatedDay = d + 1; // convert 0-based index to 1-based day
                    dayRemainingMinutes[d] -= sessionMinutes;
                    break;
                }
            }

            if (allocatedDay == -1) {
                // No day has enough remaining capacity — try to fit on the least-loaded day
                // This only happens when ALL days are overfull; a capacityWarning will be set.
                int leastLoadedDay = findLeastLoadedDay(dayRemainingMinutes);
                allocatedDay = leastLoadedDay + 1;
                dayRemainingMinutes[leastLoadedDay] -= sessionMinutes;
            }

            // Look up the Topic entity for this session
            Topic topic = topicRepository.findById(topicId).orElse(null);
            if (topic == null) {
                log.warn("[TimeAllocator] Topic not found in DB during allocation: {}", topicId);
                continue;
            }

            PlannedStudySession session = PlannedStudySession.builder()
                .studyPlan(plan)
                .user(user)
                .topic(topic)
                .dayNumber(allocatedDay)
                .recommendedMinutes(sessionMinutes)
                .priorityScore(factor.rawScore())
                .priorityReason(factor.reason())
                .sessionType(selectSessionType(factor))
                .isManualOverride(false)
                .displayOrder(displayOrder++)
                .build();

            sessions.add(session);
            totalPlannedMinutes += sessionMinutes;
        }

        // Sort sessions by day then displayOrder for a clean output
        sessions.sort(Comparator.comparingInt(PlannedStudySession::getDayNumber)
            .thenComparingInt(PlannedStudySession::getDisplayOrder));

        // Reset display order after sorting
        for (int i = 0; i < sessions.size(); i++) {
            sessions.get(i).setDisplayOrder(i);
        }

        // Detect capacity overflow
        boolean capacityWarning = totalPlannedMinutes > totalAvailableMinutes;
        String capacityWarningMsg = null;
        if (capacityWarning) {
            int overflowMinutes = totalPlannedMinutes - totalAvailableMinutes;
            capacityWarningMsg = String.format(
                "Plan requires %d minutes but only %d minutes are available " +
                "(%d min/day × %d days). %d minutes overflow — consider increasing " +
                "daily availability or reducing the planning horizon.",
                totalPlannedMinutes, totalAvailableMinutes,
                availableMinutesPerDay, planningHorizonDays, overflowMinutes
            );
            log.warn("[TimeAllocator] Capacity warning for user [{}]: {}", user.getId(), capacityWarningMsg);
        }

        log.debug("[TimeAllocator] Allocated {} sessions ({} min) over {} days for user [{}]",
            sessions.size(), totalPlannedMinutes, planningHorizonDays, user.getId());

        return new AllocationResult(sessions, totalPlannedMinutes, totalAvailableMinutes,
            capacityWarning, capacityWarningMsg);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compute recommended session length in minutes for a topic.
     * Base is determined by mastery state. Urgency nudges toward max.
     * Result is always within [minMinutes, maxMinutes].
     */
    public int computeSessionLength(
        TopicPriorityFactor factor,
        PlannerWeightProperties.Session cfg,
        int preferredSessionMinutes
    ) {
        int baseMinutes = switch (factor.learningState()) {
            case WEAK              -> cfg.getWeakTopicBase();
            case DEVELOPING        -> cfg.getDevelopingTopicBase();
            case STRONG            -> cfg.getStrongTopicBase();
            case INSUFFICIENT_DATA -> cfg.getDevelopingTopicBase(); // treat like developing
        };

        // High urgency (rawScore > 0.7): nudge toward max
        // Low urgency (rawScore < 0.3): nudge toward preferred / min
        double urgencyFactor = factor.rawScore();
        int urgencyAdjustment = (int) ((cfg.getMaxMinutes() - baseMinutes) * urgencyFactor * 0.3);
        int recommended = baseMinutes + urgencyAdjustment;

        // Clamp to configured bounds
        return Math.max(cfg.getMinMinutes(), Math.min(cfg.getMaxMinutes(), recommended));
    }

    /**
     * Merge topological order with priority ranking.
     * Prerequisites always appear before dependents, but within the same "tier"
     * (topics with equal prerequisites precedence), higher-priority topics go first.
     */
    private List<UUID> mergeTopologicalAndPriority(
        List<UUID> topoOrder,
        List<TopicPriorityFactor> prioritizedFactors
    ) {
        // Build priority rank: topicId → position in prioritized list (lower = higher priority)
        Map<UUID, Integer> priorityRank = new HashMap<>();
        for (int i = 0; i < prioritizedFactors.size(); i++) {
            priorityRank.put(prioritizedFactors.get(i).topicId(), i);
        }

        // Build topo rank: topicId → position in topo order (lower = earlier prerequisite)
        Map<UUID, Integer> topoRank = new HashMap<>();
        for (int i = 0; i < topoOrder.size(); i++) {
            topoRank.put(topoOrder.get(i), i);
        }

        // Collect all topic IDs present in priority factors
        List<UUID> allIds = prioritizedFactors.stream().map(TopicPriorityFactor::topicId).toList();

        // Sort: first by topo rank (ascending), then by priority rank (ascending = higher priority)
        return allIds.stream()
            .sorted(Comparator
                .comparingInt((UUID id) -> topoRank.getOrDefault(id, Integer.MAX_VALUE))
                .thenComparingInt(id -> priorityRank.getOrDefault(id, Integer.MAX_VALUE))
            )
            .toList();
    }

    private int findLeastLoadedDay(int[] dayRemainingMinutes) {
        int maxIdx = 0;
        for (int i = 1; i < dayRemainingMinutes.length; i++) {
            if (dayRemainingMinutes[i] > dayRemainingMinutes[maxIdx]) {
                maxIdx = i;
            }
        }
        return maxIdx;
    }

    /**
     * Select the most appropriate session type based on the topic's learning state.
     * WEAK topics benefit from PRACTICE; STRONG topics benefit from REVISION; others from STUDY.
     */
    private StudySessionType selectSessionType(TopicPriorityFactor factor) {
        return switch (factor.learningState()) {
            case WEAK              -> StudySessionType.PRACTICE;
            case STRONG            -> StudySessionType.REVISION;
            case DEVELOPING        -> StudySessionType.STUDY;
            case INSUFFICIENT_DATA -> StudySessionType.STUDY;
        };
    }
}
