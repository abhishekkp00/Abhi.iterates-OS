package com.abhiiterates.os.marketplace;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingRequest;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingResponse;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@org.springframework.transaction.annotation.Transactional
class MarketplaceIntegrationTest {

    @Autowired
    private MarketplaceListingService listingService;

    @Autowired
    private UserRepository userRepository;

    private User seller1;
    private User seller2;

    @BeforeEach
    void setUp() {
        seller1 = UserTestFactory.createRegularUser("mktSeller1");
        seller1 = userRepository.save(seller1);

        seller2 = UserTestFactory.createRegularUser("mktSeller2");
        seller2 = userRepository.save(seller2);
    }

    @Test
    void completeMarketplaceLifecycle_createSearchUpdateDelete_andVerifyIDORProtection() {
        // 1. Create Listing by Seller 1
        MarketplaceListingRequest createReq = MarketplaceListingRequest.builder()
                .title("Organic Chemistry 9th Ed")
                .description("Good condition textbook with study guide")
                .price(new BigDecimal("50.00"))
                .negotiable(true)
                .category(ListingCategory.BOOKS)
                .condition(ListingCondition.GOOD)
                .location("North Quad Library")
                .status(ListingStatus.ACTIVE)
                .tags("chemistry, science, textbook")
                .imageUrls(List.of("https://example.com/img1.jpg"))
                .build();

        MarketplaceListingResponse created = listingService.create(createReq, seller1);
        assertThat(created).isNotNull();
        assertThat(created.getId()).isNotNull();
        assertThat(created.getSeller().getId()).isEqualTo(seller1.getId());

        // 2. Search & Filter Listings
        Page<MarketplaceListingResponse> searchResults = listingService.findAllWithFilters(
                "Organic", List.of(ListingCategory.BOOKS), null, List.of(ListingStatus.ACTIVE), PageRequest.of(0, 10)
        );
        assertThat(searchResults.getContent()).hasSize(1);
        assertThat(searchResults.getContent().get(0).getTitle()).isEqualTo("Organic Chemistry 9th Ed");

        // 3. IDOR Security Check: Seller 2 MUST NOT be able to modify or delete Seller 1's listing
        MarketplaceListingRequest unauthorizedUpdateReq = MarketplaceListingRequest.builder()
                .title("Hacked Title")
                .description("Hacked Description")
                .price(new BigDecimal("1.00"))
                .category(ListingCategory.BOOKS)
                .condition(ListingCondition.POOR)
                .status(ListingStatus.ACTIVE)
                .build();

        assertThatThrownBy(() -> listingService.update(created.getId(), unauthorizedUpdateReq, seller2))
                .isInstanceOf(ResourceNotFoundException.class);

        assertThatThrownBy(() -> listingService.delete(created.getId(), seller2))
                .isInstanceOf(ResourceNotFoundException.class);

        assertThatThrownBy(() -> listingService.changeStatus(created.getId(), ListingStatus.SOLD, seller2))
                .isInstanceOf(ResourceNotFoundException.class);

        // 4. Update Listing by Authorized Seller 1
        MarketplaceListingRequest validUpdateReq = MarketplaceListingRequest.builder()
                .title("Organic Chemistry 9th Ed + Solution Manual")
                .description("Includes full solutions manual and flashcards")
                .price(new BigDecimal("60.00"))
                .negotiable(false)
                .category(ListingCategory.BOOKS)
                .condition(ListingCondition.LIKE_NEW)
                .location("Science Center")
                .status(ListingStatus.ACTIVE)
                .tags("chemistry, solutions, textbook")
                .imageUrls(List.of("https://example.com/img2.jpg"))
                .build();

        MarketplaceListingResponse updated = listingService.update(created.getId(), validUpdateReq, seller1);
        assertThat(updated.getTitle()).isEqualTo("Organic Chemistry 9th Ed + Solution Manual");
        assertThat(updated.getPrice()).isEqualTo(new BigDecimal("60.00"));

        // 5. Change Status by Seller 1
        MarketplaceListingResponse statusChanged = listingService.changeStatus(created.getId(), ListingStatus.SOLD, seller1);
        assertThat(statusChanged.getStatus()).isEqualTo(ListingStatus.SOLD);

        // 6. Delete Listing by Seller 1
        listingService.delete(created.getId(), seller1);

        assertThatThrownBy(() -> listingService.findById(created.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
