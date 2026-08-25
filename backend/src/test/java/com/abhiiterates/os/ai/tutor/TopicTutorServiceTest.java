package com.abhiiterates.os.ai.tutor;

import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.dto.TutorMode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for TutorMode enum and ChatRequest topic extensions.
 */
class TopicTutorServiceTest {

    @Test
    @DisplayName("TutorMode enum has all 5 controlled modes with non-empty descriptions")
    void tutorMode_allModesDefined() {
        assertThat(TutorMode.values()).hasSize(5);

        for (TutorMode mode : TutorMode.values()) {
            assertThat(mode.getDescription()).isNotBlank();
        }
    }

    @Test
    @DisplayName("ChatRequest backward compatibility constructor sets topicId and tutorMode to null")
    void chatRequest_backwardCompatibility() {
        ChatRequest legacy = new ChatRequest("conv-1", "Hello", "sys-1", "res-1");

        assertThat(legacy.conversationId()).isEqualTo("conv-1");
        assertThat(legacy.message()).isEqualTo("Hello");
        assertThat(legacy.systemPrompt()).isEqualTo("sys-1");
        assertThat(legacy.resourceId()).isEqualTo("res-1");
        assertThat(legacy.topicId()).isNull();
        assertThat(legacy.tutorMode()).isNull();
    }

    @Test
    @DisplayName("ChatRequest with topicId and tutorMode sets fields correctly")
    void chatRequest_topicFields() {
        ChatRequest request = new ChatRequest("conv-1", "Explain deadlocks", null, null, "topic-uuid", TutorMode.REVISION);

        assertThat(request.topicId()).isEqualTo("topic-uuid");
        assertThat(request.tutorMode()).isEqualTo(TutorMode.REVISION);
    }
}
