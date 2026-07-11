package com.abhiiterates.os.resource;

import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    @Query("SELECT r FROM Resource r WHERE r.user = :user " +
           "AND (:search IS NULL OR :search = '' OR LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (COALESCE(:categories, null) IS NULL OR r.category IN :categories) " +
           "AND (COALESCE(:priorities, null) IS NULL OR r.priority IN :priorities) " +
           "AND (COALESCE(:statuses, null) IS NULL OR r.status IN :statuses)")
    Page<Resource> findAllWithFilters(
            @Param("user") User user,
            @Param("search") String search,
            @Param("categories") Collection<ResourceCategory> categories,
            @Param("priorities") Collection<ResourcePriority> priorities,
            @Param("statuses") Collection<ResourceStatus> statuses,
            Pageable pageable
    );
}
