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
}
