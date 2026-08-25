package com.abhiiterates.os.planner.event;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.assessment.event.AssessmentSubmittedEvent;
import com.abhiiterates.os.notification.domain.NotificationType;
import com.abhiiterates.os.notification.service.NotificationService;
import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Event listener that connects the Assessment system to the Adaptive Study Planner.
 * <p>
 * Listens for {@link AssessmentSubmittedEvent} AFTER transaction commit to evaluate if new
 * learning evidence materially affects the student's active study plan.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LearningLoopEventListener {

    private final StudyPlanRepository planRepository;
    private final LearningStateService learningStateService;
    private final NotificationService notificationService;

    @org.springframework.context.event.EventListener
    @Transactional
    public void onAssessmentSubmitted(AssessmentSubmittedEvent event) {
        User user = event.getUser();
        Set<Topic> affectedTopics = event.getAffectedTopics();
        Map<Topic, Double> topicPctMap = event.getTopicPercentages();

        if (affectedTopics.isEmpty()) {
            return;
        }

        Optional<StudyPlan> activePlanOpt = planRepository.findActiveByUser(user);
        if (activePlanOpt.isEmpty()) {
            log.debug("No active study plan found for user [{}]. Skipping plan staleness check.", user.getId());
            return;
        }

        StudyPlan activePlan = activePlanOpt.get();
        Set<Topic> plannedTopics = activePlan.getPlannedSessions().stream()
                .map(PlannedStudySession::getTopic)
                .collect(Collectors.toSet());

        // Find topics in the active plan that received new assessment evidence
        List<Topic> relevantTopics = affectedTopics.stream()
                .filter(plannedTopics::contains)
                .toList();

        if (relevantTopics.isEmpty()) {
            log.debug("Submitted assessment topics do not overlap with active plan for user [{}].", user.getId());
            return;
        }

        String attemptIdStr = event.getAttempt().getId().toString();

        // Idempotency check: Skip if already marked stale for this attempt
        if (Boolean.TRUE.equals(activePlan.getNeedsReview())
                && activePlan.getStaleReason() != null
                && activePlan.getStaleReason().contains(attemptIdStr)) {
            log.debug("Active plan [{}] already marked stale for attempt [{}]. Skipping.", activePlan.getId(), attemptIdStr);
            return;
        }

        // Build explanatory stale reason summarizing the new evidence
        StringBuilder reasonBuilder = new StringBuilder();
        reasonBuilder.append("New assessment evidence recorded (Attempt ").append(attemptIdStr.substring(0, 8)).append("): ");

        List<String> topicSummaries = relevantTopics.stream().map(t -> {
            Double score = topicPctMap.get(t);
            LearningStateResult state = learningStateService.getTopicLearningState(t.getId(), user);
            String stateName = state != null && state.state() != null ? state.state().name() : "UPDATED";
            return String.format("%s (Score: %.1f%%, State: %s)", t.getName(), score != null ? score : 0.0, stateName);
        }).toList();

        reasonBuilder.append(String.join("; ", topicSummaries));
        String staleReason = reasonBuilder.toString();
        if (staleReason.length() > 500) {
            staleReason = staleReason.substring(0, 496) + "...";
        }

        activePlan.setNeedsReview(true);
        activePlan.setStaleReason(staleReason);
        planRepository.save(activePlan);

        log.info("[LearningLoopEventListener] Flagged active study plan [{}] needsReview=true for user [{}]. Reason: {}",
                activePlan.getId(), user.getId(), staleReason);

        // Dispatch user notification
        try {
            String notifMsg = "Your learning progress for " + relevantTopics.get(0).getName() +
                    " has updated. Review your study plan to optimize your schedule.";
            notificationService.createNotification(
                    user,
                    NotificationType.STUDY_PLAN_REVIEW,
                    notifMsg,
                    "/planner",
                    activePlan.getId()
            );
        } catch (Exception ex) {
            log.warn("Failed to create notification for plan review: {}", ex.getMessage());
        }
    }
}
