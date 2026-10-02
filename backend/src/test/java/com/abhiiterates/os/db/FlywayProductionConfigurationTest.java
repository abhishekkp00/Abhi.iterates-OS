package com.abhiiterates.os.db;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:prod_boot_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "app.security.jwt.secret=testing-production-jwt-secret-key-32-chars-min",
        "app.admin.email=admin@prod.example.com",
        "app.admin.password=ProdAdminPassword123!",
        "spring.security.oauth2.client.registration.google.client-id=test-google-client-id",
        "spring.security.oauth2.client.registration.google.client-secret=test-google-client-secret",
        "spring.ai.openai.api-key=test-openai-key",
        "spring.flyway.placeholders.vector-extension-init=CREATE DOMAIN IF NOT EXISTS vector AS VARCHAR(10000);",
        "spring.flyway.placeholders.hnsw-index-init=CREATE INDEX IF NOT EXISTS idx_rag_emb_vector_idx ON rag_document_chunk_embeddings (embedding_model);",
        "spring.flyway.placeholders.jsonb-type=VARCHAR(10000)",
        "spring.flyway.placeholders.vector-type=vector",
        "spring.flyway.placeholders.vector-store-indexes=CREATE INDEX IF NOT EXISTS idx_ai_vector_store_dummy ON ai_vector_store (id);"
})
@ActiveProfiles("prod")
class FlywayProductionConfigurationTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private Environment environment;

    @Test
    @DisplayName("productionApplicationContext_bootsSuccessfullyWithProdProfile")
    void productionApplicationContext_bootsSuccessfullyWithProdProfile() {
        assertThat(flyway).isNotNull();
        assertThat(environment.getActiveProfiles()).contains("prod");

        MigrationInfo[] applied = flyway.info().applied();
        assertThat(applied).hasSize(12);
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("12");
        assertThat(flyway.info().current().getDescription()).isEqualTo("spring ai vector store");
    }

    @Test
    @DisplayName("productionProfile_loadsAndResolvesAllFlywayPlaceholders")
    void productionProfile_loadsAndResolvesAllFlywayPlaceholders() throws IOException {
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();

        // 1. Load application.yml
        List<PropertySource<?>> baseSources = loader.load(
                "application.yml",
                new ClassPathResource("application.yml")
        );
        assertThat(baseSources).isNotEmpty();

        // 2. Load application-prod.yml
        List<PropertySource<?>> prodSources = loader.load(
                "application-prod.yml",
                new ClassPathResource("application-prod.yml")
        );
        assertThat(prodSources).isNotEmpty();

        PropertySource<?> prodSource = prodSources.get(0);
        PropertySource<?> baseSource = baseSources.get(0);

        // Verify prod configuration defines all 5 required Flyway placeholders
        String vectorExt = (String) prodSource.getProperty("spring.flyway.placeholders.vector-extension-init");
        String hnswIndex = (String) prodSource.getProperty("spring.flyway.placeholders.hnsw-index-init");
        String jsonbType = (String) prodSource.getProperty("spring.flyway.placeholders.jsonb-type");
        String vectorType = (String) prodSource.getProperty("spring.flyway.placeholders.vector-type");
        String vectorStoreIndexes = (String) prodSource.getProperty("spring.flyway.placeholders.vector-store-indexes");

        assertThat(vectorExt)
                .as("vector-extension-init must initialize PostgreSQL vector extension")
                .isEqualTo("CREATE EXTENSION IF NOT EXISTS vector;");

        assertThat(hnswIndex)
                .as("hnsw-index-init must create 1536-dim HNSW cosine index")
                .isEqualTo("CREATE INDEX IF NOT EXISTS idx_rag_emb_vector_hnsw ON rag_document_chunk_embeddings USING hnsw ((vector::vector(1536)) vector_cosine_ops);");

        assertThat(jsonbType)
                .as("jsonb-type must match PostgreSQL JSONB type")
                .isEqualTo("JSONB");

        assertThat(vectorType)
                .as("vector-type must match 1536-dim embedding vector")
                .isEqualTo("vector(1536)");

        assertThat(vectorStoreIndexes)
                .as("vector-store-indexes must include HNSW and GIN index definitions")
                .contains("idx_ai_vector_store_hnsw")
                .contains("idx_ai_vector_store_metadata")
                .contains("idx_ai_vector_store_metadata_user")
                .contains("idx_ai_vector_store_metadata_resource");

        // Verify dimension alignment between embedding model and vector storage
        Object embeddingDim = baseSource.getProperty("spring.ai.vectorstore.pgvector.dimensions");
        assertThat(embeddingDim).isNotNull();
        assertThat(vectorType).contains("1536");
    }

    @Test
    @DisplayName("cleanDatabaseMigration_executesAllTwelveMigrationsFromV1ToLatest")
    void cleanDatabaseMigration_executesAllTwelveMigrationsFromV1ToLatest() {
        String dbName = "clean_migration_" + UUID.randomUUID().toString().replace("-", "");
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.h2.Driver");
        dataSource.setUrl("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
        dataSource.setUsername("sa");
        dataSource.setPassword("");

        Flyway cleanFlyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .placeholders(Map.of(
                        "vector-extension-init", "CREATE DOMAIN IF NOT EXISTS vector AS VARCHAR(10000);",
                        "hnsw-index-init", "CREATE INDEX IF NOT EXISTS idx_rag_emb_vector_idx ON rag_document_chunk_embeddings (embedding_model);",
                        "jsonb-type", "VARCHAR(10000)",
                        "vector-type", "vector",
                        "vector-store-indexes", "CREATE INDEX IF NOT EXISTS idx_ai_vector_store_dummy ON ai_vector_store (id);"
                ))
                .load();

        // Act: Run clean migration from scratch
        int migratedCount = cleanFlyway.migrate().migrationsExecuted;
        assertThat(migratedCount).isEqualTo(12);

        // Assert: All 12 migrations were applied successfully
        MigrationInfo[] applied = cleanFlyway.info().applied();
        assertThat(applied).hasSize(12);

        for (int i = 0; i < applied.length; i++) {
            MigrationInfo info = applied[i];
            assertThat(info.getState().isApplied())
                    .as("Migration V%s must be applied successfully", info.getVersion().getVersion())
                    .isTrue();
        }

        assertThat(cleanFlyway.info().current().getVersion().getVersion()).isEqualTo("12");
        assertThat(cleanFlyway.info().current().getDescription()).isEqualTo("spring ai vector store");
    }
}
