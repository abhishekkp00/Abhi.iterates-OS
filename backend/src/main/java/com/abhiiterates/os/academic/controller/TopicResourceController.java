package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.service.AcademicService;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.resource.dto.ResourceResponse;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for discovering authorized academic resources associated with a topic.
 *
 * Endpoint: GET /api/v1/academic/topics/{topicId}/resources
 */
@RestController
@RequestMapping("/api/v1/academic/topics/{topicId}/resources")
@RequiredArgsConstructor
public class TopicResourceController {

    private final AcademicService academicService;
    private final ResourceRepository resourceRepository;

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getTopicResources(
            @PathVariable UUID topicId,
            @AuthenticationPrincipal User user
    ) {
        // IDOR: Validate user owns the topic
        Topic topic = academicService.validateTopicOwnership(topicId, user);

        // Fetch resources explicitly assigned to topic, or fallback to subject
        List<ResourceResponse> resources = resourceRepository
                .findByUserAndTopicOrSubject(user.getId(), topic.getId(), topic.getSubject().getId())
                .stream()
                .map(r -> ResourceResponse.builder()
                        .id(r.getId())
                        .title(r.getTitle())
                        .description(r.getDescription())
                        .category(r.getCategory())
                        .priority(r.getPriority())
                        .status(r.getStatus())
                        .starred(r.isStarred())
                        .deadline(r.getDeadline())
                        .tags(r.getTags())
                        .createdAt(r.getCreatedAt())
                        .updatedAt(r.getUpdatedAt())
                        .build())
                .toList();

        return ResponseEntity.ok(resources);
    }
}
