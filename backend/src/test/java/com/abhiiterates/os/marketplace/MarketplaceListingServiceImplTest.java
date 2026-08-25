package com.abhiiterates.os.marketplace;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingRequest;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingResponse;
import com.abhiiterates.os.notification.service.NotificationService;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarketplaceListingServiceImplTest {

    @Mock
    private MarketplaceListingRepository listingRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private MarketplaceListingServiceImpl listingService;

    private User sellerA;
    private User sellerB;
    private MarketplaceListing listingA;
    private MarketplaceListingRequest listingRequest;

    @BeforeEach
    void setUp() {
        sellerA = UserTestFactory.createRegularUser("sellerA");
        sellerB = UserTestFactory.createRegularUser("sellerB");

        listingA = MarketplaceListing.builder()
                .id(UUID.randomUUID())
                .title("TI-84 Plus Calculator")
                .description("Lightly used graphing calculator")
                .price(new BigDecimal("75.00"))
                .negotiable(true)
                .category(ListingCategory.ELECTRONICS)
                .condition(ListingCondition.LIKE_NEW)
                .location("Campus Library")
                .status(ListingStatus.ACTIVE)
                .seller(sellerA)
                .images(new ArrayList<>())
                .build();

        listingRequest = MarketplaceListingRequest.builder()
                .title("TI-84 Plus Calculator")
                .description("Lightly used graphing calculator")
                .price(new BigDecimal("75.00"))
                .negotiable(true)
                .category(ListingCategory.ELECTRONICS)
                .condition(ListingCondition.LIKE_NEW)
                .location("Campus Library")
                .status(ListingStatus.ACTIVE)
                .build();
    }

    @Test
    void create_withValidRequest_savesAndReturnsListingResponse() {
        when(listingRepository.save(any(MarketplaceListing.class))).thenReturn(listingA);

        MarketplaceListingResponse response = listingService.create(listingRequest, sellerA);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("TI-84 Plus Calculator");
        assertThat(response.getSeller().getId()).isEqualTo(sellerA.getId());
        verify(listingRepository).save(any(MarketplaceListing.class));
    }

    @Test
    void update_ownedBySeller_updatesListing() {
        when(listingRepository.findById(listingA.getId())).thenReturn(Optional.of(listingA));
        when(listingRepository.save(any(MarketplaceListing.class))).thenReturn(listingA);

        MarketplaceListingResponse updated = listingService.update(listingA.getId(), listingRequest, sellerA);

        assertThat(updated).isNotNull();
        verify(listingRepository).save(listingA);
    }

    @Test
    void update_ownedByAnotherSeller_throwsResourceNotFoundException() {
        when(listingRepository.findById(listingA.getId())).thenReturn(Optional.of(listingA));

        assertThatThrownBy(() -> listingService.update(listingA.getId(), listingRequest, sellerB))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(listingRepository, never()).save(any());
    }

    @Test
    void delete_ownedByAnotherSeller_throwsResourceNotFoundException() {
        when(listingRepository.findById(listingA.getId())).thenReturn(Optional.of(listingA));

        assertThatThrownBy(() -> listingService.delete(listingA.getId(), sellerB))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(listingRepository, never()).delete(any());
    }
}
