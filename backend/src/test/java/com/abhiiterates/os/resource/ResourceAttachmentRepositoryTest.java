package com.abhiiterates.os.resource;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ResourceAttachmentRepositoryTest {

    @Autowired
    private ResourceAttachmentRepository attachmentRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = userRepository.save(UserTestFactory.createRegularUser("att_userA"));
        userB = userRepository.save(UserTestFactory.createRegularUser("att_userB"));

        Resource resA = resourceRepository.save(Resource.builder()
                .title("Algorithms Manual")
                .description("Data Structures")
                .category(ResourceCategory.BOOK)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .user(userA)
                .build());

        attachmentRepository.save(ResourceAttachment.builder()
                .fileName("algorithms_ch1.pdf")
                .fileSize(500L)
                .contentType("application/pdf")
                .downloadUrl("http://example.com/attachments/algorithms_ch1.pdf/download")
                .resource(resA)
                .build());

        Resource resB = resourceRepository.save(Resource.builder()
                .title("User B Secret Attachment")
                .description("Confidential")
                .category(ResourceCategory.OTHER)
                .priority(ResourcePriority.LOW)
                .status(ResourceStatus.ACTIVE)
                .user(userB)
                .build());

        attachmentRepository.save(ResourceAttachment.builder()
                .fileName("algorithms_cheatsheet.pdf")
                .fileSize(200L)
                .contentType("application/pdf")
                .downloadUrl("http://example.com/attachments/algorithms_cheatsheet.pdf/download")
                .resource(resB)
                .build());
    }

    @Test
    void findByResourceUserId_returnsOnlyUserAttachments() {
        List<ResourceAttachment> attachmentsA = attachmentRepository.findByResourceUserId(userA.getId());

        assertThat(attachmentsA).hasSize(1);
        assertThat(attachmentsA.get(0).getFileName()).isEqualTo("algorithms_ch1.pdf");
    }

    @Test
    void findByResourceUserIdAndSearchQuery_scopesToUserAndFiltersByQuery() {
        // User A searches for "algorithms" -> returns algorithms_ch1.pdf
        List<ResourceAttachment> resultsA = attachmentRepository.findByResourceUserIdAndSearchQuery(userA.getId(), "algorithms");
        assertThat(resultsA).hasSize(1);
        assertThat(resultsA.get(0).getFileName()).isEqualTo("algorithms_ch1.pdf");

        // User B searches for "algorithms" -> returns algorithms_cheatsheet.pdf
        List<ResourceAttachment> resultsB = attachmentRepository.findByResourceUserIdAndSearchQuery(userB.getId(), "algorithms");
        assertThat(resultsB).hasSize(1);
        assertThat(resultsB.get(0).getFileName()).isEqualTo("algorithms_cheatsheet.pdf");
    }
}
