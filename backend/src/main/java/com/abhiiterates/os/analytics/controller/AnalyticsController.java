package com.abhiiterates.os.analytics.controller;

import com.abhiiterates.os.analytics.dto.DashboardAnalyticsDto;
import com.abhiiterates.os.analytics.service.AnalyticsService;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.user.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.abhiiterates.os.analytics.dto.ProductivityAnalyticsDto;

import com.abhiiterates.os.analytics.dto.AiAnalyticsDto;

import com.abhiiterates.os.analytics.dto.ResourceAnalyticsDto;

import com.abhiiterates.os.analytics.dto.MarketplaceAnalyticsDto;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardAnalyticsDto>> getDashboardAnalytics(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "7") int range,
            HttpServletRequest request
    ) {
        DashboardAnalyticsDto data = analyticsService.getDashboardAnalytics(user, range);
        ApiResponse<DashboardAnalyticsDto> response = ApiResponse.success(
                data,
                "Dashboard analytics retrieved successfully",
                request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/productivity")
    public ResponseEntity<ApiResponse<ProductivityAnalyticsDto>> getProductivityAnalytics(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "7") int range,
            HttpServletRequest request
    ) {
        ProductivityAnalyticsDto data = analyticsService.getProductivityAnalytics(user, range);
        ApiResponse<ProductivityAnalyticsDto> response = ApiResponse.success(
                data,
                "Productivity analytics retrieved successfully",
                request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ai")
    public ResponseEntity<ApiResponse<AiAnalyticsDto>> getAiAnalytics(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "7") int range,
            HttpServletRequest request
    ) {
        AiAnalyticsDto data = analyticsService.getAiAnalytics(user, range);
        ApiResponse<AiAnalyticsDto> response = ApiResponse.success(
                data,
                "AI analytics retrieved successfully",
                request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/resources")
    public ResponseEntity<ApiResponse<ResourceAnalyticsDto>> getResourceAnalytics(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "7") int range,
            HttpServletRequest request
    ) {
        ResourceAnalyticsDto data = analyticsService.getResourceAnalytics(user, range);
        ApiResponse<ResourceAnalyticsDto> response = ApiResponse.success(
                data,
                "Resource analytics retrieved successfully",
                request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/marketplace")
    public ResponseEntity<ApiResponse<MarketplaceAnalyticsDto>> getMarketplaceAnalytics(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "7") int range,
            HttpServletRequest request
    ) {
        MarketplaceAnalyticsDto data = analyticsService.getMarketplaceAnalytics(user, range);
        ApiResponse<MarketplaceAnalyticsDto> response = ApiResponse.success(
                data,
                "Marketplace analytics retrieved successfully",
                request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }
}
