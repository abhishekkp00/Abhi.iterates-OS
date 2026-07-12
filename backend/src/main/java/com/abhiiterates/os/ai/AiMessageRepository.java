package com.abhiiterates.os.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, UUID> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    int countByConversationId(UUID conversationId);
}
