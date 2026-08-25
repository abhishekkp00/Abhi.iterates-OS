package com.abhiiterates.os.assessment.repository;

import com.abhiiterates.os.assessment.domain.Assessment;
import com.abhiiterates.os.assessment.domain.AssessmentStatus;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {
    Page<Assessment> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    Page<Assessment> findByUserAndStatusOrderByCreatedAtDesc(User user, AssessmentStatus status, Pageable pageable);
    Optional<Assessment> findByIdAndUser(UUID id, User user);
}
