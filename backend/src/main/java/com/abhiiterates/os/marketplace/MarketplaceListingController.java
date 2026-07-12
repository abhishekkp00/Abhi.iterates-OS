package com.abhiiterates.os.marketplace;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingRequest;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingResponse;
import com.abhiiterates.os.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace")
@RequiredArgsConstructor
public class MarketplaceListingController {

    private final MarketplaceListingService listingService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MarketplaceListingResponse>>> getAllListings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<ListingCategory> categories,
            @RequestParam(required = false) List<ListingCondition> conditions,
            @RequestParam(required = false) List<ListingStatus> statuses,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            HttpServletRequest servletRequest
    ) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction sortDirection = (sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1]))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

        Page<MarketplaceListingResponse> data = listingService.findAllWithFilters(
                search, categories, conditions, statuses, pageable
        );

        ApiResponse<Page<MarketplaceListingResponse>> response = ApiResponse.success(
                data, "Listings retrieved successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-listings")
    public ResponseEntity<ApiResponse<Page<MarketplaceListingResponse>>> getMyListings(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            HttpServletRequest servletRequest
    ) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction sortDirection = (sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1]))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

        Page<MarketplaceListingResponse> data = listingService.findBySeller(user, pageable);

        ApiResponse<Page<MarketplaceListingResponse>> response = ApiResponse.success(
                data, "My listings retrieved successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MarketplaceListingResponse>> getListingById(
            @PathVariable UUID id,
            HttpServletRequest servletRequest
    ) {
        MarketplaceListingResponse data = listingService.findById(id);
        ApiResponse<MarketplaceListingResponse> response = ApiResponse.success(
                data, "Listing retrieved successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MarketplaceListingResponse>> createListing(
            @Valid @RequestBody MarketplaceListingRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        MarketplaceListingResponse data = listingService.create(request, user);
        ApiResponse<MarketplaceListingResponse> response = ApiResponse.success(
                data, "Listing created successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MarketplaceListingResponse>> updateListing(
            @PathVariable UUID id,
            @Valid @RequestBody MarketplaceListingRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        MarketplaceListingResponse data = listingService.update(id, request, user);
        ApiResponse<MarketplaceListingResponse> response = ApiResponse.success(
                data, "Listing updated successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        listingService.delete(id, user);
        ApiResponse<Void> response = ApiResponse.success(
                "Listing deleted successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MarketplaceListingResponse>> changeListingStatus(
            @PathVariable UUID id,
            @RequestParam ListingStatus status,
            @AuthenticationPrincipal User user,
            HttpServletRequest servletRequest
    ) {
        MarketplaceListingResponse data = listingService.changeStatus(id, status, user);
        ApiResponse<MarketplaceListingResponse> response = ApiResponse.success(
                data, "Listing status updated successfully", servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }
}
