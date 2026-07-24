package com.abhiiterates.os.marketplace.store;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoreResourceRepository extends JpaRepository<StoreResource, UUID> {

    List<StoreResource> findByActiveTrueOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT s.category FROM StoreResource s WHERE s.active = true")
    List<String> findDistinctActiveCategories();

    @Query("SELECT s FROM StoreResource s WHERE s.active = true AND " +
           "(:category IS NULL OR :category = '' OR LOWER(s.category) = LOWER(:category)) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.tags) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<StoreResource> findActiveWithFilters(
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable
    );
}
