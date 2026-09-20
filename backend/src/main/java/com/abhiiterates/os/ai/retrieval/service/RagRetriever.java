package com.abhiiterates.os.ai.retrieval.service;

import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.user.User;
import org.springframework.ai.document.Document;

import java.util.List;

/**
 * Dedicated RagRetriever abstraction executing semantic vector retrieval
 * via official Spring AI VectorStore APIs.
 */
public interface RagRetriever {

    /**
     * Executes semantic RAG retrieval returning Spring AI {@link Document} objects with metadata intact.
     * Always applies mandatory user-scoped security filters.
     */
    List<Document> retrieveDocuments(RetrievalRequest request, User currentUser);
}
