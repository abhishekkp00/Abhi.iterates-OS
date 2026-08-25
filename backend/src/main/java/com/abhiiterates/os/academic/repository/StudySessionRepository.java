package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.StudySession;
import com.abhiiterates.os.academic.domain.StudySessionStatus;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {

    List<StudySession> findByUserAndStatus(User user, StudySessionStatus status);

    Optional<StudySession> findByIdAndUser(UUID id, User user);

    Page<StudySession> findByUserOrderByStartedAtDesc(User user, Pageable pageable);

    @Query("SELECT s FROM StudySession s WHERE s.user = :user AND s.startedAt >= :start AND s.startedAt <= :end ORDER BY s.startedAt DESC")
    Page<StudySession> findByUserAndDateRange(
            @Param("user") User user,
            @Param("start") Instant start,
            @Param("end") Instant end,
            Pageable pageable
    );

    @Query("SELECT s FROM StudySession s WHERE s.user = :user AND s.topic.id = :topicId ORDER BY s.startedAt DESC")
    Page<StudySession> findByUserAndTopicId(
            @Param("user") User user,
            @Param("topicId") UUID topicId,
            Pageable pageable
    );
}
