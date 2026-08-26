package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.domain.TopicProgress;
import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public interface TopicProgressRepository extends JpaRepository<TopicProgress, UUID> {

    Optional<TopicProgress> findByUserAndTopic(User user, Topic topic);

    @Query("SELECT p FROM TopicProgress p WHERE p.user.id = :userId AND p.topic.id = :topicId")
    Optional<TopicProgress> findByUserIdAndTopicId(@Param("userId") UUID userId, @Param("topicId") UUID topicId);

    /**
     * Bulk-load TopicProgress records for a user and a set of topic IDs.
     * Used by LearningStateServiceImpl to replace per-topic N+1 queries with a
     * single IN-clause query: O(1) SQL instead of O(N) SQL.
     */
    @Query("SELECT p FROM TopicProgress p WHERE p.user.id = :userId AND p.topic.id IN :topicIds")
    List<TopicProgress> findAllByUserIdAndTopicIdIn(
            @Param("userId") UUID userId,
            @Param("topicIds") Collection<UUID> topicIds);

    /**
     * Convenience: returns a Map<topicId, TopicProgress> for O(1) lookups.
     * Used directly by LearningStateServiceImpl.
     */
    default Map<UUID, TopicProgress> findProgressMapByUserIdAndTopicIds(UUID userId, Collection<UUID> topicIds) {
        return findAllByUserIdAndTopicIdIn(userId, topicIds)
                .stream()
                .collect(Collectors.toMap(p -> p.getTopic().getId(), p -> p));
    }
}
