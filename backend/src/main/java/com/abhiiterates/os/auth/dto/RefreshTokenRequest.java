package com.abhiiterates.os.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Refresh Token request data transfer object.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
