package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.LearningActivity;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LearningActivityRepository extends JpaRepository<LearningActivity, UUID> {
    Page<LearningActivity> findByUserOrderByOccurredAtDesc(User user, Pageable pageable);
}
