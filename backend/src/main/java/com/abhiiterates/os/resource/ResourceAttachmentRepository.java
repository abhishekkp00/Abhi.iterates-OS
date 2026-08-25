package com.abhiiterates.os.resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceAttachmentRepository extends JpaRepository<ResourceAttachment, UUID> {

    Optional<ResourceAttachment> findByDownloadUrl(String downloadUrl);

    List<ResourceAttachment> findByResourceId(UUID resourceId);

    /**
     * Returns all attachments belonging to a specific user, filtered at the
     * database level. This replaces the previous findAll() + in-memory filter
     * pattern in AgentToolsService, which loaded all attachments for all users.
     *
     * @param userId the owner's user ID
     */
    @Query("SELECT a FROM ResourceAttachment a WHERE a.resource.user.id = :userId")
    List<ResourceAttachment> findByResourceUserId(@Param("userId") UUID userId);

    /**
     * Returns attachments belonging to a specific user whose file name or parent
     * resource title contains the given search term (case-insensitive).
     * Used by the AI searchKnowledgeBase tool to perform DB-level filtering.
     *
     * @param userId the owner's user ID
     * @param query  the search term (matched against fileName and resource.title)
     */
    @Query("""
            SELECT a FROM ResourceAttachment a
            WHERE a.resource.user.id = :userId
              AND (LOWER(a.fileName) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.resource.title) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    List<ResourceAttachment> findByResourceUserIdAndSearchQuery(
            @Param("userId") UUID userId,
            @Param("query") String query
    );
}
