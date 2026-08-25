package com.abhiiterates.os.planner.service;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.TopicPrerequisiteRepository;
import com.abhiiterates.os.exception.BadRequestException;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.planner.config.PlannerWeightProperties;
import com.abhiiterates.os.planner.domain.*;
import com.abhiiterates.os.planner.dto.*;
import com.abhiiterates.os.planner.engine.PrerequisiteGraphResolver;
import com.abhiiterates.os.planner.engine.PriorityCalculator;
import com.abhiiterates.os.planner.engine.TimeAllocator;
import com.abhiiterates.os.planner.engine.TopicPriorityFactor;
import com.abhiiterates.os.planner.repository.PlannedStudySessionRepository;
import com.abhiiterates.os.planner.repository.PlannerPreferencesRepository;
import com.abhiiterates.os.planner.repository.StudyPlanRepository;
import com.abhiiterates.os.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudyPlannerServiceImpl implements StudyPlannerService {

    private final PriorityCalculator priorityCalculator;
    private final PrerequisiteGraphResolver graphResolver;
    private final TimeAllocator timeAllocator;
    private final StudyPlanRepository planRepository;
    private final PlannedStudySessionRepository sessionRepository;
    private final PlannerPreferencesRepository preferencesRepository;
    private final TopicPrerequisiteRepository prerequisiteRepository;
    private final PlannerWeightProperties plannerProps;
    private final ObjectMapper objectMapper;

    // ─────────────────────────────────────────────────────────────────────────
    // Plan Generation
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public StudyPlanResponse previewPlan(GeneratePlanRequest request, User user) {
        EffectivePreferences prefs = resolveEffectivePreferences(request, user);
        List<TopicPriorityFactor> factors = priorityCalculator.calculateAll(user);

        if (factors.isEmpty()) {
            throw new BadRequestException(
                "No topics found. Please create subjects and topics before generating a plan."
            );
        }

        List<UUID> topoOrder = resolveTopologicalOrder(factors, user);
        StudyPlan transientPlan = buildTransientPlan(prefs, user);
        TimeAllocator.AllocationResult allocation = timeAllocator.allocate(
            factors, topoOrder, user, transientPlan,
            prefs.availableMinutesPerDay(), prefs.planningHorizonDays(), prefs.preferredSessionLengthMinutes()
        );

        // Preview mode: return without persisting (id = null)
        return toResponse(null, transientPlan, allocation.sessions(),
            allocation.totalPlannedMinutes(), allocation.totalAvailableMinutes(),
            allocation.capacityWarning(), allocation.capacityWarningMsg(),
            false, null, prefs.planningHorizonDays());
    }

    @Override
    @Transactional
    public StudyPlanResponse saveDraftPlan(GeneratePlanRequest request, User user) {
        EffectivePreferences prefs = resolveEffectivePreferences(request, user);
        List<TopicPriorityFactor> factors = priorityCalculator.calculateAll(user);

        if (factors.isEmpty()) {
            throw new BadRequestException(
                "No topics found. Please create subjects and topics before generating a plan."
            );
        }

        List<UUID> topoOrder = resolveTopologicalOrder(factors, user);

        // Build and persist the plan shell first (so sessions can FK reference it)
        StudyPlan plan = StudyPlan.builder()
            .user(user)
            .status(StudyPlanStatus.DRAFT)
            .planStartDate(LocalDate.now())
            .planEndDate(LocalDate.now().plusDays(prefs.planningHorizonDays() - 1))
            .build();
        plan = planRepository.save(plan);

        TimeAllocator.AllocationResult allocation = timeAllocator.allocate(
            factors, topoOrder, user, plan,
            prefs.availableMinutesPerDay(), prefs.planningHorizonDays(), prefs.preferredSessionLengthMinutes()
        );

        // Update plan with allocation results
        plan.setTotalPlannedMinutes(allocation.totalPlannedMinutes());
        plan.setTotalAvailableMinutes(allocation.totalAvailableMinutes());
        plan.setCapacityWarning(allocation.capacityWarning());
        plan.setCapacityWarningMsg(allocation.capacityWarningMsg());
        plan.setGenerationContext(buildGenerationContext(prefs, factors));
        plan.getPlannedSessions().addAll(allocation.sessions());
        plan = planRepository.save(plan);

        log.info("[StudyPlannerService] Saved DRAFT plan [{}] with {} sessions for user [{}]",
            plan.getId(), allocation.sessions().size(), user.getId());

        return toResponse(plan.getId(), plan, allocation.sessions(),
            allocation.totalPlannedMinutes(), allocation.totalAvailableMinutes(),
            allocation.capacityWarning(), allocation.capacityWarningMsg(),
            Boolean.TRUE.equals(plan.getNeedsReview()), plan.getStaleReason(),
            prefs.planningHorizonDays());
    }

    @Override
    @Transactional
    public StudyPlanResponse activatePlan(UUID planId, User user) {
        StudyPlan plan = loadPlanForUser(planId, user);

        if (plan.getStatus() != StudyPlanStatus.DRAFT) {
            throw new BadRequestException(
                "Only DRAFT plans can be activated. Current status: " + plan.getStatus()
            );
        }

        // Expire any currently active plan
        planRepository.findActiveByUser(user).ifPresent(activePlan -> {
            activePlan.setStatus(StudyPlanStatus.EXPIRED);
            planRepository.save(activePlan);
            log.info("[StudyPlannerService] Expired previous active plan [{}] for user [{}]",
                activePlan.getId(), user.getId());
        });

        plan.setStatus(StudyPlanStatus.ACTIVE);
        plan = planRepository.save(plan);
        log.info("[StudyPlannerService] Activated plan [{}] for user [{}]", planId, user.getId());
        return toPlanResponse(plan);
    }

    @Override
    @Transactional
    public StudyPlanResponse expirePlan(UUID planId, User user) {
        StudyPlan plan = loadPlanForUser(planId, user);

        if (plan.getStatus() == StudyPlanStatus.EXPIRED || plan.getStatus() == StudyPlanStatus.COMPLETED) {
            throw new BadRequestException("Plan is already " + plan.getStatus() + ".");
        }

        plan.setStatus(StudyPlanStatus.EXPIRED);
        plan = planRepository.save(plan);
        log.info("[StudyPlannerService] Expired plan [{}] for user [{}]", planId, user.getId());
        return toPlanResponse(plan);
    }

    @Override
    @Transactional
    public StudyPlanResponse regeneratePlan(GeneratePlanRequest request, User user) {
        EffectivePreferences prefs = resolveEffectivePreferences(request, user);
        List<TopicPriorityFactor> factors = priorityCalculator.calculateAll(user);

        if (factors.isEmpty()) {
            throw new BadRequestException(
                "No topics found. Please create subjects and topics before generating a plan."
            );
        }

        List<UUID> topoOrder = resolveTopologicalOrder(factors, user);

        // Expire any currently active plan
        planRepository.findActiveByUser(user).ifPresent(activePlan -> {
            activePlan.setStatus(StudyPlanStatus.EXPIRED);
            planRepository.save(activePlan);
            log.info("[StudyPlannerService] Expired previous active plan [{}] during regeneration for user [{}]",
                activePlan.getId(), user.getId());
        });

        // Build and persist the new active plan
        StudyPlan newPlan = StudyPlan.builder()
            .user(user)
            .status(StudyPlanStatus.ACTIVE)
            .planStartDate(LocalDate.now())
            .planEndDate(LocalDate.now().plusDays(prefs.planningHorizonDays() - 1))
            .needsReview(false)
            .staleReason(null)
            .generatedAt(java.time.Instant.now())
            .build();
        newPlan = planRepository.save(newPlan);

        TimeAllocator.AllocationResult allocation = timeAllocator.allocate(
            factors, topoOrder, user, newPlan,
            prefs.availableMinutesPerDay(), prefs.planningHorizonDays(), prefs.preferredSessionLengthMinutes()
        );

        newPlan.setTotalPlannedMinutes(allocation.totalPlannedMinutes());
        newPlan.setTotalAvailableMinutes(allocation.totalAvailableMinutes());
        newPlan.setCapacityWarning(allocation.capacityWarning());
        newPlan.setCapacityWarningMsg(allocation.capacityWarningMsg());
        newPlan.setGenerationContext(buildGenerationContext(prefs, factors));
        newPlan.getPlannedSessions().addAll(allocation.sessions());
        newPlan = planRepository.save(newPlan);

        log.info("[StudyPlannerService] Regenerated new ACTIVE plan [{}] with {} sessions for user [{}]",
            newPlan.getId(), allocation.sessions().size(), user.getId());

        return toResponse(newPlan.getId(), newPlan, allocation.sessions(),
            allocation.totalPlannedMinutes(), allocation.totalAvailableMinutes(),
            allocation.capacityWarning(), allocation.capacityWarningMsg(),
            false, null, prefs.planningHorizonDays());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Plan Retrieval
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public StudyPlanResponse getPlan(UUID planId, User user) {
        StudyPlan plan = loadPlanForUser(planId, user);
        return toPlanResponse(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudyPlanSummaryResponse> getUserPlans(User user) {
        return planRepository.findByUserOrderByCreatedAtDesc(user)
            .stream()
            .map(this::toSummaryResponse)
            .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Session Override
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PlannedStudySessionResponse overrideSession(UUID planId, UUID sessionId,
        OverrideSessionRequest request, User user) {

        // IDOR: plan must belong to user
        StudyPlan plan = loadPlanForUser(planId, user);

        if (plan.getStatus() == StudyPlanStatus.EXPIRED || plan.getStatus() == StudyPlanStatus.COMPLETED) {
            throw new BadRequestException("Cannot override sessions on an " + plan.getStatus() + " plan.");
        }

        PlannedStudySession session = sessionRepository.findByIdAndUserId(sessionId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Session not found or access denied: " + sessionId));

        if (!session.getStudyPlan().getId().equals(planId)) {
            throw new BadRequestException("Session [" + sessionId + "] does not belong to plan [" + planId + "].");
        }

        if (request.recommendedMinutes() != null) {
            session.setRecommendedMinutes(request.recommendedMinutes());
        }
        if (request.sessionType() != null) {
            session.setSessionType(request.sessionType());
        }
        session.setIsManualOverride(true);
        session.setOverrideNotes(request.overrideNotes());

        PlannedStudySession saved = sessionRepository.save(session);
        log.info("[StudyPlannerService] Overrode session [{}] in plan [{}] for user [{}]",
            sessionId, planId, user.getId());
        return toSessionResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Preferences
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PlannerPreferencesDto.Response getPreferences(User user) {
        PlannerPreferences prefs = preferencesRepository.findByUser(user)
            .orElseGet(() -> buildDefaultPreferences(user));
        return toPreferencesResponse(prefs);
    }

    @Override
    @Transactional
    public PlannerPreferencesDto.Response upsertPreferences(PlannerPreferencesDto.Request request, User user) {
        PlannerPreferences prefs = preferencesRepository.findByUser(user)
            .orElseGet(() -> buildDefaultPreferences(user));

        if (request.availableMinutesPerDay() != null) {
            prefs.setAvailableMinutesPerDay(request.availableMinutesPerDay());
        }
        if (request.preferredSessionLengthMinutes() != null) {
            prefs.setPreferredSessionLengthMinutes(request.preferredSessionLengthMinutes());
        }
        if (request.planningHorizonDays() != null) {
            prefs.setPlanningHorizonDays(request.planningHorizonDays());
        }

        PlannerPreferences saved = preferencesRepository.save(prefs);
        log.info("[StudyPlannerService] Upserted preferences for user [{}]", user.getId());
        return toPreferencesResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    private record EffectivePreferences(
        int availableMinutesPerDay,
        int preferredSessionLengthMinutes,
        int planningHorizonDays
    ) {}

    /**
     * Resolve effective preferences: request overrides > saved preferences > system defaults.
     */
    private EffectivePreferences resolveEffectivePreferences(GeneratePlanRequest request, User user) {
        PlannerPreferences saved = preferencesRepository.findByUser(user).orElse(null);

        int availableMinutes = resolveValue(
            request != null ? request.availableMinutesPerDay() : null,
            saved != null ? saved.getAvailableMinutesPerDay() : null,
            120
        );
        int sessionLength = resolveValue(
            request != null ? request.preferredSessionLengthMinutes() : null,
            saved != null ? saved.getPreferredSessionLengthMinutes() : null,
            45
        );
        int horizon = resolveValue(
            request != null ? request.planningHorizonDays() : null,
            saved != null ? saved.getPlanningHorizonDays() : null,
            plannerProps.getPlanningHorizonDefaultDays()
        );
        return new EffectivePreferences(availableMinutes, sessionLength, horizon);
    }

    private int resolveValue(Integer override, Integer saved, int defaultValue) {
        if (override != null) return override;
        if (saved != null) return saved;
        return defaultValue;
    }

    private List<UUID> resolveTopologicalOrder(List<TopicPriorityFactor> factors, User user) {
        Set<UUID> topicIds = factors.stream().map(TopicPriorityFactor::topicId).collect(Collectors.toSet());
        List<UUID[]> edgePairs = prerequisiteRepository.findAllByUserId(user.getId())
            .stream()
            .map(e -> new UUID[]{e.getTopic().getId(), e.getPrerequisiteTopic().getId()})
            .toList();
        return graphResolver.resolveFromEdgePairs(topicIds, edgePairs);
    }

    private StudyPlan buildTransientPlan(EffectivePreferences prefs, User user) {
        return StudyPlan.builder()
            .user(user)
            .status(StudyPlanStatus.DRAFT)
            .planStartDate(LocalDate.now())
            .planEndDate(LocalDate.now().plusDays(prefs.planningHorizonDays() - 1))
            .build();
    }

    private StudyPlan loadPlanForUser(UUID planId, User user) {
        return planRepository.findByIdAndUser(planId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Plan not found or access denied: " + planId));
    }

    private PlannerPreferences buildDefaultPreferences(User user) {
        return PlannerPreferences.builder()
            .user(user)
            .availableMinutesPerDay(120)
            .preferredSessionLengthMinutes(45)
            .planningHorizonDays(plannerProps.getPlanningHorizonDefaultDays())
            .build();
    }

    private String buildGenerationContext(EffectivePreferences prefs, List<TopicPriorityFactor> factors) {
        try {
            Map<String, Object> ctx = new LinkedHashMap<>();
            ctx.put("availableMinutesPerDay", prefs.availableMinutesPerDay());
            ctx.put("preferredSessionLengthMinutes", prefs.preferredSessionLengthMinutes());
            ctx.put("planningHorizonDays", prefs.planningHorizonDays());
            ctx.put("topicCount", factors.size());
            ctx.put("generatedAt", java.time.Instant.now().toString());
            return objectMapper.writeValueAsString(ctx);
        } catch (Exception e) {
            return "{}";
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mapping helpers
    // ─────────────────────────────────────────────────────────────────────────

    private StudyPlanResponse toResponse(
        UUID id, StudyPlan plan,
        List<PlannedStudySession> sessions,
        int totalPlannedMinutes, int totalAvailableMinutes,
        boolean capacityWarning, String capacityWarningMsg,
        boolean needsReview, String staleReason,
        int planningHorizonDays
    ) {
        return StudyPlanResponse.builder()
            .id(id)
            .status(plan.getStatus())
            .planStartDate(plan.getPlanStartDate())
            .planEndDate(plan.getPlanEndDate())
            .planningHorizonDays(planningHorizonDays)
            .totalPlannedMinutes(totalPlannedMinutes)
            .totalAvailableMinutes(totalAvailableMinutes)
            .capacityWarning(capacityWarning)
            .capacityWarningMsg(capacityWarningMsg)
            .needsReview(needsReview)
            .staleReason(staleReason)
            .sessions(sessions.stream().map(this::toSessionResponse).toList())
            .createdAt(plan.getCreatedAt())
            .updatedAt(plan.getUpdatedAt())
            .build();
    }

    private StudyPlanResponse toPlanResponse(StudyPlan plan) {
        List<PlannedStudySession> sessions =
            sessionRepository.findByStudyPlanOrderByDayNumberAscDisplayOrderAsc(plan);
        int horizon = (int) (plan.getPlanStartDate().until(plan.getPlanEndDate(),
            java.time.temporal.ChronoUnit.DAYS) + 1);
        return toResponse(plan.getId(), plan, sessions,
            plan.getTotalPlannedMinutes(), plan.getTotalAvailableMinutes(),
            plan.getCapacityWarning(), plan.getCapacityWarningMsg(),
            Boolean.TRUE.equals(plan.getNeedsReview()), plan.getStaleReason(),
            horizon);
    }

    private StudyPlanSummaryResponse toSummaryResponse(StudyPlan plan) {
        return StudyPlanSummaryResponse.builder()
            .id(plan.getId())
            .status(plan.getStatus())
            .planStartDate(plan.getPlanStartDate())
            .planEndDate(plan.getPlanEndDate())
            .totalPlannedMinutes(plan.getTotalPlannedMinutes())
            .sessionCount(plan.getPlannedSessions().size())
            .capacityWarning(plan.getCapacityWarning())
            .needsReview(Boolean.TRUE.equals(plan.getNeedsReview()))
            .staleReason(plan.getStaleReason())
            .createdAt(plan.getCreatedAt())
            .updatedAt(plan.getUpdatedAt())
            .build();
    }

    private PlannedStudySessionResponse toSessionResponse(PlannedStudySession session) {
        Topic topic = session.getTopic();
        return PlannedStudySessionResponse.builder()
            .id(session.getId())
            .topicId(topic.getId())
            .topicName(topic.getName())
            .subjectId(topic.getSubject().getId())
            .subjectName(topic.getSubject().getName())
            .dayNumber(session.getDayNumber())
            .recommendedMinutes(session.getRecommendedMinutes())
            .priorityScore(session.getPriorityScore())
            .priorityReason(session.getPriorityReason())
            .sessionType(session.getSessionType())
            .isManualOverride(session.getIsManualOverride())
            .overrideNotes(session.getOverrideNotes())
            .isCompleted(Boolean.TRUE.equals(session.getIsCompleted()))
            .completedAt(session.getCompletedAt())
            .actualMinutes(session.getActualMinutes())
            .displayOrder(session.getDisplayOrder())
            .build();
    }

    private PlannerPreferencesDto.Response toPreferencesResponse(PlannerPreferences prefs) {
        return PlannerPreferencesDto.Response.builder()
            .id(prefs.getId())
            .availableMinutesPerDay(prefs.getAvailableMinutesPerDay())
            .preferredSessionLengthMinutes(prefs.getPreferredSessionLengthMinutes())
            .planningHorizonDays(prefs.getPlanningHorizonDays())
            .createdAt(prefs.getCreatedAt())
            .updatedAt(prefs.getUpdatedAt())
            .build();
    }
}
