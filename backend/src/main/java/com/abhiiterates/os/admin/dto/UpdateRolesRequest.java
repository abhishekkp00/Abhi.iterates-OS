package com.abhiiterates.os.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateRolesRequest(
        @NotNull(message = "Roles list must not be null")
        @NotEmpty(message = "At least one role must be specified")
        List<String> roles
) {}
