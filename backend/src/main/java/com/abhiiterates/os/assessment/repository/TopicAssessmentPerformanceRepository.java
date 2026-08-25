package com.abhiiterates.os.assessment.repository;

import com.abhiiterates.os.assessment.domain.TopicAssessmentPerformance;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TopicAssessmentPerformanceRepository extends JpaRepository<TopicAssessmentPerformance, UUID> {
    
    @Query("SELECT p FROM TopicAssessmentPerformance p WHERE p.user = :user AND p.topic.id = :topicId ORDER BY p.evaluatedAt DESC")
    Page<TopicAssessmentPerformance> findByUserAndTopicId(@Param("user") User user, @Param("topicId") UUID topicId, Pageable pageable);

    @Query("SELECT p FROM TopicAssessmentPerformance p WHERE p.user = :user AND p.topic.id = :topicId ORDER BY p.evaluatedAt DESC")
    List<TopicAssessmentPerformance> findByUserAndTopicIdOrderByEvaluatedAtDesc(@Param("user") User user, @Param("topicId") UUID topicId);
}
