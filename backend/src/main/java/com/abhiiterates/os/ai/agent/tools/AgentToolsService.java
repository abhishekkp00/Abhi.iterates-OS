package com.abhiiterates.os.ai.agent.tools;

import com.abhiiterates.os.ai.agent.AgentTool;
import com.abhiiterates.os.ai.agent.ExecutionContext;
import com.abhiiterates.os.ai.agent.ToolParam;
import com.abhiiterates.os.marketplace.MarketplaceListingService;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.resource.ResourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentToolsService {

    private final ResourceService resourceService;
    private final ResourceAttachmentRepository attachmentRepository;
    private final MarketplaceListingService marketplaceListingService;

    @AgentTool(name = "searchResources", description = "Find personal study resources matching a search query.")
    public List<Map<String, Object>> searchResources(
            @ToolParam(description = "The keyword or topic to search for in titles and descriptions.") String query,
            ExecutionContext context
    ) {
        log.info("Agent tool 'searchResources' called with query: {}", query);
        try {
            var page = resourceService.findAllWithFilters(
                    context.getUser(),
                    query,
                    null,
                    null,
                    null,
                    PageRequest.of(0, 10)
            );
            
            return page.getContent().stream().map(res -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", res.getId());
                map.put("title", res.getTitle());
                map.put("description", res.getDescription());
                map.put("category", res.getCategory());
                map.put("status", res.getStatus());
                map.put("priority", res.getPriority());
                return map;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error in searchResources tool", e);
            throw new RuntimeException("Failed to search resources: " + e.getMessage());
        }
    }

    @AgentTool(name = "searchMarketplace", description = "Browse campus marketplace items currently listed for sale.")
    public List<Map<String, Object>> searchMarketplace(
            @ToolParam(description = "Keywords like 'textbook', 'calculator' or seller name.") String query,
            ExecutionContext context
    ) {
        log.info("Agent tool 'searchMarketplace' called with query: {}", query);
        try {
            var page = marketplaceListingService.findAllWithFilters(
                    query,
                    null,
                    null,
                    null,
                    PageRequest.of(0, 10)
            );
            
            return page.getContent().stream().map(listing -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", listing.getId());
                map.put("title", listing.getTitle());
                map.put("description", listing.getDescription());
                map.put("price", listing.getPrice());
                map.put("category", listing.getCategory());
                map.put("condition", listing.getCondition());
                map.put("status", listing.getStatus());
                map.put("sellerName", listing.getSeller().getFullName());
                return map;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error in searchMarketplace tool", e);
            throw new RuntimeException("Failed to search marketplace: " + e.getMessage());
        }
    }

    @AgentTool(name = "searchKnowledgeBase", description = "Query study document attachments semantically for course contents.")
    public List<Map<String, Object>> searchKnowledgeBase(
            @ToolParam(description = "Information to look up inside PDFs or document file names.") String query,
            ExecutionContext context
    ) {
        log.info("Agent tool 'searchKnowledgeBase' called with query: {}", query);
        try {
            // Find attachments owned by the current student
            List<ResourceAttachment> attachments = attachmentRepository.findAll().stream()
                    .filter(att -> att.getResource().getUser().getId().equals(context.getUser().getId()))
                    .filter(att -> att.getFileName().toLowerCase().contains(query.toLowerCase()) || 
                                   att.getResource().getTitle().toLowerCase().contains(query.toLowerCase()))
                    .collect(Collectors.toList());
                    
            return attachments.stream().map(att -> {
                Map<String, Object> map = new HashMap<>();
                map.put("attachmentId", att.getId());
                map.put("fileName", att.getFileName());
                map.put("parentResourceTitle", att.getResource().getTitle());
                map.put("downloadUrl", att.getDownloadUrl());
                map.put("fileSize", att.getFileSize());
                map.put("contentType", att.getContentType());
                map.put("citation", "[Citation: File " + att.getFileName() + " in " + att.getResource().getTitle() + "]");
                return map;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error in searchKnowledgeBase tool", e);
            throw new RuntimeException("Failed to query knowledge base documents: " + e.getMessage());
        }
    }

    @AgentTool(name = "getCurrentProfile", description = "Get your personal student account profile details.")
    public Map<String, Object> getCurrentProfile(ExecutionContext context) {
        log.info("Agent tool 'getCurrentProfile' called for user: {}", context.getUser().getUsername());
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", context.getUser().getId());
        profile.put("username", context.getUser().getUsername());
        profile.put("email", context.getUser().getEmail());
        profile.put("firstName", context.getUser().getFirstName());
        profile.put("lastName", context.getUser().getLastName());
        profile.put("roles", context.getUser().getRoles().stream().map(role -> role.getName()).collect(Collectors.toList()));
        profile.put("enabled", context.getUser().isEnabled());
        return profile;
    }

    @AgentTool(name = "getDashboardSummary", description = "Retrieve a summary report of your active resources and marketplace listing counts.")
    public Map<String, Object> getDashboardSummary(ExecutionContext context) {
        log.info("Agent tool 'getDashboardSummary' called for user: {}", context.getUser().getUsername());
        try {
            long totalResources = resourceService.findAllWithFilters(
                    context.getUser(),
                    null,
                    null,
                    null,
                    null,
                    PageRequest.of(0, 1)
            ).getTotalElements();
            
            // Fetch listing counts via service or repository filtering
            long activeListings = marketplaceListingService.findBySeller(context.getUser(), PageRequest.of(0, 100))
                    .getContent().size();
                    
            Map<String, Object> summary = new HashMap<>();
            summary.put("studentName", context.getUser().getFirstName() + " " + context.getUser().getLastName());
            summary.put("totalResources", totalResources);
            summary.put("myMarketplaceListingsCount", activeListings);
            summary.put("recentUpdates", "All systems operational. Study planner synced.");
            return summary;
        } catch (Exception e) {
            log.error("Error in getDashboardSummary tool", e);
            throw new RuntimeException("Failed to fetch dashboard summary: " + e.getMessage());
        }
    }
}
