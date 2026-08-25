package com.abhiiterates.os.academic;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.StartStudySessionRequest;
import com.abhiiterates.os.academic.repository.*;
import com.abhiiterates.os.academic.service.StudySessionService;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.exception.UnauthorizedException;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StudySessionSecurityIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private StudySessionService studySessionService;

    private User userA;
    private User userB;

    private Subject subjectUserB;
    private Topic topicUserB;

    private StudySession sessionUserB;

    @BeforeEach
    void setUp() {
        userA = userRepository.save(User.builder()
                .username("userA_" + UUID.randomUUID().toString().substring(0, 8))
                .email("userA_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .passwordHash("password")
                .active(true)
                .build());

        userB = userRepository.save(User.builder()
                .username("userB_" + UUID.randomUUID().toString().substring(0, 8))
                .email("userB_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .passwordHash("password")
                .active(true)
                .build());

        subjectUserB = subjectRepository.save(Subject.builder()
                .user(userB)
                .name("User B's Subject")
                .build());

        topicUserB = topicRepository.save(Topic.builder()
                .subject(subjectUserB)
                .name("User B's Topic")
                .build());

        sessionUserB = studySessionRepository.save(StudySession.builder()
                .user(userB)
                .topic(topicUserB)
                .startedAt(Instant.now())
                .status(StudySessionStatus.IN_PROGRESS)
                .sessionType(StudySessionType.STUDY)
                .build());
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT start a study session using User B's topic ID")
    void startSession_userCannotAccessOtherUserTopic() {
        StartStudySessionRequest request = new StartStudySessionRequest(topicUserB.getId(), StudySessionType.STUDY, "Unauthorized attempt");

        assertThatThrownBy(() -> studySessionService.startSession(request, userA))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Topic not found or does not belong to authenticated user");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT view User B's study session by ID")
    void getSessionById_userCannotAccessOtherUserSession() {
        assertThatThrownBy(() -> studySessionService.getSessionById(sessionUserB.getId(), userA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Study session not found or access denied");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT complete User B's study session")
    void completeSession_userCannotCompleteOtherUserSession() {
        assertThatThrownBy(() -> studySessionService.completeSession(sessionUserB.getId(), null, userA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Study session not found or access denied");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT cancel User B's study session")
    void cancelSession_userCannotCancelOtherUserSession() {
        assertThatThrownBy(() -> studySessionService.cancelSession(sessionUserB.getId(), userA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Study session not found or access denied");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT view User B's topic progress")
    void getTopicProgress_userCannotAccessOtherUserProgress() {
        assertThatThrownBy(() -> studySessionService.getTopicProgress(topicUserB.getId(), userA))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Topic not found or does not belong to authenticated user");
    }
}
