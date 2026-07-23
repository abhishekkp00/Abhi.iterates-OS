package com.abhiiterates.os.marketplace.store;

import com.abhiiterates.os.marketplace.store.dto.StoreResourceDto;
import com.abhiiterates.os.marketplace.store.dto.StoreResourceRequest;
import com.abhiiterates.os.marketplace.store.dto.UpiPurchaseRequest;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface StoreService {

    // Admin operations
    StoreResourceDto createStoreResource(StoreResourceRequest request, User admin);
    StoreResourceDto updateStoreResource(UUID id, StoreResourceRequest request, User admin);
    void deleteStoreResource(UUID id, User admin);
    List<StoreResourceDto> getAllStoreResourcesForAdmin();

    // Student operations
    Page<StoreResourceDto> getStoreResourcesForStudent(String search, String category, User currentUser, Pageable pageable);
    List<String> getCategories();
    StoreResourceDto purchaseResourceWithUpi(UUID resourceId, UpiPurchaseRequest purchaseRequest, User currentUser);
    List<StoreResourceDto> getStudentPurchases(User currentUser);
}
