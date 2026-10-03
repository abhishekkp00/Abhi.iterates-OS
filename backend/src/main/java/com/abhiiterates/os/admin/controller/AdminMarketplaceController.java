package com.abhiiterates.os.admin.controller;

import com.abhiiterates.os.admin.dto.AdminListingImageDto;
import com.abhiiterates.os.admin.dto.AdminMarketplaceListingDto;
import com.abhiiterates.os.admin.dto.AdminSellerDto;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/marketplace")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Marketplace Moderation", description = "Endpoints for moderating student listings")
@Slf4j
@SuppressWarnings("all")
public class AdminMarketplaceController {

    private final MarketplaceListingRepository listingRepository;
    private final com.abhiiterates.os.admin.AuditLogRepository auditLogRepository;

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Get all marketplace listings for moderation (unfiltered)")
    public ResponseEntity<ApiResponse<List<AdminMarketplaceListingDto>>> getAllListings(HttpServletRequest request) {
        log.info("Admin requested all listings for moderation queue.");
        List<MarketplaceListing> listings = listingRepository.findAll();
        List<AdminMarketplaceListingDto> dtos = listings.stream()
                .map(this::toAdminMarketplaceListingDto)
                .toList();
        return ResponseEntity.ok(
                ApiResponse.success(dtos, "All listings retrieved", request.getRequestURI())
        );
    }

    private AdminMarketplaceListingDto toAdminMarketplaceListingDto(MarketplaceListing listing) {
        User seller = listing.getSeller();
        AdminSellerDto sellerDto = null;
        if (seller != null) {
            String fullName = ((seller.getFirstName() != null ? seller.getFirstName() : "") + " " +
                               (seller.getLastName() != null ? seller.getLastName() : "")).trim();
            sellerDto = AdminSellerDto.builder()
                    .id(seller.getId())
                    .username(seller.getUsername())
                    .email(seller.getEmail())
                    .fullName(!fullName.isEmpty() ? fullName : seller.getUsername())
                    .build();
        }

        List<AdminListingImageDto> images = listing.getImages() != null
                ? listing.getImages().stream()
                        .map(img -> AdminListingImageDto.builder()
                                .id(img.getId())
                                .imageUrl(img.getImageUrl())
                                .isPrimary(img.isPrimary())
                                .build())
                        .toList()
                : List.of();

        return AdminMarketplaceListingDto.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .price(listing.getPrice())
                .negotiable(listing.isNegotiable())
                .category(listing.getCategory())
                .condition(listing.getCondition())
                .location(listing.getLocation())
                .status(listing.getStatus())
                .tags(listing.getTags())
                .seller(sellerDto)
                .images(images)
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
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
