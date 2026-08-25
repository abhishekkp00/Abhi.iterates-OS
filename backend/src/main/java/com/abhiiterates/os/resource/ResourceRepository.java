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
           "AND (:categories IS NULL OR r.category IN :categories) " +
           "AND (:priorities IS NULL OR r.priority IN :priorities) " +
           "AND (:statuses IS NULL OR r.status IN :statuses)")
    Page<Resource> findAllWithFilters(
            @Param("user") User user,
            @Param("search") String search,
            @Param("categories") Collection<ResourceCategory> categories,
            @Param("priorities") Collection<ResourcePriority> priorities,
            @Param("statuses") Collection<ResourceStatus> statuses,
            Pageable pageable
    );

    java.util.List<Resource> findByUser(User user);

    @Query("SELECT r FROM Resource r WHERE r.user.id = :userId " +
           "AND (r.topic.id = :topicId OR (r.topic IS NULL AND r.subject.id = :subjectId)) " +
           "ORDER BY r.createdAt DESC")
    java.util.List<Resource> findByUserAndTopicOrSubject(
            @Param("userId") UUID userId,
            @Param("topicId") UUID topicId,
            @Param("subjectId") UUID subjectId
    );
}
