package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TopicRepository extends JpaRepository<Topic, UUID> {
    List<Topic> findBySubjectOrderByNameAsc(Subject subject);

    @Query("SELECT t FROM Topic t WHERE t.id = :topicId AND t.subject.user.id = :userId")
    Optional<Topic> findByIdAndUserId(@Param("topicId") UUID topicId, @Param("userId") UUID userId);

    @Query("SELECT t FROM Topic t WHERE t.subject.id = :subjectId AND t.subject.user.id = :userId ORDER BY t.name ASC")
    List<Topic> findBySubjectIdAndUserId(@Param("subjectId") UUID subjectId, @Param("userId") UUID userId);

    List<Topic> findBySubjectIdOrderByNameAsc(UUID subjectId);

    @Query("SELECT t FROM Topic t WHERE t.subject.user.id = :userId ORDER BY t.name ASC")
    List<Topic> findBySubjectUserIdOrderByNameAsc(@Param("userId") UUID userId);

    /**
     * Eager-fetch all topics for a user with their Subject pre-loaded via JOIN FETCH.
     * Used by LearningStateServiceImpl to eliminate the lazy Subject load inside
     * calculateTopicLearningState(): topic.getSubject().getName() no longer triggers
     * an additional SELECT per topic.
     *
     * <p><strong>Performance contract:</strong> This replaces the plain
     * {@link #findBySubjectUserIdOrderByNameAsc(UUID)} call in learning-state paths.
     * It produces 1 SQL instead of 1 + N lazy SQL statements.</p>
     */
    @Query("SELECT t FROM Topic t JOIN FETCH t.subject WHERE t.subject.user.id = :userId ORDER BY t.name ASC")
    List<Topic> findAllWithSubjectByUserId(@Param("userId") UUID userId);

    /**
     * Scoped variant: all topics for a given subject, with Subject eagerly loaded.
     */
    @Query("SELECT t FROM Topic t JOIN FETCH t.subject WHERE t.subject.id = :subjectId ORDER BY t.name ASC")
    List<Topic> findAllWithSubjectBySubjectId(@Param("subjectId") UUID subjectId);
}
