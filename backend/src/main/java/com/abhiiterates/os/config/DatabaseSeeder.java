package com.abhiiterates.os.config;

import com.abhiiterates.os.user.Permission;
import com.abhiiterates.os.user.PermissionRepository;
import com.abhiiterates.os.user.Role;
import com.abhiiterates.os.user.RoleRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Database Seeder.
 * Bootstraps initial roles, permissions, and primary admin account idempotently without modifying existing user data.
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

    /** Loaded from ADMIN_EMAIL env variable — never hardcoded in source */
    @Value("${app.admin.email:}")
    private String adminEmail;

    /** Loaded from ADMIN_PASSWORD env variable — never hardcoded in source */
    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        log.info("Checking database roles, permissions, and initial admin account...");

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

            // 3. Seed Primary Admin Credentials (idempotent, never overwrites existing user data)
            seedAdminUser(adminRole, superAdminRole);

            log.info("Database seeding successfully completed.");
        } catch (IllegalStateException e) {
            log.error("CRITICAL: Failed fast on missing deployment secret configuration: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.warn("DatabaseSeeder execution encountered exception: {}", e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public User seedAdminUser(Role adminRole, Role superAdminRole) {
        if (adminEmail == null || adminEmail.trim().isEmpty() || adminPassword == null || adminPassword.trim().isEmpty()) {
            throw new IllegalStateException("Required admin seed credentials (ADMIN_EMAIL, ADMIN_PASSWORD) are missing or empty. Please set them in your environment variables.");
        }

        Set<Role> roles = new HashSet<>();
        if (adminRole != null) roles.add(adminRole);
        if (superAdminRole != null) roles.add(superAdminRole);

        return userRepository.findByEmail(adminEmail).map(user -> {
            log.info("Admin user '{}' already exists. Preserving existing user credentials.", adminEmail);
            boolean rolesUpdated = false;
            Set<Role> currentRoles = user.getRoles();
            if (currentRoles == null) {
                currentRoles = new HashSet<>();
                user.setRoles(currentRoles);
                rolesUpdated = true;
            }
            for (Role role : roles) {
                if (currentRoles.stream().noneMatch(r -> r.getName().equals(role.getName()))) {
                    currentRoles.add(role);
                    rolesUpdated = true;
                }
            }
            if (rolesUpdated) {
                return userRepository.save(user);
            }
            return user;
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
                    if (role.getPermissions() == null || !role.getPermissions().containsAll(permissions)) {
                        Set<Permission> updatedPerms = role.getPermissions() == null ? new HashSet<>() : new HashSet<>(role.getPermissions());
                        updatedPerms.addAll(permissions);
                        role.setPermissions(updatedPerms);
                        return roleRepository.save(role);
                    }
                    return role;
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

