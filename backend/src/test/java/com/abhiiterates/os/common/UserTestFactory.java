package com.abhiiterates.os.common;

import com.abhiiterates.os.user.User;

import java.util.Collections;
import java.util.UUID;

/**
 * Reusable Test Factory for creating User entity instances in unit and integration tests.
 */
public class UserTestFactory {

    public static User createTestUser(String username, String email, String roleName) {
        return User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .email(email)
                .passwordHash("$2a$10$e7x83wJ/0XwG1GzP8HkP5eZ3gL0S4V8e1R2T3Y4U5I6O7P8Q9R0S1") // dummy hash
                .firstName("Test")
                .lastName("User")
                .active(true)
                .emailVerified(true)
                .softDeleted(false)
                .roles(Collections.emptySet())
                .build();
    }

    public static User createRegularUser(String prefix) {
        return createTestUser(prefix + "_user", prefix + "@example.com", "ROLE_USER");
    }

    public static User createAdminUser(String prefix) {
        return createTestUser(prefix + "_admin", prefix + "_admin@example.com", "ROLE_ADMIN");
    }
}
