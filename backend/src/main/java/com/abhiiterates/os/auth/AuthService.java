package com.abhiiterates.os.auth;

import com.abhiiterates.os.auth.dto.*;
import com.abhiiterates.os.user.dto.UserProfileDto;

public interface AuthService {

    UserProfileDto registerUser(RegisterRequest request);

    AuthResponse login(LoginRequest request, String ipAddress, String userAgent);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(String refreshToken);
}
