package com.abhishek.Abhiiterates.dto;

import com.abhishek.Abhiiterates.enums.ResourceType;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ResourceResponse {
    private Long id;
    private String title;
    private String description;
    private ResourceType type;
    private Double price;
    private String ownerName;
    private Long ownerId;
    private Boolean isOwner;
    private Boolean isPurchased;
    private String url; // Only visible if free, owned, or purchased
    private LocalDateTime createdAt;
}
