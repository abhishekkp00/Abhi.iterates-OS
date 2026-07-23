package com.abhiiterates.os.config;

import com.abhiiterates.os.user.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Database Seeder.
 * Bootstraps initial roles and permissions in PostgreSQL on application startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking database roles and permissions seeding...");

        // 1. Seed Permissions
        Permission readPermission = getOrCreatePermission("READ_RESOURCE", "Allows reading academic resources");
        Permission writePermission = getOrCreatePermission("WRITE_RESOURCE", "Allows creating and editing academic resources");
        Permission deletePermission = getOrCreatePermission("DELETE_RESOURCE", "Allows soft-deleting academic resources");
        Permission adminAccess = getOrCreatePermission("ADMIN_ACCESS", "Allows access to administrative dashboards");

        // 2. Seed Roles
        // ROLE_USER
        Set<Permission> userPerms = new HashSet<>();
        userPerms.add(readPermission);
        getOrCreateRole("ROLE_USER", "Standard student user role", userPerms);

        // ROLE_CREATOR
        Set<Permission> creatorPerms = new HashSet<>();
        creatorPerms.add(readPermission);
        creatorPerms.add(writePermission);
        getOrCreateRole("ROLE_CREATOR", "Student content creator role", creatorPerms);

        // ROLE_ADMIN
        Set<Permission> adminPerms = new HashSet<>();
        adminPerms.add(readPermission);
        adminPerms.add(writePermission);
        adminPerms.add(deletePermission);
        adminPerms.add(adminAccess);
        getOrCreateRole("ROLE_ADMIN", "System administrator role", adminPerms);

        // ROLE_SUPER_ADMIN
        getOrCreateRole("ROLE_SUPER_ADMIN", "System owner role", adminPerms);

        // 3. Seed Initial Store Resources for Student Marketplace
        seedStoreResources();

        log.info("Database seeding successfully completed.");
    }

    private final com.abhiiterates.os.marketplace.store.StoreResourceRepository storeResourceRepository;

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

    private void getOrCreateRole(String name, String description, Set<Permission> permissions) {
        roleRepository.findByName(name)
                .ifPresentOrElse(
                        role -> {
                            // Ensure permissions are up to date
                            role.setPermissions(permissions);
                            roleRepository.save(role);
                        },
                        () -> {
                            Role role = Role.builder()
                                    .name(name)
                                    .description(description)
                                    .permissions(permissions)
                                    .build();
                            log.info("Seeding role: {}", name);
                            roleRepository.save(role);
                        }
                );
    }
}
