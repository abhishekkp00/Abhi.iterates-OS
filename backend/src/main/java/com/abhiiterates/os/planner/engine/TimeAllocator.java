package com.abhiiterates.os.planner.engine;

import com.abhiiterates.os.academic.domain.StudySessionType;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.planner.config.PlannerWeightProperties;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Deterministic Time Allocation Engine.
 * <p>
 * Allocates available study time across topics while enforcing:
 * <ul>
 *   <li>Minimum session length (minMinutes, e.g. 20 min)</li>
 *   <li>Maximum session length (maxMinutes, e.g. 60 min)</li>
 *   <li>Daily cap (maxDailyMinutes, e.g. 240 min = 4 hours)</li>
 *   <li>Topological prerequisite precedence (prerequisites scheduled before dependents)</li>
 *   <li>Proportional priority-based distribution with no sub-20 min micro-sessions</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TimeAllocator {

    private final PlannerWeightProperties plannerProps;
    private final TopicRepository topicRepository;

    public record AllocationResult(
        List<PlannedStudySession> sessions,
        int totalPlannedMinutes,
        int totalAvailableMinutes,
        boolean capacityWarning,
        String capacityWarningMsg
    ) {}

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
        int minBlock = Math.max(10, sessionCfg.getMinMinutes());
        int maxBlock = sessionCfg.getMaxMinutes();
        int dailyCap = Math.min(availableMinutesPerDay, sessionCfg.getMaxDailyMinutes());
        int totalAvailableMinutes = dailyCap * planningHorizonDays;

        if (prioritizedFactors.isEmpty()) {
            return new AllocationResult(Collections.emptyList(), 0, totalAvailableMinutes, false, null);
        }

        Map<UUID, TopicPriorityFactor> factorByTopicId = new LinkedHashMap<>();
        for (TopicPriorityFactor f : prioritizedFactors) {
            factorByTopicId.put(f.topicId(), f);
        }

        List<UUID> orderedTopicIds = mergeTopologicalAndPriority(topoOrder, prioritizedFactors);

        int[] dayRemainingMinutes = new int[planningHorizonDays];
        Arrays.fill(dayRemainingMinutes, dailyCap);

        List<PlannedStudySession> sessions = new ArrayList<>();
        int totalPlannedMinutes = 0;
        int displayOrder = 0;

        // If available time is extremely constrained (< minBlock), allocate to top priority topic only
        if (dailyCap < minBlock && planningHorizonDays == 1) {
            TopicPriorityFactor topFactor = prioritizedFactors.get(0);
            Topic topic = topicRepository.findById(topFactor.topicId()).orElse(null);
            if (topic != null) {
                PlannedStudySession session = PlannedStudySession.builder()
                    .studyPlan(plan)
                    .user(user)
                    .topic(topic)
                    .dayNumber(1)
                    .recommendedMinutes(dailyCap)
                    .priorityScore(topFactor.rawScore())
                    .priorityReason(topFactor.reason())
                    .sessionType(topFactor.recommendedStrategy() != null ? topFactor.recommendedStrategy() : StudySessionType.STUDY)
                    .isManualOverride(false)
                    .displayOrder(0)
                    .build();
                return new AllocationResult(List.of(session), dailyCap, totalAvailableMinutes, false, null);
            }
        }

        for (UUID topicId : orderedTopicIds) {
            TopicPriorityFactor factor = factorByTopicId.get(topicId);
            if (factor == null) continue;

            int sessionMinutes = computeSessionLength(factor, sessionCfg, minBlock, maxBlock);

            // Find best day slot respecting capacity and prerequisite ordering
            int allocatedDay = -1;
            for (int d = 0; d < planningHorizonDays; d++) {
                if (dayRemainingMinutes[d] >= sessionMinutes) {
                    allocatedDay = d + 1;
                    dayRemainingMinutes[d] -= sessionMinutes;
                    break;
                }
            }

            // If no day has full block capacity, try fitting a minBlock on the least-loaded day
            if (allocatedDay == -1) {
                int leastLoaded = findLeastLoadedDay(dayRemainingMinutes);
                if (dayRemainingMinutes[leastLoaded] >= minBlock) {
                    sessionMinutes = dayRemainingMinutes[leastLoaded];
                    allocatedDay = leastLoaded + 1;
                    dayRemainingMinutes[leastLoaded] = 0;
                }
            }

            if (allocatedDay == -1) {
                log.debug("[TimeAllocator] Skipping topic [{}] — daily cap reached for horizon", factor.topicName());
                continue;
            }

            Topic topic = topicRepository.findById(topicId).orElse(null);
            if (topic == null) continue;

            PlannedStudySession session = PlannedStudySession.builder()
                .studyPlan(plan)
                .user(user)
                .topic(topic)
                .dayNumber(allocatedDay)
                .recommendedMinutes(sessionMinutes)
                .priorityScore(factor.rawScore())
                .priorityReason(factor.reason())
                .sessionType(factor.recommendedStrategy() != null ? factor.recommendedStrategy() : StudySessionType.STUDY)
                .isManualOverride(false)
                .displayOrder(displayOrder++)
                .build();

            sessions.add(session);
            totalPlannedMinutes += sessionMinutes;
        }

        sessions.sort(Comparator.comparingInt(PlannedStudySession::getDayNumber)
            .thenComparingInt(PlannedStudySession::getDisplayOrder));

        for (int i = 0; i < sessions.size(); i++) {
            sessions.get(i).setDisplayOrder(i);
        }

        boolean capacityWarning = totalPlannedMinutes > totalAvailableMinutes;
        String capacityWarningMsg = capacityWarning ? String.format(
            "Plan requires %d minutes but capacity cap is %d minutes.", totalPlannedMinutes, totalAvailableMinutes
        ) : null;

        return new AllocationResult(sessions, totalPlannedMinutes, totalAvailableMinutes, capacityWarning, capacityWarningMsg);
    }

    public int computeSessionLength(TopicPriorityFactor factor, PlannerWeightProperties.Session cfg, int minBlock, int maxBlock) {
        int baseMinutes = switch (factor.learningState()) {
            case WEAK              -> cfg.getWeakTopicBase();
            case DEVELOPING        -> cfg.getDevelopingTopicBase();
            case STRONG            -> cfg.getStrongTopicBase();
            case INSUFFICIENT_DATA -> cfg.getDevelopingTopicBase();
        };

        double urgency = factor.rawScore();
        int adjustment = (int) ((maxBlock - baseMinutes) * urgency * 0.4);
        int recommended = baseMinutes + adjustment;
        return Math.max(minBlock, Math.min(maxBlock, recommended));
    }

    private List<UUID> mergeTopologicalAndPriority(List<UUID> topoOrder, List<TopicPriorityFactor> prioritizedFactors) {
        Map<UUID, Integer> priorityRank = new HashMap<>();
        for (int i = 0; i < prioritizedFactors.size(); i++) {
            priorityRank.put(prioritizedFactors.get(i).topicId(), i);
        }

        Map<UUID, Integer> topoRank = new HashMap<>();
        for (int i = 0; i < topoOrder.size(); i++) {
            topoRank.put(topoOrder.get(i), i);
        }

        List<UUID> allIds = prioritizedFactors.stream().map(TopicPriorityFactor::topicId).toList();
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
}
