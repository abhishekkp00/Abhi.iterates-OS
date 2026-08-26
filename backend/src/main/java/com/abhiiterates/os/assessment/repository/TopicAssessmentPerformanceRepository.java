package com.abhiiterates.os.assessment.repository;

import com.abhiiterates.os.assessment.domain.TopicAssessmentPerformance;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public interface TopicAssessmentPerformanceRepository extends JpaRepository<TopicAssessmentPerformance, UUID> {
    
    @Query("SELECT p FROM TopicAssessmentPerformance p WHERE p.user = :user AND p.topic.id = :topicId ORDER BY p.evaluatedAt DESC")
    Page<TopicAssessmentPerformance> findByUserAndTopicId(@Param("user") User user, @Param("topicId") UUID topicId, Pageable pageable);

    @Query("SELECT p FROM TopicAssessmentPerformance p WHERE p.user = :user AND p.topic.id = :topicId ORDER BY p.evaluatedAt DESC")
    List<TopicAssessmentPerformance> findByUserAndTopicIdOrderByEvaluatedAtDesc(@Param("user") User user, @Param("topicId") UUID topicId);

    List<TopicAssessmentPerformance> findByUser(User user);

    @Query("SELECT DISTINCT p.topic.id FROM TopicAssessmentPerformance p WHERE p.user = :user")
    List<UUID> findAssessedTopicIdsByUser(@Param("user") User user);

    /**
     * Bulk-load all performance records for a user and a set of topic IDs, ordered by evaluatedAt DESC.
     * Used by LearningStateServiceImpl to replace per-topic N+1 queries with a
     * single IN-clause query: O(1) SQL instead of O(N) SQL.
     *
     * <p><strong>Performance note:</strong> The ORDER BY evaluatedAt DESC ensures that,
     * after grouping by topicId in Java, each list is already sorted newest-first,
     * matching the expectation of LearningStateCalculator.</p>
     */
    @Query("SELECT p FROM TopicAssessmentPerformance p " +
           "WHERE p.user.id = :userId AND p.topic.id IN :topicIds " +
           "ORDER BY p.evaluatedAt DESC")
    List<TopicAssessmentPerformance> findAllByUserIdAndTopicIdIn(
            @Param("userId") UUID userId,
            @Param("topicIds") Collection<UUID> topicIds);

    /**
     * Convenience: returns a Map<topicId, List<TopicAssessmentPerformance>> (newest-first per topic).
     * Used directly by LearningStateServiceImpl.
     */
    default Map<UUID, List<TopicAssessmentPerformance>> findPerformanceMapByUserIdAndTopicIds(
            UUID userId, Collection<UUID> topicIds) {
        return findAllByUserIdAndTopicIdIn(userId, topicIds)
                .stream()
                .collect(Collectors.groupingBy(p -> p.getTopic().getId()));
    }
}
