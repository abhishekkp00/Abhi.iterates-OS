package com.abhiiterates.os.marketplace;

import com.abhiiterates.os.marketplace.dto.MarketplaceListingRequest;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingResponse;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.UUID;

public interface MarketplaceListingService {
    Page<MarketplaceListingResponse> findAllWithFilters(
            String search,
            Collection<ListingCategory> categories,
            Collection<ListingCondition> conditions,
            Collection<ListingStatus> statuses,
            Pageable pageable
    );

    Page<MarketplaceListingResponse> findBySeller(User seller, Pageable pageable);

    MarketplaceListingResponse findById(UUID id);

    MarketplaceListingResponse create(MarketplaceListingRequest request, User seller);

    MarketplaceListingResponse update(UUID id, MarketplaceListingRequest request, User seller);

    void delete(UUID id, User seller);

    MarketplaceListingResponse changeStatus(UUID id, ListingStatus status, User seller);
}
