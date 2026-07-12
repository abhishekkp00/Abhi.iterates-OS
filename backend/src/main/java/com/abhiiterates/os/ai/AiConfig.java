package com.abhiiterates.os.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AiConfig — wires the Spring AI ChatClient bean.
 *
 * The ChatClient is provider-agnostic. Switching from OpenAI to Anthropic,
 * Gemini, or a local Ollama model requires only changing the starter
 * dependency + configuration properties — zero code changes here.
 *
 * Extension points (not implemented today — Day 11 scope):
 *  - Multiple ChatModel beans for provider fallback / load balancing
 *  - EmbeddingModel for RAG document search
 *  - Tool/function calling registry
 *  - Prompt template repository
 */
@Configuration
public class AiConfig {

    /**
     * Build a ChatClient from the auto-configured ChatModel.
     * Spring AI auto-configures the ChatModel bean based on which
     * starter is on the classpath (e.g. spring-ai-starter-model-openai).
     */
    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }
}
