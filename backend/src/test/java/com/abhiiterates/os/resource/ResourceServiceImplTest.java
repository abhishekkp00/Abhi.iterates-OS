package com.abhiiterates.os.resource;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.notification.service.NotificationService;
import com.abhiiterates.os.resource.dto.ResourceRequest;
import com.abhiiterates.os.resource.dto.ResourceResponse;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceServiceImplTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ResourceServiceImpl resourceService;

    private User userA;
    private User userB;
    private Resource resourceA;
    private ResourceRequest resourceRequest;

    @BeforeEach
    void setUp() {
        userA = UserTestFactory.createRegularUser("userA");
        userB = UserTestFactory.createRegularUser("userB");

        resourceA = Resource.builder()
                .id(UUID.randomUUID())
                .title("User A Note")
                .description("Private note owned by User A")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .starred(false)
                .user(userA)
                .attachments(new ArrayList<>())
                .build();

        resourceRequest = ResourceRequest.builder()
                .title("New Resource")
                .description("Resource description")
                .category(ResourceCategory.BOOK)
                .priority(ResourcePriority.MEDIUM)
                .status(ResourceStatus.ACTIVE)
                .starred(true)
                .build();
    }

    @Test
    void create_withValidRequest_savesAndReturnsResourceResponse() {
        when(resourceRepository.save(any(Resource.class))).thenReturn(resourceA);

        ResourceResponse response = resourceService.create(resourceRequest, userA);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo(resourceA.getTitle());
        assertThat(response.getUserId()).isEqualTo(userA.getId());
        verify(resourceRepository).save(any(Resource.class));
    }

    @Test
    void findById_ownedByCurrentUser_returnsResource() {
        when(resourceRepository.findById(resourceA.getId())).thenReturn(Optional.of(resourceA));

        ResourceResponse response = resourceService.findById(resourceA.getId(), userA);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(resourceA.getId());
    }

    @Test
    void findById_ownedByAnotherUser_throwsResourceNotFoundExceptionToConcealExistence() {
        when(resourceRepository.findById(resourceA.getId())).thenReturn(Optional.of(resourceA));

        assertThatThrownBy(() -> resourceService.findById(resourceA.getId(), userB))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Resource not found");
    }

    @Test
    void update_ownedByCurrentUser_updatesAndReturnsResource() {
        when(resourceRepository.findById(resourceA.getId())).thenReturn(Optional.of(resourceA));
        when(resourceRepository.save(any(Resource.class))).thenReturn(resourceA);

        ResourceResponse updated = resourceService.update(resourceA.getId(), resourceRequest, userA);

        assertThat(updated).isNotNull();
        verify(resourceRepository).save(resourceA);
    }

    @Test
    void update_ownedByAnotherUser_throwsResourceNotFoundException() {
        when(resourceRepository.findById(resourceA.getId())).thenReturn(Optional.of(resourceA));

        assertThatThrownBy(() -> resourceService.update(resourceA.getId(), resourceRequest, userB))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(resourceRepository, never()).save(any());
    }

    @Test
    void delete_ownedByCurrentUser_deletesResource() {
        when(resourceRepository.findById(resourceA.getId())).thenReturn(Optional.of(resourceA));

        resourceService.delete(resourceA.getId(), userA);

        verify(resourceRepository).delete(resourceA);
    }

    @Test
    void delete_ownedByAnotherUser_throwsResourceNotFoundException() {
        when(resourceRepository.findById(resourceA.getId())).thenReturn(Optional.of(resourceA));

        assertThatThrownBy(() -> resourceService.delete(resourceA.getId(), userB))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(resourceRepository, never()).delete(any());
    }

    @Test
    void archive_ownedByAnotherUser_throwsResourceNotFoundException() {
        when(resourceRepository.findById(resourceA.getId())).thenReturn(Optional.of(resourceA));

        assertThatThrownBy(() -> resourceService.archive(resourceA.getId(), userB))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void toggleStar_ownedByAnotherUser_throwsResourceNotFoundException() {
        when(resourceRepository.findById(resourceA.getId())).thenReturn(Optional.of(resourceA));

        assertThatThrownBy(() -> resourceService.toggleStar(resourceA.getId(), userB))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findAllWithFilters_passesAuthenticatedUserToRepository() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Resource> page = new PageImpl<>(List.of(resourceA));

        when(resourceRepository.findAllWithFilters(eq(userA), any(), any(), any(), any(), eq(pageable)))
                .thenReturn(page);

        Page<ResourceResponse> result = resourceService.findAllWithFilters(userA, null, null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(resourceRepository).findAllWithFilters(eq(userA), any(), any(), any(), any(), eq(pageable));
    }
}
