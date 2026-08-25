package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.Exam;
import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {

    @EntityGraph(attributePaths = {"subject", "topics"})
    List<Exam> findByUserOrderByExamDateAsc(User user);

    @EntityGraph(attributePaths = {"subject", "topics"})
    List<Exam> findByUserAndExamDateGreaterThanEqualOrderByExamDateAsc(User user, LocalDate date);

    @EntityGraph(attributePaths = {"subject", "topics"})
    Optional<Exam> findByIdAndUser(UUID id, User user);

    @Query("SELECT DISTINCT e FROM Exam e LEFT JOIN FETCH e.subject LEFT JOIN FETCH e.topics WHERE e.user = :user AND e.examDate >= :startDate ORDER BY e.examDate ASC")
    List<Exam> findUpcomingExamsWithTopics(@Param("user") User user, @Param("startDate") LocalDate startDate);
}
