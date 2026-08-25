package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.dto.AcademicDashboardResponse;
import com.abhiiterates.os.academic.service.AcademicDashboardService;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/academic/dashboard")
@RequiredArgsConstructor
public class AcademicDashboardController {

    private final AcademicDashboardService academicDashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<AcademicDashboardResponse>> getDashboard(
            @RequestParam(name = "timeZone", required = false) String timeZone,
            @AuthenticationPrincipal User user
    ) {
        AcademicDashboardResponse response = academicDashboardService.getDashboard(user, timeZone);
        return ResponseEntity.ok(ApiResponse.success(response, "Academic dashboard retrieved successfully"));
    }
}
