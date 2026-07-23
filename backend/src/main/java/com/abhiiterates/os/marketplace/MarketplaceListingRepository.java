package com.abhiiterates.os.marketplace;

import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.UUID;

public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, UUID> {

    @Query("SELECT m FROM MarketplaceListing m WHERE " +
           "(:search IS NULL OR :search = '' OR LOWER(m.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (COALESCE(:categories, null) IS NULL OR m.category IN :categories) " +
           "AND (COALESCE(:conditions, null) IS NULL OR m.condition IN :conditions) " +
           "AND (COALESCE(:statuses, null) IS NULL OR m.status IN :statuses)")
    Page<MarketplaceListing> findAllWithFilters(
            @Param("search") String search,
            @Param("categories") Collection<ListingCategory> categories,
            @Param("conditions") Collection<ListingCondition> conditions,
            @Param("statuses") Collection<ListingStatus> statuses,
            Pageable pageable
    );

    Page<MarketplaceListing> findBySeller(User seller, Pageable pageable);

    long countBySeller(User seller);

    long countBySellerAndStatus(User seller, ListingStatus status);

    java.util.List<MarketplaceListing> findAllBySeller(User seller);
}
