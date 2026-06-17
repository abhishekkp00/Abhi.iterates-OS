package com.abhishek.Abhiiterates.controller;

import com.abhishek.Abhiiterates.dto.ResourceResponse;
import com.abhishek.Abhiiterates.enums.ResourceType;
import com.abhishek.Abhiiterates.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponse> uploadResource(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("type") ResourceType type,
            @RequestParam(value = "price", defaultValue = "0.0") Double price,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Principal principal) {
        
        ResourceResponse response = resourceService.uploadResource(title, description, type, price, file, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getAllResources(Principal principal) {
        List<ResourceResponse> resources = resourceService.getAllResources(principal.getName());
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable Long id, Principal principal) {
        ResourceResponse resource = resourceService.getResourceById(id, principal.getName());
        return ResponseEntity.ok(resource);
    }

    @PostMapping("/{id}/purchase")
    public ResponseEntity<Void> purchaseResource(@PathVariable Long id, Principal principal) {
        resourceService.purchaseResource(id, principal.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> viewFile(@PathVariable Long id, Principal principal) {
        byte[] data = resourceService.loadResourceFile(id, principal.getName());
        ResourceResponse resource = resourceService.getResourceById(id, principal.getName());

        HttpHeaders headers = new HttpHeaders();
        // Prevent browser caching to make screenshots and session access even tighter
        headers.setCacheControl("no-store, no-cache, must-revalidate, max-age=0");
        headers.setPragma("no-cache");

        if (resource.getType() == ResourceType.PDF) {
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.inline().filename("resource-" + id + ".pdf").build());
        } else {
            // If it is an image/note, set standard image content types or octet stream
            String desc = resource.getDescription() != null ? resource.getDescription().toLowerCase() : "";
            if (desc.contains("png")) {
                headers.setContentType(MediaType.IMAGE_PNG);
            } else if (desc.contains("jpg") || desc.contains("jpeg")) {
                headers.setContentType(MediaType.IMAGE_JPEG);
            } else {
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            }
        }

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
}
