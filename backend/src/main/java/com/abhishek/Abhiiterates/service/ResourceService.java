package com.abhishek.Abhiiterates.service;

import com.abhishek.Abhiiterates.dto.ResourceResponse;
import com.abhishek.Abhiiterates.entity.Purchase;
import com.abhishek.Abhiiterates.entity.Resource;
import com.abhishek.Abhiiterates.entity.User;
import com.abhishek.Abhiiterates.enums.ResourceType;
import com.abhishek.Abhiiterates.exception.BadRequestException;
import com.abhishek.Abhiiterates.exception.UnauthorizedException;
import com.abhishek.Abhiiterates.repository.PurchaseRepository;
import com.abhishek.Abhiiterates.repository.ResourceRepository;
import com.abhishek.Abhiiterates.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final PurchaseRepository purchaseRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Transactional
    public ResourceResponse uploadResource(String title, String description, ResourceType type, Double price, MultipartFile file, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Resource.ResourceBuilder builder = Resource.builder()
                .title(title)
                .description(description)
                .type(type)
                .price(price != null ? price : 0.0)
                .user(user);

        if (file != null && !file.isEmpty()) {
            try {
                // Ensure directory exists
                Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
                Files.createDirectories(uploadPath);

                // Unique filename
                String originalFilename = file.getOriginalFilename();
                String fileExtension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String filename = UUID.randomUUID().toString() + fileExtension;
                Path targetLocation = uploadPath.resolve(filename);

                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                builder.filePath(targetLocation.toString());
                builder.url("/api/resources/view/" + filename); // Public identifier
            } catch (IOException ex) {
                throw new BadRequestException("Could not store file. Please try again.");
            }
        }

        Resource resource = resourceRepository.save(builder.build());
        return mapToResponse(resource, user);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> getAllResources(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        List<Resource> resources = resourceRepository.findAll();
        return resources.stream()
                .map(r -> mapToResponse(r, user))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Resource not found"));

        return mapToResponse(resource, user);
    }

    @Transactional
    public void purchaseResource(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Resource not found"));

        if (resource.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You already own this resource");
        }

        if (purchaseRepository.existsByUserIdAndResourceId(user.getId(), resource.getId())) {
            throw new BadRequestException("Resource already purchased");
        }

        Purchase purchase = Purchase.builder()
                .user(user)
                .resource(resource)
                .pricePaid(resource.getPrice())
                .build();

        purchaseRepository.save(purchase);
    }

    @Transactional(readOnly = true)
    public byte[] loadResourceFile(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Resource not found"));

        // Security check: must own it, have purchased it, or it must be free (price == 0)
        boolean isOwner = resource.getUser().getId().equals(user.getId());
        boolean isPurchased = resource.getPrice() <= 0.0 || purchaseRepository.existsByUserIdAndResourceId(user.getId(), resource.getId());

        if (!isOwner && !isPurchased) {
            throw new UnauthorizedException("Access Denied: You must purchase this resource to view it.");
        }

        if (resource.getFilePath() == null) {
            throw new BadRequestException("This resource does not contain an uploaded file.");
        }

        try {
            return Files.readAllBytes(Paths.get(resource.getFilePath()));
        } catch (IOException e) {
            throw new BadRequestException("Could not read file from storage.");
        }
    }

    private ResourceResponse mapToResponse(Resource resource, User currentUser) {
        boolean isOwner = resource.getUser().getId().equals(currentUser.getId());
        boolean isPurchased = resource.getPrice() <= 0.0 || purchaseRepository.existsByUserIdAndResourceId(currentUser.getId(), resource.getId());

        return ResourceResponse.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .type(resource.getType())
                .price(resource.getPrice())
                .ownerId(resource.getUser().getId())
                .ownerName(resource.getUser().getName())
                .isOwner(isOwner)
                .isPurchased(isPurchased)
                .url((isOwner || isPurchased) ? ("/api/resources/" + resource.getId() + "/view") : null) // Secure URL slug
                .createdAt(resource.getCreatedAt())
                .build();
    }
}
