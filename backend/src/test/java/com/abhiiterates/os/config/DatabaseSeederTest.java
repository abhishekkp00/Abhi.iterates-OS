package com.abhiiterates.os.config;

import com.abhiiterates.os.productivity.domain.Task;
import com.abhiiterates.os.productivity.domain.TaskPriority;
import com.abhiiterates.os.productivity.domain.TaskStatus;
import com.abhiiterates.os.productivity.repository.TaskRepository;
import com.abhiiterates.os.user.Permission;
import com.abhiiterates.os.user.PermissionRepository;
import com.abhiiterates.os.user.Role;
import com.abhiiterates.os.user.RoleRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class DatabaseSeederTest {

    @Autowired
    private DatabaseSeeder databaseSeeder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Test
    @DisplayName("seederExecution_doesNotDeleteRealUsers")
    void seederExecution_doesNotDeleteRealUsers() {
        String studentEmail = "persistent_student_" + UUID.randomUUID() + "@example.com";
        User student = User.builder()
                .email(studentEmail)
                .username("student_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash(passwordEncoder.encode("StudentPass123!"))
                .firstName("Real")
                .lastName("Student")
                .active(true)
                .emailVerified(true)
                .build();
        userRepository.save(student);

        // Act: Run seeder (simulating server reboot)
        databaseSeeder.run();

        // Assert: Real user still exists in database
        Optional<User> foundStudent = userRepository.findByEmail(studentEmail);
        assertThat(foundStudent).isPresent();
        assertThat(foundStudent.get().getEmail()).isEqualTo(studentEmail);
        assertThat(foundStudent.get().isActive()).isTrue();
    }

    @Test
    @DisplayName("seederExecution_doesNotModifyUserOwnership")
    void seederExecution_doesNotModifyUserOwnership() {
        String studentEmail = "task_owner_" + UUID.randomUUID() + "@example.com";
        User student = User.builder()
                .email(studentEmail)
                .username("owner_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash(passwordEncoder.encode("StudentPass123!"))
                .firstName("Owner")
                .lastName("Student")
                .active(true)
                .emailVerified(true)
                .build();
        student = userRepository.save(student);

        Task studentTask = Task.builder()
                .title("Complete Organic Chemistry Revision")
                .description("Focus on reaction mechanisms")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .category("CHEMISTRY")
                .dueDate(Instant.now().plusSeconds(86400))
                .user(student)
                .build();
        studentTask = taskRepository.save(studentTask);

        // Act: Run seeder (simulating server reboot)
        databaseSeeder.run();

        // Assert: Task is NOT reassigned to admin; original ownership is preserved
        Optional<Task> reloadedTask = taskRepository.findById(studentTask.getId());
        assertThat(reloadedTask).isPresent();
        UUID ownerId = reloadedTask.get().getUser().getId();
        assertThat(ownerId).isEqualTo(student.getId());

        User taskOwner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalStateException("Task owner must exist"));
        assertThat(taskOwner.getEmail()).isEqualTo(studentEmail);
        assertThat(taskOwner.getEmail()).isNotEqualTo(adminEmail);
    }

    @Test
    @DisplayName("seederExecution_preservesExistingAdminCredentialsAndDetails")
    void seederExecution_preservesExistingAdminCredentialsAndDetails() {
        // Ensure admin user exists
        databaseSeeder.run();

        User existingAdmin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException("Admin must exist after seeding"));

        // Admin changes password or profile details
        String customPasswordHash = "$2a$10$CustomChangedPasswordHashForTestingPurposes";
        String customFirstName = "SuperAdminCustomName";
        existingAdmin.setPasswordHash(customPasswordHash);
        existingAdmin.setFirstName(customFirstName);
        userRepository.save(existingAdmin);

        // Act: Run seeder again (simulating subsequent server boots)
        databaseSeeder.run();

        // Assert: Admin credentials and updated fields were NOT overwritten back to initial seed values
        User reloadedAdmin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException("Admin must exist"));
        assertThat(reloadedAdmin.getPasswordHash()).isEqualTo(customPasswordHash);
        assertThat(reloadedAdmin.getFirstName()).isEqualTo(customFirstName);
    }

    @Test
    @DisplayName("seederExecution_isIdempotent_seedingTwiceIsSafe")
    void seederExecution_isIdempotent_seedingTwiceIsSafe() {
        // First run
        databaseSeeder.run();

        long initialRoleCount = roleRepository.count();
        long initialPermissionCount = permissionRepository.count();
        long initialAdminCount = userRepository.findAll().stream()
                .filter(u -> adminEmail.equalsIgnoreCase(u.getEmail()))
                .count();

        // Second run
        databaseSeeder.run();

        // Third run
        databaseSeeder.run();

        assertThat(roleRepository.count()).isEqualTo(initialRoleCount);
        assertThat(permissionRepository.count()).isEqualTo(initialPermissionCount);
        long afterAdminCount = userRepository.findAll().stream()
                .filter(u -> adminEmail.equalsIgnoreCase(u.getEmail()))
                .count();
        assertThat(afterAdminCount).isEqualTo(initialAdminCount);
    }

    @Test
    @DisplayName("seedAdminUser_failsFastWithDescriptiveError_whenCredentialsMissing")
    void seedAdminUser_failsFastWithDescriptiveError_whenCredentialsMissing() {
        DatabaseSeeder seederWithMissingCreds = new DatabaseSeeder(
                permissionRepository,
                roleRepository,
                userRepository,
                passwordEncoder
        );
        ReflectionTestUtils.setField(seederWithMissingCreds, "adminEmail", "");
        ReflectionTestUtils.setField(seederWithMissingCreds, "adminPassword", "");

        Role dummyRole = Role.builder().name("ROLE_ADMIN").build();

        assertThatThrownBy(() -> seederWithMissingCreds.seedAdminUser(dummyRole, dummyRole))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Required admin seed credentials (ADMIN_EMAIL, ADMIN_PASSWORD) are missing or empty");
    }
}
