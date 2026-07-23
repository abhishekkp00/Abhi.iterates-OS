package com.abhiiterates.os.marketplace.store;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.marketplace.store.dto.StoreResourceDto;
import com.abhiiterates.os.marketplace.store.dto.StoreResourceRequest;
import com.abhiiterates.os.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/store-resources")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Store & Notes Management", description = "Endpoints for Admin to upload and manage premium notes and prices in INR")
public class AdminStoreResourceController {

    private final StoreService storeService;

    @GetMapping
    @Operation(summary = "Get all store resources uploaded by Admin")
    public ResponseEntity<ApiResponse<List<StoreResourceDto>>> getAllStoreResources(HttpServletRequest servletRequest) {
        List<StoreResourceDto> resources = storeService.getAllStoreResourcesForAdmin();
        return ResponseEntity.ok(ApiResponse.success(resources, "All store resources retrieved", servletRequest.getRequestURI()));
    }

    @PostMapping
    @Operation(summary = "Upload a new premium note/resource with INR price & category")
    public ResponseEntity<ApiResponse<StoreResourceDto>> createStoreResource(
            @Valid @RequestBody StoreResourceRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest
    ) {
        StoreResourceDto created = storeService.createStoreResource(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Resource uploaded to store successfully", servletRequest.getRequestURI()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update store resource details, price, or expiry date")
    public ResponseEntity<ApiResponse<StoreResourceDto>> updateStoreResource(
            @PathVariable UUID id,
            @Valid @RequestBody StoreResourceRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest
    ) {
        StoreResourceDto updated = storeService.updateStoreResource(id, request, admin);
        return ResponseEntity.ok(ApiResponse.success(updated, "Store resource updated successfully", servletRequest.getRequestURI()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate/delete store resource")
    public ResponseEntity<ApiResponse<Void>> deleteStoreResource(
            @PathVariable UUID id,
            @AuthenticationPrincipal User admin,
            HttpServletRequest servletRequest
    ) {
        storeService.deleteStoreResource(id, admin);
        return ResponseEntity.ok(ApiResponse.success(null, "Store resource deactivated successfully", servletRequest.getRequestURI()));
    }
}
