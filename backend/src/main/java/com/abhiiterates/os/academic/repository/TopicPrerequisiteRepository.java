package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.domain.TopicPrerequisite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TopicPrerequisiteRepository extends JpaRepository<TopicPrerequisite, UUID> {

    /**
     * All prerequisite edges for a given topic (topics that must be studied first).
     */
    List<TopicPrerequisite> findByTopic(Topic topic);

    /**
     * All topics that depend on the given prerequisite topic
     * (topics that list it as a prerequisite).
     */
    List<TopicPrerequisite> findByPrerequisiteTopic(Topic topic);

    /**
     * Check if a specific prerequisite edge already exists.
     */
    Optional<TopicPrerequisite> findByTopicAndPrerequisiteTopic(Topic topic, Topic prerequisiteTopic);

    /**
     * Bulk load all prerequisite edges for a set of topics (used by PrerequisiteGraphResolver).
     * Returns edges where the topic is in the given topic ID list.
     */
    @Query("SELECT tp FROM TopicPrerequisite tp WHERE tp.topic.id IN :topicIds")
    List<TopicPrerequisite> findByTopicIdIn(@Param("topicIds") List<UUID> topicIds);

    /**
     * All edges for topics owned by a specific user (used by planner to load the full graph).
     */
    @Query("""
        SELECT tp FROM TopicPrerequisite tp
        WHERE tp.topic.subject.user.id = :userId
        """)
    List<TopicPrerequisite> findAllByUserId(@Param("userId") UUID userId);
}
