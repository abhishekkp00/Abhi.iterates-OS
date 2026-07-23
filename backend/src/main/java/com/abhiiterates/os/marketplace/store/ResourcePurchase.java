package com.abhiiterates.os.marketplace.store;

import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resource_purchases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourcePurchase extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_resource_id", nullable = false)
    private StoreResource storeResource;

    @Column(name = "amount_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "payment_ref_id", nullable = false)
    private String paymentRefId; // UPI Ref ID / UTR

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod; // e.g. "UPI"

    @Column(name = "expires_at")
    private Instant expiresAt;
}
