package com.abhiiterates.os.user.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * User Profile information returned after successful registration or login.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private UUID id;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private List<String> roles;
    private boolean emailVerified;
}
