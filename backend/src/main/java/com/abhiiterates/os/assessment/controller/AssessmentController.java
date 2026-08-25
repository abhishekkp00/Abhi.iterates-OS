package com.abhiiterates.os.assessment.controller;

import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.service.AssessmentService;
import com.abhiiterates.os.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping
    public ResponseEntity<CreateAssessmentRequest.Response> createAssessment(
            @Valid @RequestBody CreateAssessmentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assessmentService.createAssessment(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CreateAssessmentRequest.Response> updateAssessment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAssessmentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(assessmentService.updateAssessment(id, request, user));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<CreateAssessmentRequest.Response> publishAssessment(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(assessmentService.publishAssessment(id, user));
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<CreateQuestionRequest.OwnerResponse> addQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody CreateQuestionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assessmentService.addQuestion(id, request, user));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<CreateQuestionRequest.StudentResponse>> getStudentQuestions(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(assessmentService.getStudentQuestions(id, user));
    }

    @GetMapping("/{id}/owner-questions")
    public ResponseEntity<List<CreateQuestionRequest.OwnerResponse>> getOwnerQuestions(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(assessmentService.getOwnerQuestions(id, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CreateAssessmentRequest.Response> getAssessmentById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(assessmentService.getAssessmentById(id, user));
    }

    @GetMapping
    public ResponseEntity<Page<CreateAssessmentRequest.Response>> getUserAssessments(
            @RequestParam(required = false) Boolean publishedOnly,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal User user) {
        if (Boolean.TRUE.equals(publishedOnly)) {
            return ResponseEntity.ok(assessmentService.getPublishedAssessments(user, pageable));
        }
        return ResponseEntity.ok(assessmentService.getUserAssessments(user, pageable));
    }
}
