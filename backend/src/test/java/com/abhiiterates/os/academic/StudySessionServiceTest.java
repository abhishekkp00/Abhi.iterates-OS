package com.abhiiterates.os.academic;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.*;
import com.abhiiterates.os.academic.repository.*;
import com.abhiiterates.os.academic.service.AcademicService;
import com.abhiiterates.os.academic.service.StudySessionServiceImpl;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudySessionServiceTest {

    @Mock
    private StudySessionRepository studySessionRepository;

    @Mock
    private TopicProgressRepository topicProgressRepository;

    @Mock
    private LearningActivityRepository learningActivityRepository;

    @Mock
    private AcademicService academicService;

    @InjectMocks
    private StudySessionServiceImpl studySessionService;

    private User user;
    private Subject subject;
    private Topic topic;
    private UUID topicId;

    @BeforeEach
    void setUp() {
        user = User.builder().id(UUID.randomUUID()).email("student@example.com").username("student").build();
        subject = Subject.builder().id(UUID.randomUUID()).user(user).name("Operating Systems").build();
        topicId = UUID.randomUUID();
        topic = Topic.builder().id(topicId).subject(subject).name("Deadlocks").build();
    }

    @Test
    @DisplayName("startSession creates IN_PROGRESS session when no active session exists")
    void startSession_success() {
        when(academicService.validateTopicOwnership(topicId, user)).thenReturn(topic);
        when(studySessionRepository.findByUserAndStatus(user, StudySessionStatus.IN_PROGRESS)).thenReturn(Collections.emptyList());

        when(studySessionRepository.save(any(StudySession.class))).thenAnswer(invocation -> {
            StudySession s = invocation.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        StartStudySessionRequest request = new StartStudySessionRequest(topicId, StudySessionType.STUDY, "Notes for deadlock");
        StudySessionResponse response = studySessionService.startSession(request, user);

        assertThat(response).isNotNull();
        assertThat(response.topicId()).isEqualTo(topicId);
        assertThat(response.status()).isEqualTo(StudySessionStatus.IN_PROGRESS);
        assertThat(response.startedAt()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    @DisplayName("startSession rejects if user already has an active session in progress")
    void startSession_rejectsDuplicateActiveSession() {
        when(academicService.validateTopicOwnership(topicId, user)).thenReturn(topic);

        StudySession existingActive = StudySession.builder()
                .id(UUID.randomUUID())
                .user(user)
                .topic(topic)
                .status(StudySessionStatus.IN_PROGRESS)
                .startedAt(Instant.now().minus(10, ChronoUnit.MINUTES))
                .build();

        when(studySessionRepository.findByUserAndStatus(user, StudySessionStatus.IN_PROGRESS))
                .thenReturn(List.of(existingActive));

        StartStudySessionRequest request = new StartStudySessionRequest(topicId, StudySessionType.STUDY, "Notes");

        assertThatThrownBy(() -> studySessionService.startSession(request, user))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User already has an active study session in progress");
    }

    @Test
    @DisplayName("completeSession calculates duration and updates TopicProgress atomically")
    void completeSession_success() {
        UUID sessionId = UUID.randomUUID();
        Instant startedAt = Instant.now().minus(45, ChronoUnit.MINUTES);

        StudySession session = StudySession.builder()
                .id(sessionId)
                .user(user)
                .topic(topic)
                .startedAt(startedAt)
                .status(StudySessionStatus.IN_PROGRESS)
                .sessionType(StudySessionType.STUDY)
                .build();

        when(studySessionRepository.findByIdAndUser(sessionId, user)).thenReturn(Optional.of(session));
        when(studySessionRepository.save(any(StudySession.class))).thenAnswer(inv -> inv.getArgument(0));

        TopicProgress existingProgress = TopicProgress.builder()
                .id(UUID.randomUUID())
                .user(user)
                .topic(topic)
                .totalStudyMinutes(60)
                .sessionCount(2)
                .build();

        when(topicProgressRepository.findByUserAndTopic(user, topic)).thenReturn(Optional.of(existingProgress));

        CompleteStudySessionRequest request = new CompleteStudySessionRequest("Finished revision");
        StudySessionResponse response = studySessionService.completeSession(sessionId, request, user);

        assertThat(response.status()).isEqualTo(StudySessionStatus.COMPLETED);
        assertThat(response.durationMinutes()).isGreaterThanOrEqualTo(45);

        ArgumentCaptor<TopicProgress> progressCaptor = ArgumentCaptor.forClass(TopicProgress.class);
        verify(topicProgressRepository).save(progressCaptor.capture());

        TopicProgress updatedProgress = progressCaptor.getValue();
        assertThat(updatedProgress.getTotalStudyMinutes()).isGreaterThanOrEqualTo(105);
        assertThat(updatedProgress.getSessionCount()).isEqualTo(3);
        assertThat(updatedProgress.getLastStudiedAt()).isNotNull();

        verify(learningActivityRepository).save(any(LearningActivity.class));
    }

    @Test
    @DisplayName("completeSession is idempotent and does not double-count progress if called twice")
    void completeSession_idempotentNoDoubleCounting() {
        UUID sessionId = UUID.randomUUID();
        Instant startedAt = Instant.now().minus(30, ChronoUnit.MINUTES);
        Instant endedAt = Instant.now();

        StudySession completedSession = StudySession.builder()
                .id(sessionId)
                .user(user)
                .topic(topic)
                .startedAt(startedAt)
                .endedAt(endedAt)
                .durationMinutes(30)
                .status(StudySessionStatus.COMPLETED)
                .sessionType(StudySessionType.STUDY)
                .build();

        when(studySessionRepository.findByIdAndUser(sessionId, user)).thenReturn(Optional.of(completedSession));

        StudySessionResponse response = studySessionService.completeSession(sessionId, new CompleteStudySessionRequest("Duplicate complete"), user);

        assertThat(response.status()).isEqualTo(StudySessionStatus.COMPLETED);
        verify(topicProgressRepository, never()).save(any(TopicProgress.class));
        verify(learningActivityRepository, never()).save(any(LearningActivity.class));
    }

    @Test
    @DisplayName("cancelSession sets CANCELLED status and does not update TopicProgress")
    void cancelSession_doesNotUpdateProgress() {
        UUID sessionId = UUID.randomUUID();
        StudySession session = StudySession.builder()
                .id(sessionId)
                .user(user)
                .topic(topic)
                .startedAt(Instant.now().minus(20, ChronoUnit.MINUTES))
                .status(StudySessionStatus.IN_PROGRESS)
                .sessionType(StudySessionType.STUDY)
                .build();

        when(studySessionRepository.findByIdAndUser(sessionId, user)).thenReturn(Optional.of(session));
        when(studySessionRepository.save(any(StudySession.class))).thenAnswer(inv -> inv.getArgument(0));

        StudySessionResponse response = studySessionService.cancelSession(sessionId, user);

        assertThat(response.status()).isEqualTo(StudySessionStatus.CANCELLED);
        verify(topicProgressRepository, never()).save(any(TopicProgress.class));
    }

    @Test
    @DisplayName("createManualSession validates timestamps and max duration limit")
    void createManualSession_validatesDuration() {
        when(academicService.validateTopicOwnership(topicId, user)).thenReturn(topic);

        Instant start = Instant.now();
        Instant end = start.minus(10, ChronoUnit.MINUTES); // Invalid: end before start

        ManualStudySessionRequest request = new ManualStudySessionRequest(topicId, StudySessionType.READING, start, end, "Invalid manual");

        assertThatThrownBy(() -> studySessionService.createManualSession(request, user))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("end timestamp must be strictly after start");
    }
}
