package com.abhiiterates.os.admin;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "system_settings", indexes = {
        @Index(name = "idx_system_settings_key", columnList = "setting_key", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "setting_key", nullable = false, unique = true)
    private String settingKey;

    @Column(name = "setting_value", nullable = false, length = 1000)
    private String settingValue;

    @Column(length = 500)
    private String description;
}
