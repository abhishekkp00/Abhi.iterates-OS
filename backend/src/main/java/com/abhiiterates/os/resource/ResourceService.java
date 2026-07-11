package com.abhiiterates.os.resource;

import com.abhiiterates.os.resource.dto.ResourceRequest;
import com.abhiiterates.os.resource.dto.ResourceResponse;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.UUID;

public interface ResourceService {
    Page<ResourceResponse> findAllWithFilters(
            User user,
            String search,
            Collection<ResourceCategory> categories,
            Collection<ResourcePriority> priorities,
            Collection<ResourceStatus> statuses,
            Pageable pageable
    );

    ResourceResponse findById(UUID id, User user);

    ResourceResponse create(ResourceRequest request, User user);

    ResourceResponse update(UUID id, ResourceRequest request, User user);

    void delete(UUID id, User user);

    ResourceResponse archive(UUID id, User user);
}
