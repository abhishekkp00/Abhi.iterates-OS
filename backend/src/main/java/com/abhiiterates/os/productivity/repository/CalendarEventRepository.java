package com.abhiiterates.os.productivity.repository;

import com.abhiiterates.os.productivity.domain.CalendarEvent;
import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {
    
    List<CalendarEvent> findAllByUser(User user);
    
    Optional<CalendarEvent> findByIdAndUser(UUID id, User user);
}
