package com.abhiiterates.os.planner.repository;

import com.abhiiterates.os.planner.domain.PlannerPreferences;
import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlannerPreferencesRepository extends JpaRepository<PlannerPreferences, UUID> {

    Optional<PlannerPreferences> findByUser(User user);
}
