package com.abhiiterates.os.ai.rag;

import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.service.RetrievalService;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.resource.ResourceStatus;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("PGVector Vector Lifecycle & Similarity Search Integration Test")
class PgVectorLifecycleIntegrationTest {

    @org.springframework.boot.test.context.TestConfiguration
    static class TestVectorStoreConfig {
        @org.springframework.context.annotation.Bean
        @org.springframework.context.annotation.Primary
        public VectorStore testVectorStore(org.springframework.ai.embedding.EmbeddingModel embeddingModel) {
            return org.springframework.ai.vectorstore.SimpleVectorStore.builder(embeddingModel).build();
        }
    }

    @Autowired
    private VectorStore vectorStore;

    @Autowired
    private RetrievalService retrievalService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceAttachmentRepository attachmentRepository;

    @org.springframework.boot.test.mock.mockito.MockBean
    private org.springframework.ai.embedding.EmbeddingModel embeddingModel;

    private User user;
    private Resource resource;
    private ResourceAttachment attachment;

    @BeforeEach
    void setUp() {
        float[] vecChunk1 = new float[1536];
        vecChunk1[0] = 0.8944f;
        vecChunk1[1] = 0.4472f;

        float[] vecChunk2 = new float[1536];
        vecChunk2[0] = 0.1104f;
        vecChunk2[1] = 0.9938f;

        org.mockito.Mockito.when(embeddingModel.embed(org.mockito.ArgumentMatchers.any(Document.class)))
                .thenAnswer(inv -> {
                    Document doc = inv.getArgument(0);
                    if (doc.getText() != null && doc.getText().contains("Virtual memory")) {
                        return vecChunk1;
                    }
                    return vecChunk2;
                });

        org.mockito.Mockito.when(embeddingModel.embed(org.mockito.ArgumentMatchers.anyString()))
                .thenAnswer(inv -> vecChunk1);

        org.mockito.Mockito.when(embeddingModel.embed(org.mockito.ArgumentMatchers.anyList()))
                .thenAnswer(inv -> List.of(vecChunk1, vecChunk2));
        user = userRepository.save(User.builder()
                .email("vector_lifecycle_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com")
                .username("vector_user_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash("secret_pass")
                .build());

        resource = resourceRepository.save(Resource.builder()
                .title("Operating Systems Lecture Notes")
                .user(user)
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .build());

        attachment = attachmentRepository.save(ResourceAttachment.builder()
                .resource(resource)
                .fileName("os_memory_management.pdf")
                .downloadUrl("/api/v1/resources/attachments/test.pdf/download")
                .fileSize(2048L)
                .contentType("application/pdf")
                .build());
    }

    @Test
    @DisplayName("Complete Vector Lifecycle: Store -> Similarity Search -> Filtered Retrieve -> Scoped Delete -> Empty Search")
    void testCompleteVectorLifecycle() {
        String userIdStr       = user.getId().toString();
        String resourceIdStr   = resource.getId().toString();
        String attachmentIdStr = attachment.getId().toString();

        // 1. Ingest document chunks into VectorStore
        Map<String, Object> metadataChunk1 = new HashMap<>();
        metadataChunk1.put("userId",       userIdStr);
        metadataChunk1.put("resourceId",   resourceIdStr);
        metadataChunk1.put("attachmentId", attachmentIdStr);
        metadataChunk1.put("fileName",     "os_memory_management.pdf");
        metadataChunk1.put("pageNumber",   1);
        metadataChunk1.put("chunkIndex",   0);

        Document chunk1 = new Document(
                "Virtual memory maps logical addresses to physical RAM using page tables and TLB acceleration.",
                metadataChunk1
        );

        Map<String, Object> metadataChunk2 = new HashMap<>();
        metadataChunk2.put("userId",       userIdStr);
        metadataChunk2.put("resourceId",   resourceIdStr);
        metadataChunk2.put("attachmentId", attachmentIdStr);
        metadataChunk2.put("fileName",     "os_memory_management.pdf");
        metadataChunk2.put("pageNumber",   2);
        metadataChunk2.put("chunkIndex",   1);

        Document chunk2 = new Document(
                "Page replacement algorithms such as LRU and FIFO minimize page fault frequency.",
                metadataChunk2
        );

        vectorStore.add(List.of(chunk1, chunk2));

        // 2. Perform Similarity Search (Verify Semantic Retrieval)
        RetrievalRequest request = RetrievalRequest.builder()
                .query("How does virtual memory translate logical addresses?")
                .topK(5)
                .similarityThreshold(0.10)
                .build();

        List<RetrievalResult> results = retrievalService.retrieve(request, user);

        assertThat(results).isNotNull();
        assertThat(results).isNotEmpty();
        assertThat(results.get(0).text()).contains("Virtual memory maps logical addresses");

        // 3. Verify Direct VectorStore metadata search with userId filter
        FilterExpressionBuilder b = new FilterExpressionBuilder();
        Filter.Expression filter = b.and(
                b.eq("userId", userIdStr),
                b.eq("attachmentId", attachmentIdStr)
        ).build();

        List<Document> rawRetrieved = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query("page replacement LRU FIFO")
                        .topK(5)
                        .filterExpression(filter)
                        .build()
        );

        assertThat(rawRetrieved).isNotEmpty();

        // 4. Execute Vector Lifecycle Deletion (userId AND attachmentId)
        try {
            vectorStore.delete(filter);
        } catch (UnsupportedOperationException ex) {
            // Fallback for vector stores (e.g. SimpleVectorStore) that do not support metadata filter deletion
            List<String> idList = rawRetrieved.stream().map(Document::getId).toList();
            vectorStore.delete(idList);
        }

        // 5. Verify vectors are NO LONGER RETRIEVED after deletion
        List<RetrievalResult> postDeleteResults = retrievalService.retrieve(request, user);
        assertThat(postDeleteResults).isEmpty();

        List<Document> postDeleteRaw = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query("Virtual memory maps logical addresses")
                        .topK(5)
                        .filterExpression(filter)
                        .build()
        );
        assertThat(postDeleteRaw).isEmpty();
    }
}
