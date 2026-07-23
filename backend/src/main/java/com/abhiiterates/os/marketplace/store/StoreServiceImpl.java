package com.abhiiterates.os.marketplace.store;

import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.marketplace.store.dto.StoreResourceDto;
import com.abhiiterates.os.marketplace.store.dto.StoreResourceRequest;
import com.abhiiterates.os.marketplace.store.dto.UpiPurchaseRequest;
import com.abhiiterates.os.notification.domain.NotificationType;
import com.abhiiterates.os.notification.service.NotificationService;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoreServiceImpl implements StoreService {

    private final StoreResourceRepository storeResourceRepository;
    private final ResourcePurchaseRepository purchaseRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public StoreResourceDto createStoreResource(StoreResourceRequest request, User admin) {
        StoreResource resource = StoreResource.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory().trim())
                .priceInRupees(request.getPriceInRupees())
                .expiryDate(request.getExpiryDate())
                .fileUrl(request.getFileUrl())
                .fileName(request.getFileName() != null ? request.getFileName() : request.getTitle())
                .fileSize(request.getFileSize() != null ? request.getFileSize() : 1024L * 1024L)
                .previewUrl(request.getPreviewUrl())
                .tags(request.getTags())
                .uploadedByUser(admin)
                .active(true)
                .build();

        StoreResource saved = storeResourceRepository.save(resource);
        log.info("Admin {} created store resource: {}", admin.getEmail(), saved.getTitle());
        return mapToDto(saved, null);
    }

    @Override
    @Transactional
    public StoreResourceDto updateStoreResource(UUID id, StoreResourceRequest request, User admin) {
        StoreResource resource = storeResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store resource not found: " + id));

        resource.setTitle(request.getTitle());
        resource.setDescription(request.getDescription());
        resource.setCategory(request.getCategory().trim());
        resource.setPriceInRupees(request.getPriceInRupees());
        resource.setExpiryDate(request.getExpiryDate());
        resource.setFileUrl(request.getFileUrl());
        if (request.getFileName() != null) resource.setFileName(request.getFileName());
        if (request.getPreviewUrl() != null) resource.setPreviewUrl(request.getPreviewUrl());
        resource.setTags(request.getTags());

        StoreResource saved = storeResourceRepository.save(resource);
        return mapToDto(saved, null);
    }

    @Override
    @Transactional
    public void deleteStoreResource(UUID id, User admin) {
        StoreResource resource = storeResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store resource not found: " + id));
        resource.setActive(false);
        storeResourceRepository.save(resource);
        log.info("Admin {} deactivated store resource: {}", admin.getEmail(), id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoreResourceDto> getAllStoreResourcesForAdmin() {
        return storeResourceRepository.findAll().stream()
                .map(res -> mapToDto(res, null))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoreResourceDto> getStoreResourcesForStudent(String search, String category, User currentUser, Pageable pageable) {
        String cat = (category != null && !category.trim().isEmpty() && !"ALL".equalsIgnoreCase(category))
                ? category.trim()
                : "";
        String q = (search != null && !search.trim().isEmpty()) ? search.trim() : "";

        Page<StoreResource> page = storeResourceRepository.findActiveWithFilters(q, cat, pageable);
        return page.map(res -> mapToDto(res, currentUser));
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCategories() {
        List<String> categories = storeResourceRepository.findDistinctActiveCategories();
        if (!categories.contains("Placement")) categories.add(0, "Placement");
        if (!categories.contains("General")) categories.add("General");
        return categories.stream().distinct().toList();
    }

    @Override
    @Transactional
    public StoreResourceDto purchaseResourceWithUpi(UUID resourceId, UpiPurchaseRequest purchaseRequest, User currentUser) {
        StoreResource resource = storeResourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Store resource not found: " + resourceId));

        if (!resource.isActive()) {
            throw new IllegalStateException("Resource is currently inactive");
        }

        // Check if already purchased
        Optional<ResourcePurchase> existing = purchaseRepository.findByUserAndStoreResource(currentUser, resource);
        ResourcePurchase purchase;
        if (existing.isPresent()) {
            purchase = existing.get();
            purchase.setPaymentRefId(purchaseRequest.getPaymentRefId());
        } else {
            purchase = ResourcePurchase.builder()
                    .user(currentUser)
                    .storeResource(resource)
                    .amountPaid(resource.getPriceInRupees())
                    .paymentRefId(purchaseRequest.getPaymentRefId())
                    .paymentMethod("UPI")
                    .expiresAt(resource.getExpiryDate())
                    .build();
        }

        ResourcePurchase savedPurchase = purchaseRepository.save(purchase);
        log.info("Student {} purchased resource '{}' via UPI ref {}", currentUser.getEmail(), resource.getTitle(), purchaseRequest.getPaymentRefId());

        try {
            notificationService.createNotification(
                    currentUser,
                    NotificationType.MARKETPLACE_SOLD,
                    "Successfully unlocked notes: \"" + resource.getTitle() + "\"",
                    "/marketplace",
                    resource.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send purchase notification: {}", e.getMessage());
        }

        return mapToDto(resource, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoreResourceDto> getStudentPurchases(User currentUser) {
        List<ResourcePurchase> purchases = purchaseRepository.findByUserOrderByCreatedAtDesc(currentUser);
        return purchases.stream()
                .map(p -> {
                    StoreResourceDto dto = mapToDto(p.getStoreResource(), currentUser);
                    dto.setPurchased(true);
                    dto.setPaymentRefId(p.getPaymentRefId());
                    dto.setPurchaseExpiresAt(p.getExpiresAt());
                    if (p.getExpiresAt() != null && Instant.now().isAfter(p.getExpiresAt())) {
                        dto.setExpired(true);
                    }
                    return dto;
                })
                .toList();
    }

    private StoreResourceDto mapToDto(StoreResource resource, User currentUser) {
        boolean isPurchased = false;
        boolean isExpired = false;
        Instant purchaseExpiresAt = resource.getExpiryDate();
        String paymentRef = null;

        if (currentUser != null) {
            Optional<ResourcePurchase> purchase = purchaseRepository.findByUserAndStoreResource(currentUser, resource);
            if (purchase.isPresent()) {
                isPurchased = true;
                paymentRef = purchase.get().getPaymentRefId();
                purchaseExpiresAt = purchase.get().getExpiresAt();
                if (purchaseExpiresAt != null && Instant.now().isAfter(purchaseExpiresAt)) {
                    isExpired = true;
                }
            }
        }

        return StoreResourceDto.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .category(resource.getCategory())
                .priceInRupees(resource.getPriceInRupees())
                .expiryDate(resource.getExpiryDate())
                .fileUrl(resource.getFileUrl())
                .fileName(resource.getFileName())
                .fileSize(resource.getFileSize())
                .previewUrl(resource.getPreviewUrl())
                .active(resource.isActive())
                .tags(resource.getTags())
                .createdAt(resource.getCreatedAt())
                .isPurchased(isPurchased)
                .isExpired(isExpired)
                .purchaseExpiresAt(purchaseExpiresAt)
                .paymentRefId(paymentRef)
                .build();
    }
}
