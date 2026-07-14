package com.abhiiterates.os.ai.agent;

import com.abhiiterates.os.user.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExecutionContext {
    private final User user;
    private final String conversationId;
    private final ToolExecutionListener listener;

    public interface ToolExecutionListener {
        void onToolStarted(String toolName, String arguments);
        void onToolCompleted(String toolName, String result);
    }
}
