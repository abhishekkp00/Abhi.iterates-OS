package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.dto.ExamRequest;
import com.abhiiterates.os.academic.service.ExamService;
import com.abhiiterates.os.common.ApiResponse;
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
@RequestMapping("/api/v1/academic/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExamRequest.Response>> createExam(
            @Valid @RequestBody ExamRequest request,
            @AuthenticationPrincipal User user
    ) {
        ExamRequest.Response created = examService.createExam(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Exam created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExamRequest.Response>>> getUserExams(
            @AuthenticationPrincipal User user
    ) {
        List<ExamRequest.Response> exams = examService.getUserExams(user);
        return ResponseEntity.ok(ApiResponse.success(exams, "Exams retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamRequest.Response>> getExamById(
            @PathVariable("id") UUID examId,
            @AuthenticationPrincipal User user
    ) {
        ExamRequest.Response exam = examService.getExamById(examId, user);
        return ResponseEntity.ok(ApiResponse.success(exam, "Exam retrieved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamRequest.Response>> updateExam(
            @PathVariable("id") UUID examId,
            @Valid @RequestBody ExamRequest request,
            @AuthenticationPrincipal User user
    ) {
        ExamRequest.Response updated = examService.updateExam(examId, request, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Exam updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(
            @PathVariable("id") UUID examId,
            @AuthenticationPrincipal User user
    ) {
        examService.deleteExam(examId, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Exam deleted successfully"));
    }
}
