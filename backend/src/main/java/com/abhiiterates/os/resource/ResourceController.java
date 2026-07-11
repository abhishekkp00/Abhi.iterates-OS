package com.abhiiterates.os.resource;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.resource.dto.ResourceRequest;
import com.abhiiterates.os.resource.dto.ResourceResponse;
import com.abhiiterates.os.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ResourceResponse>>> getAllResources(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<ResourceCategory> categories,
            @RequestParam(required = false) List<ResourcePriority> priorities,
            @RequestParam(required = false) List<ResourceStatus> statuses,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            HttpServletRequest servletRequest
    ) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction sortDirection = (sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1]))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

        Page<ResourceResponse> data = resourceService.findAllWithFilters(
                user, search, categories, priorities, statuses, pageable
        );

        ApiResponse<Page<ResourceResponse>> response = ApiResponse.success(
                data, "Resources retrieved successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> getResourceById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        ResourceResponse data = resourceService.findById(id, user);
        ApiResponse<ResourceResponse> response = ApiResponse.success(
                data, "Resource retrieved successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ResourceResponse>> createResource(
            @Valid @RequestBody ResourceRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        ResourceResponse data = resourceService.create(request, user);
        ApiResponse<ResourceResponse> response = ApiResponse.success(
                data, "Resource created successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> updateResource(
            @PathVariable UUID id,
            @Valid @RequestBody ResourceRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        ResourceResponse data = resourceService.update(id, request, user);
        ApiResponse<ResourceResponse> response = ApiResponse.success(
                data, "Resource updated successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        resourceService.delete(id, user);
        ApiResponse<Void> response = ApiResponse.success(
                "Resource deleted successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<ResourceResponse>> archiveResource(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        ResourceResponse data = resourceService.archive(id, user);
        ApiResponse<ResourceResponse> response = ApiResponse.success(
                data, "Resource archived successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }
}
