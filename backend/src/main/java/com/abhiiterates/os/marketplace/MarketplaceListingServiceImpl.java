package com.abhiiterates.os.marketplace;

import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.marketplace.dto.ListingImageResponse;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingRequest;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingResponse;
import com.abhiiterates.os.marketplace.dto.SellerResponse;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MarketplaceListingServiceImpl implements MarketplaceListingService {

    private final MarketplaceListingRepository listingRepository;
    private final com.abhiiterates.os.notification.service.NotificationService notificationService;

    @Override
    public Page<MarketplaceListingResponse> findAllWithFilters(
            String search,
            Collection<ListingCategory> categories,
            Collection<ListingCondition> conditions,
            Collection<ListingStatus> statuses,
            Pageable pageable
    ) {
        Collection<ListingCategory> cats = (categories == null || categories.isEmpty()) ? null : categories;
        Collection<ListingCondition> conds = (conditions == null || conditions.isEmpty()) ? null : conditions;
        Collection<ListingStatus> stats = (statuses == null || statuses.isEmpty()) ? null : statuses;

        return listingRepository.findAllWithFilters(search, cats, conds, stats, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public Page<MarketplaceListingResponse> findBySeller(User seller, Pageable pageable) {
        return listingRepository.findBySeller(seller, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public MarketplaceListingResponse findById(UUID id) {
        MarketplaceListing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID: " + id));
        return mapToResponse(listing);
    }

    @Override
    @Transactional
    public MarketplaceListingResponse create(MarketplaceListingRequest request, User seller) {
        MarketplaceListing listing = MarketplaceListing.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .negotiable(request.isNegotiable())
                .category(request.getCategory())
                .condition(request.getCondition())
                .location(request.getLocation())
                .status(request.getStatus() != null ? request.getStatus() : ListingStatus.ACTIVE)
                .tags(request.getTags())
                .seller(seller)
                .images(new ArrayList<>())
                .build();

        if (request.getImageUrls() != null) {
            boolean isFirst = true;
            for (String url : request.getImageUrls()) {
                listing.getImages().add(ListingImage.builder()
                        .imageUrl(url)
                        .isPrimary(isFirst)
                        .listing(listing)
                        .build());
                isFirst = false;
            }
        }

        MarketplaceListing saved = listingRepository.save(listing);
        
        try {
            notificationService.createNotification(
                    seller,
                    com.abhiiterates.os.notification.domain.NotificationType.MARKETPLACE_LISTING,
                    "New item listed on Marketplace: \"" + saved.getTitle() + "\"",
                    "/marketplace/" + saved.getId(),
                    saved.getId()
            );
        } catch (Exception ex) {
            // Resilient
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public MarketplaceListingResponse update(UUID id, MarketplaceListingRequest request, User seller) {
        MarketplaceListing listing = getListingAndValidateOwner(id, seller);

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setNegotiable(request.isNegotiable());
        listing.setCategory(request.getCategory());
        listing.setCondition(request.getCondition());
        listing.setLocation(request.getLocation());
        listing.setStatus(request.getStatus());
        listing.setTags(request.getTags());

        // Update images list
        listing.getImages().clear();
        if (request.getImageUrls() != null) {
            boolean isFirst = true;
            for (String url : request.getImageUrls()) {
                listing.getImages().add(ListingImage.builder()
                        .imageUrl(url)
                        .isPrimary(isFirst)
                        .listing(listing)
                        .build());
                isFirst = false;
            }
        }

        MarketplaceListing updated = listingRepository.save(listing);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void delete(UUID id, User seller) {
        MarketplaceListing listing = getListingAndValidateOwner(id, seller);
        listingRepository.delete(listing);
    }

    @Override
    @Transactional
    public MarketplaceListingResponse changeStatus(UUID id, ListingStatus status, User seller) {
        MarketplaceListing listing = getListingAndValidateOwner(id, seller);
        listing.setStatus(status);
        MarketplaceListing updated = listingRepository.save(listing);
        return mapToResponse(updated);
    }

    private MarketplaceListing getListingAndValidateOwner(UUID id, User seller) {
        MarketplaceListing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID: " + id));

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new ResourceNotFoundException("Listing not found with ID: " + id);
        }
        return listing;
    }

    private MarketplaceListingResponse mapToResponse(MarketplaceListing listing) {
        String firstName = listing.getSeller().getFirstName() != null ? listing.getSeller().getFirstName() : "";
        String lastName = listing.getSeller().getLastName() != null ? listing.getSeller().getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        if (fullName.isEmpty()) {
            fullName = listing.getSeller().getUsername();
        }

        SellerResponse sellerResp = SellerResponse.builder()
                .id(listing.getSeller().getId())
                .fullName(fullName)
                .email(listing.getSeller().getEmail())
                .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop")
                .build();

        List<ListingImageResponse> imagesResp = listing.getImages().stream()
                .map(img -> ListingImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .isPrimary(img.isPrimary())
                        .build())
                .collect(Collectors.toList());

        return MarketplaceListingResponse.builder()
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
                .seller(sellerResp)
                .images(imagesResp)
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
