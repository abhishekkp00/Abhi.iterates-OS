package com.abhiiterates.os.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "academic.learning-state")
@Getter
@Setter
public class LearningStateProperties {

    private int minimumAttempts = 2;
    private double weakThreshold = 50.0;
    private double developingThreshold = 75.0;
    private double strongThreshold = 85.0;

    private TrendProperties trend = new TrendProperties();
    private EvidenceProperties evidence = new EvidenceProperties();

    @Getter
    @Setter
    public static class TrendProperties {
        private int recentWindow = 3;
        private int previousWindow = 3;
        private double meaningfulChange = 5.0;
    }

    @Getter
    @Setter
    public static class EvidenceProperties {
        private int mediumAttempts = 2;
        private int highAttempts = 4;
    }

    @PostConstruct
    public void validate() {
        if (weakThreshold < 0 || weakThreshold > 100) {
            throw new IllegalArgumentException("weakThreshold must be between 0 and 100");
        }
        if (developingThreshold < 0 || developingThreshold > 100) {
            throw new IllegalArgumentException("developingThreshold must be between 0 and 100");
        }
        if (strongThreshold < 0 || strongThreshold > 100) {
            throw new IllegalArgumentException("strongThreshold must be between 0 and 100");
        }
        if (weakThreshold >= developingThreshold || developingThreshold >= strongThreshold) {
            throw new IllegalArgumentException("Threshold hierarchy must satisfy: weak < developing < strong");
        }
    }
}
