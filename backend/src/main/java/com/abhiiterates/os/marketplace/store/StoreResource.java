package com.abhiiterates.os.marketplace.store;

import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "store_resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreResource extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String category; // e.g., Placement, General, Semester Notes, GATE Prep, Lab Manuals

    @Column(name = "price_in_rupees", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceInRupees;

    @Column(name = "expiry_date")
    private Instant expiryDate; // Date after which access expires

    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "preview_url", length = 1000)
    private String previewUrl;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "tags")
    private String tags;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id")
    private User uploadedByUser;
}
