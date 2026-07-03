package com.abhiiterates.os.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger / OpenAPI Specification Configuration.
 */
@Configuration
public class OpenApiConfig {

    @Value("${openapi.server-url:http://localhost:8080}")
    private String serverUrl;

    @Bean
    public OpenAPI customOpenAPI() {
        Contact contact = new Contact();
        contact.setName("AbhiIterates Support Team");
        contact.setEmail("support@abhiiterates.com");
        contact.setUrl("https://abhiiterates.com");

        Info info = new Info()
                .title("AbhiIterates.OS API Foundation")
                .version("1.0.0")
                .description("Production-ready API blueprints for the AbhiIterates.OS Student Workspace Platform. Includes library resources, marketplace, and AI workspaces.")
                .contact(contact);

        Server localServer = new Server();
        localServer.setUrl(serverUrl);
        localServer.setDescription("Environment Server URL");

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer));
    }
}
