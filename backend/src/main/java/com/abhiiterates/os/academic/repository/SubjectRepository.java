package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    List<Subject> findByUserOrderByNameAsc(User user);
    Page<Subject> findByUserOrderByNameAsc(User user, Pageable pageable);
    Optional<Subject> findByIdAndUser(UUID id, User user);
}
