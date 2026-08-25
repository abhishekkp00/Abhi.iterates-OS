package com.abhiiterates.os.academic.domain;

import com.abhiiterates.os.common.BaseAuditEntity;
import com.abhiiterates.os.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "academic_subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String code;

    @Column(length = 50)
    private String color;

    @Column(length = 1000)
    private String description;
}
