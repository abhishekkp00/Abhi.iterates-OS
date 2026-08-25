package com.abhiiterates.os.resource;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ResourceRepositoryTest {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = userRepository.save(UserTestFactory.createRegularUser("repo_userA"));
        userB = userRepository.save(UserTestFactory.createRegularUser("repo_userB"));

        resourceRepository.save(Resource.builder()
                .title("Calculus II Notes")
                .description("Integrals and series")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .user(userA)
                .build());

        resourceRepository.save(Resource.builder()
                .title("Physics Textbook")
                .description("Mechanics")
                .category(ResourceCategory.BOOK)
                .priority(ResourcePriority.MEDIUM)
                .status(ResourceStatus.ACTIVE)
                .user(userA)
                .build());

        resourceRepository.save(Resource.builder()
                .title("User B Chemistry Note")
                .description("Organic Chemistry")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .user(userB)
                .build());
    }

    @Test
    void findAllWithFilters_userA_returnsOnlyUserAResources() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Resource> results = resourceRepository.findAllWithFilters(userA, null, null, null, null, pageable);

        assertThat(results.getContent()).hasSize(2);
        assertThat(results.getContent()).allMatch(r -> r.getUser().getId().equals(userA.getId()));
    }

    @Test
    void findAllWithFilters_withSearchQuery_filtersByTitleOrDescription() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Resource> calculusResults = resourceRepository.findAllWithFilters(userA, "Calculus", null, null, null, pageable);
        assertThat(calculusResults.getContent()).hasSize(1);
        assertThat(calculusResults.getContent().get(0).getTitle()).isEqualTo("Calculus II Notes");

        Page<Resource> mechanicsResults = resourceRepository.findAllWithFilters(userA, "Mechanics", null, null, null, pageable);
        assertThat(mechanicsResults.getContent()).hasSize(1);
        assertThat(mechanicsResults.getContent().get(0).getTitle()).isEqualTo("Physics Textbook");
    }

    @Test
    void findAllWithFilters_withCategoryFilter_filtersByCategory() {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Resource> results = resourceRepository.findAllWithFilters(
                userA, null, List.of(ResourceCategory.BOOK), null, null, pageable);

        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).getCategory()).isEqualTo(ResourceCategory.BOOK);
    }
}
