package com.abhiiterates.os.academic;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.*;
import com.abhiiterates.os.academic.repository.*;
import com.abhiiterates.os.academic.service.AcademicService;
import com.abhiiterates.os.academic.service.StudySessionService;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StudySessionProgressEndToEndTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AcademicService academicService;

    @Autowired
    private StudySessionService studySessionService;

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private TopicProgressRepository topicProgressRepository;

    private User student;
    private SubjectRequest.Response subjectResponse;
    private TopicRequest.Response topicResponse;

    @BeforeEach
    void setUp() {
        student = userRepository.save(User.builder()
                .username("student_" + UUID.randomUUID().toString().substring(0, 8))
                .email("student_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .passwordHash("password")
                .active(true)
                .build());

        subjectResponse = academicService.createSubject(
                new SubjectRequest("Operating Systems", "CS301", "#3B82F6", "Core OS Concepts"), student);

        topicResponse = academicService.createTopic(
                new TopicRequest(subjectResponse.id(), "Deadlocks & Synchronization", "Concurrency issues", 1), student);
    }

    @Test
    @DisplayName("End-to-End: Start Session -> Complete Session -> Verify DB state and TopicProgress projection")
    void endToEnd_studySessionCompletionUpdatesProgress() {
        // 1. Start Study Session
        StartStudySessionRequest startRequest = new StartStudySessionRequest(topicResponse.id(), StudySessionType.STUDY, "Initial study pass");
        StudySessionResponse startResponse = studySessionService.startSession(startRequest, student);

        assertThat(startResponse).isNotNull();
        assertThat(startResponse.status()).isEqualTo(StudySessionStatus.IN_PROGRESS);

        // Verify active session lookup
        Optional<StudySessionResponse> activeOpt = studySessionService.getActiveSession(student);
        assertThat(activeOpt).isPresent();
        assertThat(activeOpt.get().id()).isEqualTo(startResponse.id());

        // 2. Complete Study Session
        CompleteStudySessionRequest completeRequest = new CompleteStudySessionRequest("Completed 1st pass");
        StudySessionResponse completedResponse = studySessionService.completeSession(startResponse.id(), completeRequest, student);

        assertThat(completedResponse.status()).isEqualTo(StudySessionStatus.COMPLETED);
        assertThat(completedResponse.durationMinutes()).isGreaterThanOrEqualTo(1);

        // 3. Verify Database State
        StudySession dbSession = studySessionRepository.findById(startResponse.id()).orElseThrow();
        assertThat(dbSession.getStatus()).isEqualTo(StudySessionStatus.COMPLETED);
        assertThat(dbSession.getDurationMinutes()).isEqualTo(completedResponse.durationMinutes());

        // 4. Verify TopicProgress Derived Projection in Database
        Optional<TopicProgress> progressOpt = topicProgressRepository.findByUserIdAndTopicId(student.getId(), topicResponse.id());
        assertThat(progressOpt).isPresent();
        TopicProgress progress = progressOpt.get();
        assertThat(progress.getSessionCount()).isEqualTo(1);
        assertThat(progress.getTotalStudyMinutes()).isEqualTo(completedResponse.durationMinutes());
        assertThat(progress.getLastStudiedAt()).isNotNull();

        // 5. Verify TopicProgress Service DTO Response
        TopicProgressResponse progressDto = studySessionService.getTopicProgress(topicResponse.id(), student);
        assertThat(progressDto.sessionCount()).isEqualTo(1);
        assertThat(progressDto.totalStudyMinutes()).isEqualTo(completedResponse.durationMinutes());
        assertThat(progressDto.averageSessionMinutes()).isGreaterThan(0.0);
    }
}
