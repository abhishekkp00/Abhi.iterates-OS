package com.abhiiterates.os.academic;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.academic.service.LearningStateService;
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

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LearningStateSecurityIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private LearningStateService learningStateService;

    private User userA;
    private User userB;

    private Subject subjectB;
    private Topic topicB;

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

        subjectB = subjectRepository.save(Subject.builder().user(userB).name("User B Subject").build());
        topicB = topicRepository.save(Topic.builder().subject(subjectB).name("User B Topic").build());
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT request learning state for User B's topic")
    void getTopicLearningState_userCannotAccessOtherUserTopic() {
        assertThatThrownBy(() -> learningStateService.getTopicLearningState(topicB.getId(), userA))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Topic not found or does not belong to authenticated user");
    }

    @Test
    @DisplayName("IDOR TEST: User A CANNOT request subject learning state summary for User B's subject")
    void getSubjectLearningStateSummary_userCannotAccessOtherUserSubject() {
        assertThatThrownBy(() -> learningStateService.getSubjectLearningStateSummary(subjectB.getId(), userA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Subject not found or access denied");
    }

    @Test
    @DisplayName("IDOR TEST: Bulk user topics learning state endpoint returns ONLY authenticated user's topics")
    void getUserTopicsLearningState_returnsOnlyUserTopics() {
        Subject subjectA = subjectRepository.save(Subject.builder().user(userA).name("User A Subject").build());
        Topic topicA = topicRepository.save(Topic.builder().subject(subjectA).name("User A Topic").build());

        List<LearningStateResult> results = learningStateService.getUserTopicsLearningState(userA, null, null, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).topicId()).isEqualTo(topicA.getId());
    }
}
