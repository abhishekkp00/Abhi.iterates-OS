package com.abhishek.Abhiiterates.repository;

import com.abhishek.Abhiiterates.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    boolean existsByUserIdAndResourceId(Long userId, Long resourceId);
    List<Purchase> findByUserId(Long userId);
    Optional<Purchase> findByUserIdAndResourceId(Long userId, Long resourceId);
}
