package com.abhiiterates.os.config;

import com.abhiiterates.os.user.Permission;
import com.abhiiterates.os.user.PermissionRepository;
import com.abhiiterates.os.user.Role;
import com.abhiiterates.os.user.RoleRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Database Seeder.
 * Bootstraps initial roles, permissions, primary admin account, and purges non-admin student logins.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DatabaseSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    /** Loaded from ADMIN_EMAIL env variable — never hardcoded in source */
    @Value("${app.admin.email}")
    private String adminEmail;

    /** Loaded from ADMIN_PASSWORD env variable — never hardcoded in source */
    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        log.info("Checking database roles, permissions, admin account, and user cleanup...");

        try {
            // 1. Seed Permissions
            Permission readPermission = getOrCreatePermission("READ_RESOURCE", "Allows reading academic resources");
            Permission writePermission = getOrCreatePermission("WRITE_RESOURCE", "Allows creating and editing academic resources");
            Permission deletePermission = getOrCreatePermission("DELETE_RESOURCE", "Allows soft-deleting academic resources");
            Permission adminAccess = getOrCreatePermission("ADMIN_ACCESS", "Allows access to administrative dashboards");

            // 2. Seed Roles
            Set<Permission> userPerms = new HashSet<>();
            userPerms.add(readPermission);
            getOrCreateRole("ROLE_USER", "Standard student user role", userPerms);

            Set<Permission> creatorPerms = new HashSet<>();
            creatorPerms.add(readPermission);
            creatorPerms.add(writePermission);
            getOrCreateRole("ROLE_CREATOR", "Student content creator role", creatorPerms);

            Set<Permission> adminPerms = new HashSet<>();
            adminPerms.add(readPermission);
            adminPerms.add(writePermission);
            adminPerms.add(deletePermission);
            adminPerms.add(adminAccess);
            Role adminRole = getOrCreateRole("ROLE_ADMIN", "System administrator role", adminPerms);
            Role superAdminRole = getOrCreateRole("ROLE_SUPER_ADMIN", "System owner role", adminPerms);

            // 3. Seed Primary Admin Credentials
            User adminUser = seedAdminUser(adminRole, superAdminRole);

            // 4. Purge All Non-Admin Student Logins
            cleanupStudentLogins(adminUser);

            log.info("Database seeding and user cleanup successfully completed.");
        } catch (Exception e) {
            log.warn("DatabaseSeeder execution encountered exception: {}", e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public User seedAdminUser(Role adminRole, Role superAdminRole) {
        Set<Role> roles = new HashSet<>();
        if (adminRole != null) roles.add(adminRole);
        if (superAdminRole != null) roles.add(superAdminRole);

        return userRepository.findByEmail(adminEmail).map(user -> {
            user.setPasswordHash(passwordEncoder.encode(adminPassword));
            user.setRoles(roles);
            user.setActive(true);
            user.setEmailVerified(true);
            log.info("Admin user verified and updated.");
            return userRepository.save(user);
        }).orElseGet(() -> {
            String defaultUsername = adminEmail.contains("@") ? adminEmail.split("@")[0] : "admin";
            User adminUser = User.builder()
                    .email(adminEmail)
                    .username(defaultUsername)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .firstName("System")
                    .lastName("Administrator")
                    .roles(roles)
                    .active(true)
                    .emailVerified(true)
                    .build();
            log.info("Creating primary system admin user from environment configuration: {}", adminEmail);
            return userRepository.save(adminUser);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void cleanupStudentLogins(User adminUser) {
        if (adminUser == null) return;
        List<User> nonAdminUsers = userRepository.findAll().stream()
                .filter(u -> !adminEmail.equalsIgnoreCase(u.getEmail()))
                .collect(Collectors.toList());

        if (!nonAdminUsers.isEmpty()) {
            log.info("Purging {} non-admin student logins from database...", nonAdminUsers.size());
            for (User student : nonAdminUsers) {
                UUID adminId = adminUser.getId();
                UUID studentId = student.getId();

                executeNativeUpdate("UPDATE tasks SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE calendar_events SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE resources SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE notifications SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE ai_conversations SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);

                executeNativeDelete("DELETE FROM password_reset_tokens WHERE user_id = :studentId", studentId);
                executeNativeDelete("DELETE FROM email_verification_tokens WHERE user_id = :studentId", studentId);
                executeNativeDelete("DELETE FROM refresh_tokens WHERE user_id = :studentId", studentId);
                executeNativeDelete("DELETE FROM user_sessions WHERE user_id = :studentId", studentId);
                executeNativeDelete("DELETE FROM user_roles WHERE user_id = :studentId", studentId);

                executeNativeDelete("DELETE FROM users WHERE id = :studentId", studentId);
            }
        }
    }

    private void executeNativeUpdate(String sql, UUID adminId, UUID studentId) {
        try {
            entityManager.createNativeQuery(sql)
                    .setParameter("adminId", adminId)
                    .setParameter("studentId", studentId)
                    .executeUpdate();
        } catch (Exception e) {
            // Ignored
        }
    }

    private void executeNativeDelete(String sql, UUID studentId) {
        try {
            entityManager.createNativeQuery(sql)
                    .setParameter("studentId", studentId)
                    .executeUpdate();
        } catch (Exception e) {
            // Ignored
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Permission getOrCreatePermission(String name, String description) {
        return permissionRepository.findByName(name)
                .orElseGet(() -> {
                    Permission permission = Permission.builder()
                            .name(name)
                            .description(description)
                            .build();
                    log.info("Seeding permission: {}", name);
                    return permissionRepository.save(permission);
                });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Role getOrCreateRole(String name, String description, Set<Permission> permissions) {
        return roleRepository.findByName(name)
                .map(role -> {
                    role.setPermissions(permissions);
                    return roleRepository.save(role);
                })
                .orElseGet(() -> {
                    Role role = Role.builder()
                            .name(name)
                            .description(description)
                            .permissions(permissions)
                            .build();
                    log.info("Seeding role: {}", name);
                    return roleRepository.save(role);
                });
    }
}
