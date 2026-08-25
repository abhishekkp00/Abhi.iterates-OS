package com.abhiiterates.os.ai;

import com.abhiiterates.os.ai.agent.ToolRegistry;
import com.abhiiterates.os.ai.context.dto.AiContext;
import com.abhiiterates.os.ai.context.dto.ContextSource;
import com.abhiiterates.os.ai.context.service.AiContextBuilder;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.dto.MessageResponse;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiChatServiceImplRAGTest {

    @Mock
    private AiConversationRepository conversationRepository;
    @Mock
    private AiMessageRepository messageRepository;
    @Mock
    private AiProperties aiProperties;
    @Mock
    private ChatClient chatClient;
    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;
    @Mock
    private ChatClient.CallResponseSpec callResponseSpec;
    @Mock
    private ToolRegistry toolRegistry;
    @Mock
    private AiContextBuilder contextBuilder;

    @InjectMocks
    private AiChatServiceImpl aiChatService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(UUID.randomUUID()).email("user@example.com").build();
        when(aiProperties.getSystemPrompt()).thenReturn("You are a helpful academic AI assistant.");

        when(conversationRepository.save(any(AiConversation.class)))
                .thenAnswer(inv -> {
                    AiConversation c = inv.getArgument(0);
                    if (c.getId() == null) c.setId(UUID.randomUUID());
                    return c;
                });
        when(messageRepository.save(any(AiMessage.class)))
                .thenAnswer(inv -> {
                    AiMessage m = inv.getArgument(0);
                    if (m.getId() == null) m.setId(UUID.randomUUID());
                    return m;
                });

        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.messages(anyList())).thenReturn(requestSpec);
        when(requestSpec.toolCallbacks(anyList())).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(callResponseSpec);
    }

    @Test
    @DisplayName("chat with RAG context injects academic context into system prompt")
    @SuppressWarnings("unchecked")
    void chat_withRAGContext_injectsAcademicContextIntoSystemPrompt() {
        ContextSource source = ContextSource.builder()
                .chunkId(UUID.randomUUID())
                .title("OS Notes")
                .filename("os.pdf")
                .pageNumber(1)
                .similarityScore(0.90)
                .build();

        AiContext ragContext = AiContext.builder()
                .formattedText("<academic_context>Deadlock occurs when processes wait.</academic_context>")
                .sources(List.of(source))
                .retrievedChunkCount(1)
                .build();

        ChatRequest request = new ChatRequest(null, "What is deadlock?", null, UUID.randomUUID().toString());
        when(contextBuilder.buildContext(request, testUser)).thenReturn(ragContext);
        when(callResponseSpec.content()).thenReturn("Deadlock occurs when processes wait indefinitely.");

        MessageResponse response = aiChatService.chat(request, testUser);

        assertThat(response).isNotNull();
        assertThat(response.content()).contains("Deadlock occurs");
        assertThat(response.sources()).hasSize(1);
        assertThat(response.sources().get(0).title()).isEqualTo("OS Notes");

        ArgumentCaptor<List<Message>> captor = ArgumentCaptor.forClass(List.class);
        verify(requestSpec).messages(captor.capture());

        List<Message> messages = captor.getValue();
        assertThat(messages).isNotEmpty();
        Message sysMsg = messages.get(0);
        assertThat(sysMsg).isInstanceOf(SystemMessage.class);
        assertThat(sysMsg.getText()).contains("<academic_context>");
    }

    @Test
    @DisplayName("chat when retrieval returns empty context succeeds without fake sources")
    @SuppressWarnings("unchecked")
    void chat_whenRetrievalReturnsEmpty_succeedsWithoutFakeSources() {
        when(contextBuilder.buildContext(any(), any())).thenReturn(AiContext.empty());
        when(callResponseSpec.content()).thenReturn("Hello! How can I help you?");

        ChatRequest request = new ChatRequest(null, "Hello", null, null);
        MessageResponse response = aiChatService.chat(request, testUser);

        assertThat(response).isNotNull();
        assertThat(response.content()).isEqualTo("Hello! How can I help you?");
        assertThat(response.sources()).isEmpty();

        ArgumentCaptor<List<Message>> captor = ArgumentCaptor.forClass(List.class);
        verify(requestSpec).messages(captor.capture());

        List<Message> messages = captor.getValue();
        assertThat(messages).isNotEmpty();
        Message sysMsg = messages.get(0);
        assertThat(sysMsg).isInstanceOf(SystemMessage.class);
        assertThat(sysMsg.getText()).doesNotContain("<academic_context>");
    }
}
