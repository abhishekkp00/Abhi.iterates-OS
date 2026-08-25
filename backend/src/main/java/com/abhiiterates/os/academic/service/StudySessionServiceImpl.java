package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.*;
import com.abhiiterates.os.academic.repository.*;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.exception.UnauthorizedException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudySessionServiceImpl implements StudySessionService {

    private final StudySessionRepository studySessionRepository;
    private final TopicProgressRepository topicProgressRepository;
    private final LearningActivityRepository learningActivityRepository;
    private final AcademicService academicService;

    private static final int MAX_MANUAL_SESSION_MINUTES = 1440; // 24 hours max

    @Override
    @Transactional
    public StudySessionResponse startSession(StartStudySessionRequest request, User user) {
        Topic topic = academicService.validateTopicOwnership(request.getTopicId(), user);

        // Enforce at most 1 active IN_PROGRESS session per user
        List<StudySession> activeSessions = studySessionRepository.findByUserAndStatus(user, StudySessionStatus.IN_PROGRESS);
        if (!activeSessions.isEmpty()) {
            throw new IllegalArgumentException("User already has an active study session in progress. Complete or cancel it before starting a new one.");
        }

        StudySession session = StudySession.builder()
                .user(user)
                .topic(topic)
                .startedAt(Instant.now())
                .status(StudySessionStatus.IN_PROGRESS)
                .sessionType(request.getSessionType() != null ? request.getSessionType() : StudySessionType.STUDY)
                .notes(request.getNotes())
                .build();

        StudySession saved = studySessionRepository.save(session);
        log.info("Started study session [{}] for topic [{}] user [{}]", saved.getId(), topic.getName(), user.getId());
        return mapSessionToResponse(saved);
    }

    @Override
    @Transactional
    public StudySessionResponse completeSession(UUID sessionId, CompleteStudySessionRequest request, User user) {
        StudySession session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found or access denied: " + sessionId));

        // Idempotency check: If already completed, return existing response without re-incrementing progress
        if (session.getStatus() == StudySessionStatus.COMPLETED) {
            log.warn("Study session [{}] was already completed. Skipping duplicate progress increment.", sessionId);
            return mapSessionToResponse(session);
        }

        if (session.getStatus() == StudySessionStatus.CANCELLED) {
            throw new IllegalStateException("Cannot complete a cancelled study session.");
        }

        Instant endedAt = Instant.now();
        int durationMinutes = Math.max(1, (int) Duration.between(session.getStartedAt(), endedAt).toMinutes());

        session.setEndedAt(endedAt);
        session.setDurationMinutes(durationMinutes);
        session.setStatus(StudySessionStatus.COMPLETED);
        if (request != null && request.getNotes() != null && !request.getNotes().isBlank()) {
            session.setNotes(request.getNotes());
        }

        StudySession completedSession = studySessionRepository.save(session);

        // Atomic update of derived TopicProgress projection
        updateTopicProgress(user, session.getTopic(), durationMinutes, endedAt);

        // Log Learning Activity event
        recordLearningActivity(user, session.getTopic(), completedSession, LearningActivityType.STUDY_SESSION_COMPLETED, endedAt, durationMinutes);

        log.info("Completed study session [{}] for topic [{}] with [{}] minutes for user [{}]",
                sessionId, session.getTopic().getName(), durationMinutes, user.getId());

        return mapSessionToResponse(completedSession);
    }

    @Override
    @Transactional
    public StudySessionResponse cancelSession(UUID sessionId, User user) {
        StudySession session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found or access denied: " + sessionId));

        if (session.getStatus() == StudySessionStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel an already completed study session.");
        }

        session.setStatus(StudySessionStatus.CANCELLED);
        session.setEndedAt(Instant.now());

        StudySession cancelled = studySessionRepository.save(session);
        log.info("Cancelled study session [{}] for user [{}]", sessionId, user.getId());
        return mapSessionToResponse(cancelled);
    }

    @Override
    @Transactional
    public StudySessionResponse createManualSession(ManualStudySessionRequest request, User user) {
        Topic topic = academicService.validateTopicOwnership(request.getTopicId(), user);

        if (!request.getEndedAt().isAfter(request.getStartedAt())) {
            throw new IllegalArgumentException("Session end timestamp must be strictly after start timestamp.");
        }

        int durationMinutes = (int) Duration.between(request.getStartedAt(), request.getEndedAt()).toMinutes();
        if (durationMinutes <= 0) {
            throw new IllegalArgumentException("Session duration must be greater than 0 minutes.");
        }
        if (durationMinutes > MAX_MANUAL_SESSION_MINUTES) {
            throw new IllegalArgumentException("Manual session duration cannot exceed " + MAX_MANUAL_SESSION_MINUTES + " minutes (24 hours).");
        }

        StudySession session = StudySession.builder()
                .user(user)
                .topic(topic)
                .startedAt(request.getStartedAt())
                .endedAt(request.getEndedAt())
                .durationMinutes(durationMinutes)
                .status(StudySessionStatus.COMPLETED)
                .sessionType(request.getSessionType() != null ? request.getSessionType() : StudySessionType.STUDY)
                .notes(request.getNotes())
                .build();

        StudySession saved = studySessionRepository.save(session);

        // Atomic update of derived TopicProgress projection
        updateTopicProgress(user, topic, durationMinutes, request.getEndedAt());

        // Log Learning Activity event
        recordLearningActivity(user, topic, saved, LearningActivityType.STUDY_SESSION_COMPLETED, request.getEndedAt(), durationMinutes);

        log.info("Created manual study session [{}] for topic [{}] with [{}] minutes for user [{}]",
                saved.getId(), topic.getName(), durationMinutes, user.getId());

        return mapSessionToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<StudySessionResponse> getActiveSession(User user) {
        List<StudySession> active = studySessionRepository.findByUserAndStatus(user, StudySessionStatus.IN_PROGRESS);
        if (active.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(mapSessionToResponse(active.get(0)));
    }

    @Override
    @Transactional(readOnly = true)
    public StudySessionResponse getSessionById(UUID sessionId, User user) {
        StudySession session = studySessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found or access denied: " + sessionId));
        return mapSessionToResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudySessionResponse> getUserSessions(User user, Pageable pageable) {
        return studySessionRepository.findByUserOrderByStartedAtDesc(user, pageable)
                .map(this::mapSessionToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudySessionResponse> getUserSessionsByDateRange(User user, Instant start, Instant end, Pageable pageable) {
        return studySessionRepository.findByUserAndDateRange(user, start, end, pageable)
                .map(this::mapSessionToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TopicProgressResponse getTopicProgress(UUID topicId, User user) {
        Topic topic = academicService.validateTopicOwnership(topicId, user);
        
        Optional<TopicProgress> progressOpt = topicProgressRepository.findByUserAndTopic(user, topic);

        if (progressOpt.isEmpty()) {
            return TopicProgressResponse.builder()
                    .topicId(topic.getId())
                    .topicName(topic.getName())
                    .subjectId(topic.getSubject().getId())
                    .subjectName(topic.getSubject().getName())
                    .totalStudyMinutes(0)
                    .sessionCount(0)
                    .averageSessionMinutes(0.0)
                    .lastStudiedAt(null)
                    .updatedAt(Instant.now())
                    .build();
        }

        TopicProgress progress = progressOpt.get();
        double avg = progress.getSessionCount() > 0 ? (double) progress.getTotalStudyMinutes() / progress.getSessionCount() : 0.0;

        return TopicProgressResponse.builder()
                .id(progress.getId())
                .topicId(topic.getId())
                .topicName(topic.getName())
                .subjectId(topic.getSubject().getId())
                .subjectName(topic.getSubject().getName())
                .totalStudyMinutes(progress.getTotalStudyMinutes())
                .sessionCount(progress.getSessionCount())
                .averageSessionMinutes(Math.round(avg * 100.0) / 100.0)
                .lastStudiedAt(progress.getLastStudiedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }

    private void updateTopicProgress(User user, Topic topic, int durationMinutes, Instant lastStudiedAt) {
        TopicProgress progress = topicProgressRepository.findByUserAndTopic(user, topic)
                .orElseGet(() -> TopicProgress.builder()
                        .user(user)
                        .topic(topic)
                        .totalStudyMinutes(0)
                        .sessionCount(0)
                        .build());

        progress.setTotalStudyMinutes(progress.getTotalStudyMinutes() + durationMinutes);
        progress.setSessionCount(progress.getSessionCount() + 1);

        if (progress.getLastStudiedAt() == null || lastStudiedAt.isAfter(progress.getLastStudiedAt())) {
            progress.setLastStudiedAt(lastStudiedAt);
        }

        topicProgressRepository.save(progress);
    }

    private void recordLearningActivity(User user, Topic topic, StudySession session, LearningActivityType type, Instant occurredAt, int minutes) {
        String metadata = String.format("{\"durationMinutes\":%d, \"sessionType\":\"%s\"}", minutes, session.getSessionType().name());
        LearningActivity activity = LearningActivity.builder()
                .user(user)
                .topic(topic)
                .studySession(session)
                .activityType(type)
                .occurredAt(occurredAt)
                .metadataJson(metadata)
                .build();

        learningActivityRepository.save(activity);
    }

    private StudySessionResponse mapSessionToResponse(StudySession session) {
        return StudySessionResponse.builder()
                .id(session.getId())
                .userId(session.getUser().getId())
                .topicId(session.getTopic().getId())
                .topicName(session.getTopic().getName())
                .subjectId(session.getTopic().getSubject().getId())
                .subjectName(session.getTopic().getSubject().getName())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .durationMinutes(session.getDurationMinutes())
                .status(session.getStatus())
                .sessionType(session.getSessionType())
                .notes(session.getNotes())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}
