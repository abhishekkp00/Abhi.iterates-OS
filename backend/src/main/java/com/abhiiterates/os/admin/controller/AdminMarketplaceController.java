package com.abhiiterates.os.admin.controller;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.marketplace.*;
import com.abhiiterates.os.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/marketplace")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Marketplace Moderation", description = "Endpoints for moderating student listings")
@Slf4j
public class AdminMarketplaceController {

    private final MarketplaceListingRepository listingRepository;
    private final com.abhiiterates.os.admin.AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "Get all marketplace listings for moderation (unfiltered)")
    public ResponseEntity<ApiResponse<List<MarketplaceListing>>> getAllListings(HttpServletRequest request) {
        log.info("Admin requested all listings for moderation queue.");
        List<MarketplaceListing> listings = listingRepository.findAll();
        return ResponseEntity.ok(
                ApiResponse.success(listings, "All listings retrieved", request.getRequestURI())
        );
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Approve, Reject, or Archive a marketplace listing")
    public ResponseEntity<ApiResponse<Void>> updateListingStatus(
            @PathVariable UUID id,
            @RequestParam ListingStatus status,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest request
    ) {
        MarketplaceListing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        listing.setStatus(status);
        listingRepository.save(listing);
        log.info("Admin '{}' updated listing '{}' status to {}", adminUser.getEmail(), listing.getTitle(), status);

        auditLogRepository.save(com.abhiiterates.os.admin.AuditLog.builder()
                .adminEmail(adminUser.getEmail())
                .action("MODERATE_LISTING_" + status)
                .target(listing.getTitle())
                .details("Listing status set to: " + status + " | Price: $" + listing.getPrice())
                .ipAddress(request.getRemoteAddr())
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(null, "Listing status updated to " + status, request.getRequestURI())
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently purge a listing from the marketplace")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            @PathVariable UUID id,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest request
    ) {
        MarketplaceListing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        listingRepository.delete(listing);
        log.info("Admin '{}' permanently deleted marketplace listing '{}'", adminUser.getEmail(), listing.getTitle());

        auditLogRepository.save(com.abhiiterates.os.admin.AuditLog.builder()
                .adminEmail(adminUser.getEmail())
                .action("PURGE_LISTING")
                .target(listing.getTitle())
                .details("Permanently deleted listing from catalog")
                .ipAddress(request.getRemoteAddr())
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(null, "Listing purged successfully", request.getRequestURI())
        );
    }
}
