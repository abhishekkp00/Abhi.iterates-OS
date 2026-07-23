package com.abhiiterates.os.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @org.springframework.data.jpa.repository.Query(
        "SELECT u FROM User u WHERE u.softDeleted = false AND " +
        "(:active IS NULL OR u.active = :active) AND (" +
        "LOWER(COALESCE(u.firstName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
        "LOWER(COALESCE(u.lastName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
        "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
        "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')))"
    )
    org.springframework.data.domain.Page<User> searchUsers(
        @org.springframework.data.repository.query.Param("search") String search, 
        @org.springframework.data.repository.query.Param("active") Boolean active, 
        org.springframework.data.domain.Pageable pageable
    );
}
