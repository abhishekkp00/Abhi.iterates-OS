package com.abhiiterates.os.ai.rag;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.ai.context.dto.AiContext;
import com.abhiiterates.os.ai.context.service.AiContextBuilder;
import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.embedding.service.DocumentEmbeddingService;
import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.domain.RagDocument;
import com.abhiiterates.os.ai.ingestion.domain.RagDocumentChunk;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalRequest;
import com.abhiiterates.os.ai.retrieval.dto.RetrievalResult;
import com.abhiiterates.os.ai.retrieval.service.RetrievalService;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
public class RagEvaluationTest {

    @MockBean
    private EmbeddingModel embeddingModel;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceAttachmentRepository attachmentRepository;

    @Autowired
    private RagDocumentRepository ragDocumentRepository;

    @Autowired
    private RagDocumentChunkRepository chunkRepository;

    @Autowired
    private DocumentEmbeddingService embeddingService;

    @Autowired
    private RetrievalService retrievalService;

    @Autowired
    private AiContextBuilder contextBuilder;

    private User userA;
    private User userB;
    private Subject subjectOS;
    private Topic topicPaging;
    private RagDocument docA;

    @BeforeEach
    void setUp() {
        when(embeddingModel.embed(anyString())).thenReturn(new float[1536]);

        chunkRepository.deleteAll();
        ragDocumentRepository.deleteAll();
        attachmentRepository.deleteAll();
        resourceRepository.deleteAll();
        topicRepository.deleteAll();
        subjectRepository.deleteAll();

        String suffixA = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest regReqA = RegisterRequest.builder()
                .email("student_a_" + suffixA + "@example.com")
                .username("student_a_" + suffixA)
                .password("Password123!")
                .firstName("Alice")
                .lastName("Student")
                .build();
        authService.registerUser(regReqA);
        userA = userRepository.findByEmail(regReqA.getEmail()).orElseThrow();

        String suffixB = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest regReqB = RegisterRequest.builder()
                .email("student_b_" + suffixB + "@example.com")
                .username("student_b_" + suffixB)
                .password("Password123!")
                .firstName("Bob")
                .lastName("Student")
                .build();
        authService.registerUser(regReqB);
        userB = userRepository.findByEmail(regReqB.getEmail()).orElseThrow();

        subjectOS = new Subject(null, userA, "Operating Systems", "CS301", "Core OS Concepts", "#4F46E5");
        subjectOS = subjectRepository.save(subjectOS);

        topicPaging = new Topic(null, subjectOS, "Virtual Memory & Paging", "Paging, TLB, Page Replacement", 10);
        topicPaging = topicRepository.save(topicPaging);

        Resource resA = Resource.builder()
                .user(userA)
                .subject(subjectOS)
                .topic(topicPaging)
                .title("OS Virtual Memory Notes")
                .description("Paging, Page Faults, and TLB Architecture")
                .category(com.abhiiterates.os.resource.ResourceCategory.LECTURE)
                .priority(com.abhiiterates.os.resource.ResourcePriority.MEDIUM)
                .status(com.abhiiterates.os.resource.ResourceStatus.ACTIVE)
                .build();
        resA = resourceRepository.save(resA);

        ResourceAttachment attA = ResourceAttachment.builder()
                .resource(resA)
                .fileName("Operating Systems - Paging & Virtual Memory Notes.pdf")
                .fileSize(1024L * 50)
                .contentType("application/pdf")
                .downloadUrl("http://localhost/os_paging.pdf")
                .build();
        attA = attachmentRepository.save(attA);

        docA = RagDocument.builder()
                .resource(resA)
                .attachment(attA)
                .fileName(attA.getFileName())
                .contentType(attA.getContentType())
                .contentHash("hash_paging_v1")
                .pageCount(10)
                .chunkCount(2)
                .status(IngestionStatus.COMPLETED)
                .build();
        docA = ragDocumentRepository.save(docA);

        RagDocumentChunk chunk1 = RagDocumentChunk.builder()
                .document(docA)
                .chunkIndex(0)
                .chunkText("Virtual memory isolates address spaces. Translation Lookaside Buffer (TLB) caches page table entries to accelerate virtual to physical address resolution.")
                .charCount(140)
                .pageNumber(1)
                .startPage(1)
                .endPage(1)
                .build();
        chunkRepository.save(chunk1);

        RagDocumentChunk chunk2 = RagDocumentChunk.builder()
                .document(docA)
                .chunkIndex(1)
                .chunkText("A page fault occurs when a process accesses a page not present in main memory. The OS handles page faults by loading the missing frame from secondary storage.")
                .charCount(165)
                .pageNumber(2)
                .startPage(2)
                .endPage(2)
                .build();
        chunkRepository.save(chunk2);

        // Generate embeddings for User A's chunks
        embeddingService.generateEmbeddingsForDocument(resA.getId(), attA.getId(), userA);
    }

    @Test
    @DisplayName("RAG Quality: Retrieval finds relevant source chunks for technical query")
    void testRetrievalFindsRelevantChunks() {
        RetrievalRequest request = RetrievalRequest.builder()
                .query("How does Translation Lookaside Buffer TLB speed up address translation?")
                .topK(3)
                .similarityThreshold(0.30)
                .build();

        List<RetrievalResult> results = retrievalService.retrieve(request, userA);

        assertNotNull(results);
        assertFalse(results.isEmpty(), "Retrieval should return at least 1 relevant chunk");
        assertTrue(results.get(0).text().contains("Translation Lookaside Buffer"), "Top retrieved chunk must contain TLB material");
    }

    @Test
    @DisplayName("RAG Quality: User Isolation - User B cannot retrieve User A's private documents")
    void testCrossUserRetrievalIsolation() {
        RetrievalRequest request = RetrievalRequest.builder()
                .query("Virtual memory isolates address spaces TLB page table")
                .topK(5)
                .similarityThreshold(0.10)
                .build();

        // Query executed under User B's security context
        List<RetrievalResult> userBResults = retrievalService.retrieve(request, userB);

        assertNotNull(userBResults);
        assertTrue(userBResults.isEmpty(), "User B must receive 0 chunks from User A's private document corpus");
    }

    @Test
    @DisplayName("RAG Quality: Abstention on Out-of-Corpus Query")
    void testAbstentionOnOutofCorpusQuery() {
        RetrievalRequest request = RetrievalRequest.builder()
                .query("Who won the 2018 FIFA World Cup in Russia?")
                .topK(3)
                .similarityThreshold(0.75) // High similarity threshold for non-matching corpus
                .build();

        List<RetrievalResult> results = retrievalService.retrieve(request, userA);

        assertTrue(results.isEmpty(), "Out-of-corpus query must return 0 hits under strict similarity threshold, triggering abstention");
    }

    @Test
    @DisplayName("RAG Quality: Prompt Injection Safety Boundary - Document content wrapped in untrusted data tags")
    void testPromptInjectionSafetyBoundary() {
        ChatRequest chatReq = new ChatRequest(null, "Explain virtual memory paging", null, null, topicPaging.getId().toString(), null);

        AiContext ragContext = contextBuilder.buildContext(chatReq, userA);

        assertNotNull(ragContext);
        assertNotNull(ragContext.formattedText());
        assertTrue(ragContext.formattedText().contains("<academic_context>"), "Context must be bounded by <academic_context> tags");
        assertTrue(ragContext.formattedText().contains("UNTRUSTED DATA"), "Context must contain UNTRUSTED DATA security notice");
    }
}
