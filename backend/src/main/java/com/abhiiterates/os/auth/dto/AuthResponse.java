package com.abhiiterates.os.auth.dto;

import com.abhiiterates.os.user.dto.UserProfileDto;
import lombok.*;

/**
 * Combined authentication response containing access and refresh tokens.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private long expiresIn; // seconds
    private UserProfileDto user;
}
