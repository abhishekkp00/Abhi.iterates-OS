package com.abhiiterates.os.marketplace.store;

import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourcePurchaseRepository extends JpaRepository<ResourcePurchase, UUID> {

    List<ResourcePurchase> findByUserOrderByCreatedAtDesc(User user);

    Optional<ResourcePurchase> findByUserAndStoreResource(User user, StoreResource storeResource);

    boolean existsByUserAndStoreResource(User user, StoreResource storeResource);

    @Query("SELECT p.storeResource.id FROM ResourcePurchase p WHERE p.user.id = :userId")
    List<UUID> findPurchasedResourceIdsByUserId(@Param("userId") UUID userId);
}
