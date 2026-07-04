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

        log.info("Database seeding successfully completed.");
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
