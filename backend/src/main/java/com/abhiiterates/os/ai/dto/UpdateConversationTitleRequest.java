package com.abhiiterates.os.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateConversationTitleRequest(
        @NotBlank(message = "Title cannot be blank")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title
) {}
