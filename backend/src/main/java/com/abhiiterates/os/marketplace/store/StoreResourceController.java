package com.abhiiterates.os.marketplace.store;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.marketplace.store.dto.StoreResourceDto;
import com.abhiiterates.os.marketplace.store.dto.UpiPurchaseRequest;
import com.abhiiterates.os.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace/store")
@RequiredArgsConstructor
@Tag(name = "Student Notes & Resource Store", description = "Endpoints for students to browse and buy premium notes via UPI")
public class StoreResourceController {

    private final StoreService storeService;

    @GetMapping
    @Operation(summary = "Browse store resources with category and search filter")
    public ResponseEntity<ApiResponse<Page<StoreResourceDto>>> getStoreResources(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<StoreResourceDto> data = storeService.getStoreResourcesForStudent(search, category, user, pageable);
        return ResponseEntity.ok(ApiResponse.success(data, "Store items retrieved", servletRequest.getRequestURI()));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get list of available resource categories (e.g. Placement, General, etc.)")
    public ResponseEntity<ApiResponse<List<String>>> getCategories(HttpServletRequest servletRequest) {
        List<String> categories = storeService.getCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Categories retrieved", servletRequest.getRequestURI()));
    }

    @PostMapping("/{id}/purchase")
    @Operation(summary = "Purchase a premium resource using UPI Reference ID")
    public ResponseEntity<ApiResponse<StoreResourceDto>> purchaseResource(
            @PathVariable UUID id,
            @Valid @RequestBody UpiPurchaseRequest purchaseRequest,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        StoreResourceDto purchased = storeService.purchaseResourceWithUpi(id, purchaseRequest, user);
        return ResponseEntity.ok(ApiResponse.success(purchased, "Purchase successful! Notes unlocked.", servletRequest.getRequestURI()));
    }

    @GetMapping("/my-purchases")
    @Operation(summary = "Get all notes unlocked by the student")
    public ResponseEntity<ApiResponse<List<StoreResourceDto>>> getMyPurchases(
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        List<StoreResourceDto> purchases = storeService.getStudentPurchases(user);
        return ResponseEntity.ok(ApiResponse.success(purchases, "My purchases retrieved", servletRequest.getRequestURI()));
    }
}
