package com.abhiiterates.os.db;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class FlywaySchemaValidationTest {

    @Autowired
    private Flyway flyway;

    @Test
    @DisplayName("flywayMigration_executesSuccessfully_andMatchesInitialSchemaVersion")
    void flywayMigration_executesSuccessfully_andMatchesInitialSchemaVersion() {
        assertThat(flyway).isNotNull();

        MigrationInfo[] appliedMigrations = flyway.info().applied();
        assertThat(appliedMigrations).hasSizeGreaterThanOrEqualTo(2);

        MigrationInfo v1 = appliedMigrations[0];
        assertThat(v1.getVersion().getVersion()).isEqualTo("1");
        assertThat(v1.getDescription()).isEqualTo("initial schema");
        assertThat(v1.getState().isApplied()).isTrue();

        MigrationInfo v2 = appliedMigrations[1];
        assertThat(v2.getVersion().getVersion()).isEqualTo("2");
        assertThat(v2.getDescription()).isEqualTo("document ingestion schema");
        assertThat(v2.getState().isApplied()).isTrue();
    }
}
