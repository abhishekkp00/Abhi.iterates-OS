package com.abhiiterates.os;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main Entry Point for AbhiIterates.OS Spring Boot Application.
 *
 * Production best practice: Explicitly configure timezone and lifecycle markers.
 */
@SpringBootApplication
@EnableJpaAuditing
@Slf4j
public class OsApplication {

    public static void main(String[] args) {
        SpringApplication.run(OsApplication.class, args);
    }

    /**
     * Enforce UTC Timezone globally.
     * Prevents database datetime shifting when hosting servers in different regions.
     */
    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        log.info("AbhiIterates.OS Backend initialized in UTC Timezone.");
    }
}
