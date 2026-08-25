package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.dto.TopicPrerequisiteResponse;
import com.abhiiterates.os.academic.service.TopicPrerequisiteService;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing topic prerequisites.
 * Prerequisite edges form a DAG used by the Study Planner for topological ordering.
 *
 * Base path: /api/v1/academic/topics/{topicId}/prerequisites
 */
@RestController
@RequestMapping("/api/v1/academic/topics/{topicId}/prerequisites")
@RequiredArgsConstructor
public class TopicPrerequisiteController {

    private final TopicPrerequisiteService prerequisiteService;

    /**
     * Add a prerequisite: prerequisiteTopicId must be studied before {topicId}.
     * Body: { "prerequisiteTopicId": "uuid" }
     */
    @PostMapping
    public ResponseEntity<TopicPrerequisiteResponse> addPrerequisite(
        @PathVariable UUID topicId,
        @RequestBody PrerequisiteRequest request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(prerequisiteService.addPrerequisite(topicId, request.prerequisiteTopicId(), user));
    }

    @GetMapping
    public ResponseEntity<List<TopicPrerequisiteResponse>> getPrerequisites(
        @PathVariable UUID topicId,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(prerequisiteService.getPrerequisites(topicId, user));
    }

    @DeleteMapping("/{prerequisiteTopicId}")
    public ResponseEntity<Void> removePrerequisite(
        @PathVariable UUID topicId,
        @PathVariable UUID prerequisiteTopicId,
        @AuthenticationPrincipal User user
    ) {
        prerequisiteService.removePrerequisite(topicId, prerequisiteTopicId, user);
        return ResponseEntity.noContent().build();
    }

    /** Inline DTO for the POST body. */
    public record PrerequisiteRequest(UUID prerequisiteTopicId) {}
}
