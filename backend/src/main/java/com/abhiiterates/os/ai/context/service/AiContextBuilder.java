package com.abhiiterates.os.ai.context.service;

import com.abhiiterates.os.ai.context.dto.AiContext;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.user.User;

public interface AiContextBuilder {

    AiContext buildContext(ChatRequest request, User currentUser);
}
