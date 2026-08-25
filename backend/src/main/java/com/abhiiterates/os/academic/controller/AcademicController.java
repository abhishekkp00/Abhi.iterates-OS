package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.dto.SubjectRequest;
import com.abhiiterates.os.academic.dto.TopicRequest;
import com.abhiiterates.os.academic.service.AcademicService;
import com.abhiiterates.os.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/academic")
@RequiredArgsConstructor
public class AcademicController {

    private final AcademicService academicService;

    @PostMapping("/subjects")
    public ResponseEntity<SubjectRequest.Response> createSubject(
            @Valid @RequestBody SubjectRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicService.createSubject(request, user));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectRequest.Response>> getUserSubjects(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(academicService.getUserSubjects(user));
    }

    @GetMapping("/subjects/{id}")
    public ResponseEntity<SubjectRequest.Response> getSubjectById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(academicService.getSubjectById(id, user));
    }

    @PostMapping("/topics")
    public ResponseEntity<TopicRequest.Response> createTopic(
            @Valid @RequestBody TopicRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicService.createTopic(request, user));
    }

    @GetMapping("/subjects/{subjectId}/topics")
    public ResponseEntity<List<TopicRequest.Response>> getTopicsBySubject(
            @PathVariable UUID subjectId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(academicService.getTopicsBySubject(subjectId, user));
    }
}
