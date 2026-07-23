package com.abhiiterates.os.productivity.repository;

import com.abhiiterates.os.productivity.domain.Task;
import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    
    List<Task> findAllByUser(User user);
    
    Optional<Task> findByIdAndUser(UUID id, User user);
}
