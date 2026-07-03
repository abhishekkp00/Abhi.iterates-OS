package com.abhiiterates.os;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Basic Context Bootstrapping Test.
 * Ensures the Spring container starts without configuration or dependency errors.
 */
@SpringBootTest
@ActiveProfiles("dev")
class OsApplicationTests {

    @Test
    void contextLoads() {
        // Verifies context booting success
    }
}
