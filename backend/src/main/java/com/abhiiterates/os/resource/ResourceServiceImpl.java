package com.abhiiterates.os.resource;

import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.dto.AttachmentResponse;
import com.abhiiterates.os.resource.dto.ResourceRequest;
import com.abhiiterates.os.resource.dto.ResourceResponse;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    @Override
    public Page<ResourceResponse> findAllWithFilters(
            User user,
            String search,
            Collection<ResourceCategory> categories,
            Collection<ResourcePriority> priorities,
            Collection<ResourceStatus> statuses,
            Pageable pageable
    ) {
        // Map empty parameters to null so they are skipped in JPQL COALESCE
        Collection<ResourceCategory> cats = (categories == null || categories.isEmpty()) ? null : categories;
        Collection<ResourcePriority> pris = (priorities == null || priorities.isEmpty()) ? null : priorities;
        Collection<ResourceStatus> stats = (statuses == null || statuses.isEmpty()) ? null : statuses;

        return resourceRepository.findAllWithFilters(user, search, cats, pris, stats, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public ResourceResponse findById(UUID id, User user) {
        Resource resource = getResourceAndValidateOwner(id, user);
        return mapToResponse(resource);
    }

    @Override
    @Transactional
    public ResourceResponse create(ResourceRequest request, User user) {
        Resource resource = Resource.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority())
                .status(request.getStatus())
                .deadline(request.getDeadline())
                .tags(request.getTags())
                .user(user)
                .build();

        Resource saved = resourceRepository.save(resource);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ResourceResponse update(UUID id, ResourceRequest request, User user) {
        Resource resource = getResourceAndValidateOwner(id, user);

        resource.setTitle(request.getTitle());
        resource.setDescription(request.getDescription());
        resource.setCategory(request.getCategory());
        resource.setPriority(request.getPriority());
        resource.setStatus(request.getStatus());
        resource.setDeadline(request.getDeadline());
        resource.setTags(request.getTags());

        Resource updated = resourceRepository.save(resource);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void delete(UUID id, User user) {
        Resource resource = getResourceAndValidateOwner(id, user);
        resourceRepository.delete(resource);
    }

    @Override
    @Transactional
    public ResourceResponse archive(UUID id, User user) {
        Resource resource = getResourceAndValidateOwner(id, user);
        resource.setStatus(ResourceStatus.ARCHIVED);
        Resource updated = resourceRepository.save(resource);
        return mapToResponse(updated);
    }

    private Resource getResourceAndValidateOwner(UUID id, User user) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + id));

        // Enforce user ownership isolation
        if (!resource.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Resource not found with ID: " + id);
        }

        return resource;
    }

    private ResourceResponse mapToResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .category(resource.getCategory())
                .priority(resource.getPriority())
                .status(resource.getStatus())
                .deadline(resource.getDeadline())
                .tags(resource.getTags())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .userId(resource.getUser().getId())
                .attachments(resource.getAttachments().stream()
                        .map(att -> AttachmentResponse.builder()
                                .id(att.getId())
                                .fileName(att.getFileName())
                                .fileSize(att.getFileSize())
                                .contentType(att.getContentType())
                                .downloadUrl(att.getDownloadUrl())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
