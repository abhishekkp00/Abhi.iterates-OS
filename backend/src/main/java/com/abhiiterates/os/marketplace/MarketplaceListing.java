package com.abhiiterates.os.marketplace;

import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "marketplace_listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceListing extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean negotiable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingCondition condition;

    @Column(name = "location")
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus status;

    @Column(name = "tags")
    private String tags;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User seller;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ListingImage> images = new ArrayList<>();
}
