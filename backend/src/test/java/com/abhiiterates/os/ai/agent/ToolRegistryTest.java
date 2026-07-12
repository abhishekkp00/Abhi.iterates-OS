package com.abhiiterates.os.ai.agent;

import com.abhiiterates.os.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.context.support.GenericApplicationContext;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ToolRegistryTest {

    private ToolRegistry toolRegistry;
    private GenericApplicationContext applicationContext;
    private ObjectMapper objectMapper = new ObjectMapper();

    // Mock service class for testing
    static class MockAgentToolService {
        
        @AgentTool(name = "testSearch", description = "A test tool to search items.")
        public Map<String, Object> testSearch(
                @ToolParam(description = "The query string", required = true) String query,
                @ToolParam(description = "Optional page size", required = false) Integer limit,
                ExecutionContext context
        ) {
            return Map.of(
                "query", query,
                "limit", limit != null ? limit : 10,
                "user", context.getUser().getUsername()
            );
        }
    }

    @BeforeEach
    void setUp() {
        applicationContext = new GenericApplicationContext();
        applicationContext.registerBean("mockAgentToolService", MockAgentToolService.class);
        applicationContext.refresh();

        toolRegistry = new ToolRegistry();
        toolRegistry.setApplicationContext(applicationContext);
        toolRegistry.init();
    }

    @AfterEach
    void tearDown() {
        ToolRegistry.clearContext();
        applicationContext.close();
    }

    @Test
    void testToolDiscoveryAndSchemaGeneration() throws Exception {
        Map<String, ToolRegistry.ToolDefinitionHolder> tools = toolRegistry.getTools();
        assertThat(tools).containsKey("testSearch");

        ToolRegistry.ToolDefinitionHolder holder = tools.get("testSearch");
        assertThat(holder.getDefinition().description()).isEqualTo("A test tool to search items.");
        
        // Assert schema fields
        String schema = holder.getDefinition().inputSchema();
        var jsonSchema = objectMapper.readTree(schema);
        
        assertThat(jsonSchema.get("type").asText()).isEqualTo("object");
        assertThat(jsonSchema.get("properties").has("query")).isTrue();
        assertThat(jsonSchema.get("properties").get("query").get("type").asText()).isEqualTo("string");
        assertThat(jsonSchema.get("properties").get("query").get("description").asText()).isEqualTo("The query string");
        
        assertThat(jsonSchema.get("properties").has("limit")).isTrue();
        assertThat(jsonSchema.get("properties").get("limit").get("type").asText()).isEqualTo("number");
        
        // Assert required field list
        assertThat(jsonSchema.get("required").isArray()).isTrue();
        assertThat(jsonSchema.get("required").get(0).asText()).isEqualTo("query");
    }

    @Test
    void testToolExecutionWithContextPropagation() throws Exception {
        List<ToolCallback> callbacks = toolRegistry.getCallbacks();
        ToolCallback testSearchCallback = callbacks.stream()
                .filter(c -> c.getToolDefinition().name().equals("testSearch"))
                .findFirst()
                .orElseThrow();

        // 1. Set ExecutionContext
        User testUser = User.builder()
                .username("test_student")
                .email("student@test.com")
                .roles(Collections.emptySet())
                .active(true)
                .build();
                
        ExecutionContext context = ExecutionContext.builder()
                .user(testUser)
                .conversationId("conv-123")
                .build();
                
        ToolRegistry.setContext(context);

        // 2. Invoke tool callback with arguments
        String arguments = "{\"query\":\"math\",\"limit\":5}";
        String response = testSearchCallback.call(arguments);

        // 3. Verify tool response
        var responseNode = objectMapper.readTree(response);
        assertThat(responseNode.get("query").asText()).isEqualTo("math");
        assertThat(responseNode.get("limit").asInt()).isEqualTo(5);
        assertThat(responseNode.get("user").asText()).isEqualTo("test_student");
    }
}
