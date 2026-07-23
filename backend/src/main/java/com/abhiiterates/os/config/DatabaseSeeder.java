package com.abhiiterates.os.config;

import com.abhiiterates.os.user.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
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
public class DatabaseSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;
    private final com.abhiiterates.os.marketplace.store.StoreResourceRepository storeResourceRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking database roles, permissions, admin account, and user cleanup...");

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

        // 3. Seed Primary Admin Credentials (abhishekforcollege@gmail.com)
        User adminUser = seedAdminUser(adminRole, superAdminRole);

        // 4. Purge All Non-Admin Student Logins (reassigning content to primary admin)
        cleanupStudentLogins(adminUser);

        // 5. Seed Initial Store Resources for Student Marketplace
        seedStoreResources();

        log.info("Database seeding and user cleanup successfully completed.");
    }

    private User seedAdminUser(Role adminRole, Role superAdminRole) {
        String adminEmail = "abhishekforcollege@gmail.com";
        Set<Role> roles = new HashSet<>();
        if (adminRole != null) roles.add(adminRole);
        if (superAdminRole != null) roles.add(superAdminRole);

        return userRepository.findByEmail(adminEmail).map(user -> {
            user.setPasswordHash(passwordEncoder.encode("Abhishek.1410@2004"));
            user.setRoles(roles);
            user.setActive(true);
            user.setEmailVerified(true);
            log.info("Admin user '{}' verified and updated.", adminEmail);
            return userRepository.save(user);
        }).orElseGet(() -> {
            User adminUser = User.builder()
                    .email(adminEmail)
                    .username("abhishek")
                    .passwordHash(passwordEncoder.encode("Abhishek.1410@2004"))
                    .firstName("Abhishek")
                    .lastName("Admin")
                    .roles(roles)
                    .active(true)
                    .emailVerified(true)
                    .build();
            log.info("Seeded primary admin user: {}", adminEmail);
            return userRepository.save(adminUser);
        });
    }

    private void cleanupStudentLogins(User adminUser) {
        String adminEmail = "abhishekforcollege@gmail.com";
        List<User> nonAdminUsers = userRepository.findAll().stream()
                .filter(u -> !adminEmail.equalsIgnoreCase(u.getEmail()))
                .collect(Collectors.toList());

        if (!nonAdminUsers.isEmpty()) {
            log.info("Purging {} non-admin student logins from database...", nonAdminUsers.size());
            for (User student : nonAdminUsers) {
                log.info("Cleaning references and purging student user: {}", student.getEmail());

                UUID adminId = adminUser.getId();
                UUID studentId = student.getId();

                // Reassign entity ownership to primary admin
                executeNativeUpdate("UPDATE tasks SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE calendar_events SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE resources SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE marketplace_listings SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE store_resources SET uploaded_by_user_id = :adminId WHERE uploaded_by_user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE resource_purchases SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE notifications SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);
                executeNativeUpdate("UPDATE ai_conversations SET user_id = :adminId WHERE user_id = :studentId", adminId, studentId);

                // Purge transient tokens and user-session relationships
                executeNativeDelete("DELETE FROM password_reset_tokens WHERE user_id = :studentId", studentId);
                executeNativeDelete("DELETE FROM email_verification_tokens WHERE user_id = :studentId", studentId);
                executeNativeDelete("DELETE FROM refresh_tokens WHERE user_id = :studentId", studentId);
                executeNativeDelete("DELETE FROM user_sessions WHERE user_id = :studentId", studentId);
                executeNativeDelete("DELETE FROM user_roles WHERE user_id = :studentId", studentId);

                // Purge student user
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
            log.debug("Native update query [{}] executed/skipped: {}", sql, e.getMessage());
        }
    }

    private void executeNativeDelete(String sql, UUID studentId) {
        try {
            entityManager.createNativeQuery(sql)
                    .setParameter("studentId", studentId)
                    .executeUpdate();
        } catch (Exception e) {
            log.debug("Native delete query [{}] executed/skipped: {}", sql, e.getMessage());
        }
    }

    private void seedStoreResources() {
        if (storeResourceRepository.count() == 0) {
            log.info("Seeding initial premium store notes & resources...");
            java.time.Instant oneYear = java.time.Instant.now().plus(365, java.time.temporal.ChronoUnit.DAYS);
            java.time.Instant sixMonths = java.time.Instant.now().plus(180, java.time.temporal.ChronoUnit.DAYS);

            storeResourceRepository.save(com.abhiiterates.os.marketplace.store.StoreResource.builder()
                    .title("Placement Prep Masterkit 2026 (DSA + System Design)")
                    .description("Complete curated handbook for MAANG and top product company interviews. Covers 150+ standard DSA patterns, mock interview questions, and System Design templates.")
                    .category("Placement")
                    .priceInRupees(new java.math.BigDecimal("149.00"))
                    .expiryDate(oneYear)
                    .fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
                    .fileName("Placement_Prep_Masterkit_2026.pdf")
                    .fileSize(12500000L)
                    .tags("Placement, DSA, System Design, Java, C++, Interview")
                    .active(true)
                    .build());

            storeResourceRepository.save(com.abhiiterates.os.marketplace.store.StoreResource.builder()
                    .title("DBMS & SQL Query Optimization Handwritten Notes")
                    .description("Comprehensive handwritten notes covering Normalization, B+ Trees, Indexing, Transactions, and top 50 SQL queries asked in campus placements.")
                    .category("Placement")
                    .priceInRupees(new java.math.BigDecimal("99.00"))
                    .expiryDate(sixMonths)
                    .fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
                    .fileName("DBMS_SQL_Placement_Notes.pdf")
                    .fileSize(8400000L)
                    .tags("DBMS, SQL, Database, Placement, Core CS")
                    .active(true)
                    .build());

            storeResourceRepository.save(com.abhiiterates.os.marketplace.store.StoreResource.builder()
                    .title("Full Stack Web Development & Microservices Architecture Sheet")
                    .description("Architecture blueprints, React + Spring Boot REST API integration guides, Docker deployment cheat sheet, and security best practices.")
                    .category("General")
                    .priceInRupees(new java.math.BigDecimal("79.00"))
                    .expiryDate(sixMonths)
                    .fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
                    .fileName("FullStack_Architecture_Sheet.pdf")
                    .fileSize(9600000L)
                    .tags("Web Dev, React, Spring Boot, Microservices, General")
                    .active(true)
                    .build());

            storeResourceRepository.save(com.abhiiterates.os.marketplace.store.StoreResource.builder()
                    .title("GATE CS/IT 10-Year Topic-wise Solved Question Bank")
                    .description("Topic-wise sorted 10-year GATE questions with step-by-step mathematical solutions and shortcut formulas for OS, TOC, Compiler Design, and CN.")
                    .category("General")
                    .priceInRupees(new java.math.BigDecimal("49.00"))
                    .expiryDate(oneYear)
                    .fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
                    .fileName("GATE_CS_Solved_Question_Bank.pdf")
                    .fileSize(15200000L)
                    .tags("GATE, Core CS, OS, TOC, Algorithms, General")
                    .active(true)
                    .build());
        }
    }

    private Permission getOrCreatePermission(String name, String description) {
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

    private Role getOrCreateRole(String name, String description, Set<Permission> permissions) {
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
