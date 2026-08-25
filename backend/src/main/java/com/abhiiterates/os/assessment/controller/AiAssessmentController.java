package com.abhiiterates.os.assessment.controller;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.assessment.dto.CreateAssessmentRequest;
import com.abhiiterates.os.assessment.dto.GenerateAdaptiveAssessmentRequest;
import com.abhiiterates.os.assessment.service.AiAssessmentGeneratorService;
import com.abhiiterates.os.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/assessments")
@RequiredArgsConstructor
public class AiAssessmentController {

    private final AiAssessmentGeneratorService generatorService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<CreateAssessmentRequest.Response>> generateAssessment(
            @Valid @RequestBody GenerateAdaptiveAssessmentRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        CreateAssessmentRequest.Response data = generatorService.generateAdaptiveAssessment(request, user);
        ApiResponse<CreateAssessmentRequest.Response> response = ApiResponse.success(
                data,
                "Adaptive assessment generated and published successfully.",
                servletRequest.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
