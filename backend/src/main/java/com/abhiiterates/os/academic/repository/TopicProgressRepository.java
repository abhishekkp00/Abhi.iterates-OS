package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.domain.TopicProgress;
import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TopicProgressRepository extends JpaRepository<TopicProgress, UUID> {

    Optional<TopicProgress> findByUserAndTopic(User user, Topic topic);

    @Query("SELECT p FROM TopicProgress p WHERE p.user.id = :userId AND p.topic.id = :topicId")
    Optional<TopicProgress> findByUserIdAndTopicId(@Param("userId") UUID userId, @Param("topicId") UUID topicId);
}
