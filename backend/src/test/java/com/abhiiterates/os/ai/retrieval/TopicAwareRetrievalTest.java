package com.abhiiterates.os.ai.retrieval;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.ai.context.dto.AiContext;
import com.abhiiterates.os.ai.context.service.AiContextBuilder;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.dto.TutorMode;
import com.abhiiterates.os.exception.UnauthorizedException;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Integration tests for Topic-Aware Retrieval and IDOR Pre-Retrieval Security.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TopicAwareRetrievalTest {

    @Autowired private UserRepository userRepository;
    @Autowired private SubjectRepository subjectRepository;
    @Autowired private TopicRepository topicRepository;
    @Autowired private AiContextBuilder contextBuilder;

    @MockBean private EmbeddingModel embeddingModel;

    private User userA;
    private User userB;
    private Subject subjectA;
    private Topic topicA;

    @BeforeEach
    void setUp() {
        when(embeddingModel.embed(anyString())).thenReturn(new float[1536]);

        userA = createUser("rag-user-a@test.com");
        userB = createUser("rag-user-b@test.com");

        subjectA = subjectRepository.save(Subject.builder()
                .user(userA).name("Operating Systems").color("#3B82F6").build());
        topicA = topicRepository.save(Topic.builder()
                .subject(subjectA).name("Deadlocks").orderIndex(1).build());
    }

    @Test
    @DisplayName("Valid topic ownership: context builder formats topic header")
    void buildContext_validTopicOwnership_includesTopicHeader() {
        ChatRequest request = new ChatRequest(
                null, "Explain deadlocks", null, null, topicA.getId().toString(), TutorMode.EXPLAIN
        );

        AiContext context = contextBuilder.buildContext(request, userA);

        assertThat(context).isNotNull();
        assertThat(context.formattedText()).contains("TOPIC: Deadlocks");
        assertThat(context.formattedText()).contains("SUBJECT: Operating Systems");
        assertThat(context.formattedText()).contains("TUTOR MODE: EXPLAIN");
    }

    @Test
    @DisplayName("IDOR Protection: User B querying User A's topic throws UnauthorizedException")
    void buildContext_unownedTopic_throwsResourceNotFound() {
        ChatRequest request = new ChatRequest(
                null, "Explain deadlocks", null, null, topicA.getId().toString(), TutorMode.EXPLAIN
        );

        // User B attempts to pass User A's topic ID
        assertThatThrownBy(() -> contextBuilder.buildContext(request, userB))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Topic not found or does not belong");
    }

    @Test
    @DisplayName("No hits for topic: returns 0 sources with explicit No-Source notice in context text")
    void buildContext_noHits_includesNoMatchingNotice() {
        ChatRequest request = new ChatRequest(
                null, "Quantum gravity equation", null, null, topicA.getId().toString(), TutorMode.SUMMARY
        );

        AiContext context = contextBuilder.buildContext(request, userA);

        assertThat(context.sources()).isEmpty();
        assertThat(context.formattedText()).contains("NO MATCHING ACADEMIC RESOURCES FOUND.");
    }

    private User createUser(String email) {
        String username = email.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 4);
        return userRepository.save(User.builder()
                .email(email)
                .username(username)
                .firstName("Test")
                .lastName("User")
                .passwordHash("$2a$10$test")
                .emailVerified(true)
                .build());
    }
}
