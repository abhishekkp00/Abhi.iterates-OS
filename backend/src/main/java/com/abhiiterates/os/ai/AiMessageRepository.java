package com.abhiiterates.os.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.abhiiterates.os.user.User;
import java.util.List;
import java.util.UUID;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, UUID> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    int countByConversationId(UUID conversationId);

    @Query("SELECT COALESCE(SUM(m.tokenCount), 0) FROM AiMessage m WHERE m.conversation.user = :user")
    long sumTokensByUser(@Param("user") User user);

    @Query("SELECT COUNT(m) FROM AiMessage m WHERE m.conversation.user = :user AND m.role = com.abhiiterates.os.ai.MessageRole.USER")
    long countQueriesByUser(@Param("user") User user);

    @Query("SELECT COUNT(m) FROM AiMessage m WHERE m.conversation.user = :user")
    long countTotalMessagesByUser(@Param("user") User user);

    @Query("SELECT m FROM AiMessage m WHERE m.conversation.user = :user")
    List<AiMessage> findAllMessagesByUser(@Param("user") User user);
}
