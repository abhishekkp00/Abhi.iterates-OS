package com.abhiiterates.os.admin.controller;

import com.abhiiterates.os.admin.dto.AdminUserResponseDto;
import com.abhiiterates.os.admin.dto.UpdateRolesRequest;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin User Operations", description = "Administrative commands to manage student users")
@Slf4j
public class AdminUserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final com.abhiiterates.os.admin.AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "Search and filter registered user profiles (paginated)")
    public ResponseEntity<ApiResponse<Page<AdminUserResponseDto>>> getUsers(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            HttpServletRequest request
    ) {
        log.info("Searching users with query: '{}', active filter: {}", search, active);
        Page<User> users = userRepository.searchUsers(search, active, pageable);
        
        Page<AdminUserResponseDto> mapped = users.map(user -> AdminUserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .active(user.isActive())
                .softDeleted(user.isSoftDeleted())
                .createdAt(user.getCreatedAt())
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(mapped, "Users list retrieved", request.getRequestURI())
        );
    }

    @PutMapping("/{id}/roles")
    @Operation(summary = "Assign a new list of security roles to a user")
    public ResponseEntity<ApiResponse<Void>> updateUserRoles(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRolesRequest body,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest request
    ) {
        if (adminUser.getId().equals(id)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("You cannot modify your own administrative roles.", 400, request.getRequestURI())
            );
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Set<Role> newRoles = new HashSet<>();
        for (String roleName : body.roles()) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
            newRoles.add(role);
        }

        target.setRoles(newRoles);
        userRepository.save(target);
        log.info("Admin '{}' updated roles of user '{}' to {}", adminUser.getEmail(), target.getEmail(), body.roles());

        auditLogRepository.save(com.abhiiterates.os.admin.AuditLog.builder()
                .adminEmail(adminUser.getEmail())
                .action("UPDATE_USER_ROLES")
                .target(target.getUsername())
                .details("Roles updated to: " + body.roles())
                .ipAddress(request.getRemoteAddr())
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(null, "User roles updated successfully", request.getRequestURI())
        );
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Deactivate or reactivate a student user account")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(
            @PathVariable UUID id,
            @RequestParam boolean active,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest request
    ) {
        if (adminUser.getId().equals(id)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("You cannot change your own active status.", 400, request.getRequestURI())
            );
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        target.setActive(active);
        userRepository.save(target);
        log.info("Admin '{}' set active status of user '{}' to {}", adminUser.getEmail(), target.getEmail(), active);

        auditLogRepository.save(com.abhiiterates.os.admin.AuditLog.builder()
                .adminEmail(adminUser.getEmail())
                .action(active ? "REACTIVATE_USER" : "DEACTIVATE_USER")
                .target(target.getUsername())
                .details("Active status set to: " + active)
                .ipAddress(request.getRemoteAddr())
                .createdAt(Instant.now())
                .build());

        String message = active ? "User reactivated successfully" : "User deactivated successfully";
        return ResponseEntity.ok(
                ApiResponse.success(null, message, request.getRequestURI())
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently disable (soft-delete) user credentials")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest request
    ) {
        if (adminUser.getId().equals(id)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("You cannot soft-delete your own account.", 400, request.getRequestURI())
            );
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        target.setActive(false);
        target.setSoftDeleted(true);
        target.setDeletedAt(Instant.now());
        userRepository.save(target);
        log.info("Admin '{}' soft-deleted user '{}'", adminUser.getEmail(), target.getEmail());

        auditLogRepository.save(com.abhiiterates.os.admin.AuditLog.builder()
                .adminEmail(adminUser.getEmail())
                .action("DELETE_USER")
                .target(target.getUsername())
                .details("Soft deleted account permanently")
                .ipAddress(request.getRemoteAddr())
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(null, "User soft-deleted successfully", request.getRequestURI())
        );
    }
}
