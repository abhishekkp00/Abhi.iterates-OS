package com.abhiiterates.os.auth;

import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    List<UserSession> findByUserAndActiveTrue(User user);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
