package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.dto.*;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface StudySessionService {
    StudySessionResponse startSession(StartStudySessionRequest request, User user);
    StudySessionResponse completeSession(UUID sessionId, CompleteStudySessionRequest request, User user);
    StudySessionResponse cancelSession(UUID sessionId, User user);
    StudySessionResponse createManualSession(ManualStudySessionRequest request, User user);
    
    Optional<StudySessionResponse> getActiveSession(User user);
    StudySessionResponse getSessionById(UUID sessionId, User user);
    Page<StudySessionResponse> getUserSessions(User user, Pageable pageable);
    Page<StudySessionResponse> getUserSessionsByDateRange(User user, Instant start, Instant end, Pageable pageable);
    
    TopicProgressResponse getTopicProgress(UUID topicId, User user);
}
