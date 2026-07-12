package com.abhiiterates.os.ai;

import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {

    /** Paginated list of conversations for a user, sorted by updatedAt desc */
    Page<AiConversation> findByUserOrderByUpdatedAtDesc(User user, Pageable pageable);

    /** Fetch a conversation with all messages eagerly — avoids N+1 */
    @Query("""
        SELECT c FROM AiConversation c
        LEFT JOIN FETCH c.messages
        WHERE c.id = :id AND c.user = :user
    """)
    Optional<AiConversation> findByIdAndUserWithMessages(
            @Param("id") UUID id,
            @Param("user") User user
    );

    Optional<AiConversation> findByIdAndUser(UUID id, User user);

    long countByUser(User user);
}
