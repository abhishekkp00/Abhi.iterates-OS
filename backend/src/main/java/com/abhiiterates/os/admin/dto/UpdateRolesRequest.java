package com.abhiiterates.os.admin.dto;

import java.util.List;

public record UpdateRolesRequest(
        List<String> roles
) {}
