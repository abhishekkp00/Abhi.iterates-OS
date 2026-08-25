package com.abhiiterates.os.ai;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class AiConversationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private AiConversationRepository conversationRepository;

    @Autowired
    private AiMessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    private User userA;
    private User userB;
    private AiConversation convA;

    @BeforeEach
    void setUp() {
        userA = userRepository.save(UserTestFactory.createRegularUser("conv_userA"));
        userB = userRepository.save(UserTestFactory.createRegularUser("conv_userB"));

        convA = conversationRepository.save(AiConversation.builder()
                .title("Math Study Session")
                .preview("How do matrix multiplications work?")
                .user(userA)
                .build());

        messageRepository.save(AiMessage.builder()
                .role(MessageRole.USER)
                .content("How do matrix multiplications work?")
                .tokenCount(10)
                .conversation(convA)
                .build());

        messageRepository.save(AiMessage.builder()
                .role(MessageRole.ASSISTANT)
                .content("Matrix multiplication takes row by column dot products...")
                .tokenCount(20)
                .conversation(convA)
                .build());

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void findByUserOrderByUpdatedAtDesc_filtersByUser() {
        Page<AiConversation> pageA = conversationRepository.findByUserOrderByUpdatedAtDesc(userA, PageRequest.of(0, 10));
        assertThat(pageA.getContent()).hasSize(1);
        assertThat(pageA.getContent().get(0).getTitle()).isEqualTo("Math Study Session");

        Page<AiConversation> pageB = conversationRepository.findByUserOrderByUpdatedAtDesc(userB, PageRequest.of(0, 10));
        assertThat(pageB.getContent()).isEmpty();
    }

    @Test
    void findByIdAndUserWithMessages_eagerLoadsMessagesForOwner() {
        Optional<AiConversation> result = conversationRepository.findByIdAndUserWithMessages(convA.getId(), userA);

        assertThat(result).isPresent();
        assertThat(result.get().getMessages()).hasSize(2);
        assertThat(result.get().getMessages().get(0).getRole()).isEqualTo(MessageRole.USER);
    }

    @Test
    void findByIdAndUserWithMessages_returnsEmptyForNonOwner() {
        Optional<AiConversation> result = conversationRepository.findByIdAndUserWithMessages(convA.getId(), userB);

        assertThat(result).isEmpty();
    }
}
