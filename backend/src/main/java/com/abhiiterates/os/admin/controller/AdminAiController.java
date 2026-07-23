package com.abhiiterates.os.admin.controller;

import com.abhiiterates.os.admin.dto.AdminConversationMessageDto;
import com.abhiiterates.os.admin.dto.AdminConversationResponseDto;
import com.abhiiterates.os.ai.AiConversation;
import com.abhiiterates.os.ai.AiConversationRepository;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/ai")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin AI Observability", description = "Endpoints to audit and monitor student-AI conversations")
@Slf4j
public class AdminAiController {

    private final AiConversationRepository conversationRepository;

    @GetMapping("/conversations")
    @Operation(summary = "Get all historical student-AI conversation summaries")
    public ResponseEntity<ApiResponse<List<AdminConversationResponseDto>>> getConversations(HttpServletRequest request) {
        log.info("Admin requested AI conversation summaries.");
        List<AiConversation> conversations = conversationRepository.findAll();

        List<AdminConversationResponseDto> mapped = conversations.stream().map(c -> {
            int msgCount = c.getMessages() != null ? c.getMessages().size() : 0;
            int totalTokens = 0;
            if (c.getMessages() != null) {
                for (var msg : c.getMessages()) {
                    totalTokens += msg.getTokenCount() != null ? msg.getTokenCount() : 180; // Fallback
                }
            }
            double cost = (totalTokens / 1000.0) * 0.0035; // Estimated cost ($0.0035 per 1k tokens)

            return AdminConversationResponseDto.builder()
                    .id(c.getId())
                    .title(c.getTitle())
                    .username(c.getUser() != null ? c.getUser().getUsername() : "System User")
                    .messageCount(msgCount)
                    .totalTokens(totalTokens)
                    .estimatedCost(cost)
                    .updatedAt(c.getUpdatedAt())
                    .model("gemini-1.5-pro") // Default engine provider
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(
                ApiResponse.success(mapped, "Conversations summaries retrieved", request.getRequestURI())
        );
    }

    @GetMapping("/conversations/{id}")
    @Operation(summary = "Get full conversation turns timeline by conversation ID")
    public ResponseEntity<ApiResponse<List<AdminConversationMessageDto>>> getConversationDetail(
            @PathVariable UUID id,
            HttpServletRequest request
    ) {
        log.info("Admin inspecting conversation session: {}", id);
        AiConversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        List<AdminConversationMessageDto> turns = conversation.getMessages().stream()
                .map(msg -> new AdminConversationMessageDto(
                        msg.getRole().name(),
                        msg.getContent(),
                        msg.getTokenCount(),
                        msg.getCreatedAt()
                )).collect(Collectors.toList());

        return ResponseEntity.ok(
                ApiResponse.success(turns, "Conversation turns retrieved", request.getRequestURI())
        );
    }
}
