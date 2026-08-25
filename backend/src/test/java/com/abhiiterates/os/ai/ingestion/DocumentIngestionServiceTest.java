package com.abhiiterates.os.ai.ingestion;

import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentChunkRepository;
import com.abhiiterates.os.ai.ingestion.repository.RagDocumentRepository;
import com.abhiiterates.os.ai.ingestion.service.DocumentIngestionService;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.user.dto.UserProfileDto;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.resource.AttachmentService;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.resource.ResourceStatus;
import com.abhiiterates.os.resource.dto.AttachmentResponse;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.cloudinary.cloud-name=",
        "app.cloudinary.api-key=",
        "app.cloudinary.api-secret="
})
class DocumentIngestionServiceTest {

    @Autowired
    private DocumentIngestionService ingestionService;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RagDocumentRepository ragDocumentRepository;

    @Autowired
    private RagDocumentChunkRepository ragDocumentChunkRepository;

    private User owner;
    private User otherUser;
    private Resource userResource;

    @BeforeEach
    void setUp() {
        String ownerEmail = "owner_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        UserProfileDto ownerResp = authService.registerUser(RegisterRequest.builder()
                .email(ownerEmail)
                .username("owner_" + UUID.randomUUID().toString().substring(0, 8))
                .password("Password123!")
                .firstName("Owner")
                .lastName("User")
                .build());
        owner = userRepository.findById(ownerResp.getId()).orElseThrow();

        String otherEmail = "other_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        UserProfileDto otherResp = authService.registerUser(RegisterRequest.builder()
                .email(otherEmail)
                .username("other_" + UUID.randomUUID().toString().substring(0, 8))
                .password("Password123!")
                .firstName("Other")
                .lastName("User")
                .build());
        otherUser = userRepository.findById(otherResp.getId()).orElseThrow();

        userResource = resourceRepository.save(Resource.builder()
                .title("Operating Systems Lecture Notes")
                .description("PDF study guide")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .user(owner)
                .build());
    }

    @Test
    @DisplayName("ingestAttachment_withValidPdf_completesSuccessfullyAndPersistsChunks")
    void ingestAttachment_withValidPdf_completesSuccessfullyAndPersistsChunks() throws IOException {
        byte[] pdfBytes = createPdf("Page 1: Operating Systems manage memory and CPU scheduling.", "Page 2: Deadlocks occur when processes wait indefinitely.");
        MockMultipartFile file = new MockMultipartFile("file", "os_lecture.pdf", "application/pdf", pdfBytes);

        AttachmentResponse attachment = attachmentService.upload(userResource.getId(), file, owner);

        IngestionResponse response = ingestionService.ingestAttachment(userResource.getId(), attachment.getId(), owner);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(IngestionStatus.COMPLETED);
        assertThat(response.pageCount()).isEqualTo(2);
        assertThat(response.chunkCount()).isGreaterThanOrEqualTo(2);
        assertThat(response.chunks()).isNotEmpty();
        assertThat(response.failureReason()).isNull();

        // Idempotency verification: Ingesting second time returns cached result
        IngestionResponse reingestResponse = ingestionService.ingestAttachment(userResource.getId(), attachment.getId(), owner);
        assertThat(reingestResponse.contentHash()).isEqualTo(response.contentHash());
        assertThat(reingestResponse.status()).isEqualTo(IngestionStatus.COMPLETED);
    }

    @Test
    @DisplayName("ingestAttachment_withUnownedResource_throwsResourceNotFoundException")
    void ingestAttachment_withUnownedResource_throwsResourceNotFoundException() throws IOException {
        byte[] pdfBytes = createPdf("Private study notes content.");
        MockMultipartFile file = new MockMultipartFile("file", "private.pdf", "application/pdf", pdfBytes);
        AttachmentResponse attachment = attachmentService.upload(userResource.getId(), file, owner);

        assertThatThrownBy(() -> ingestionService.ingestAttachment(userResource.getId(), attachment.getId(), otherUser))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("ingestAttachment_withCorruptedFile_setsStatusToFailed")
    void ingestAttachment_withCorruptedFile_setsStatusToFailed() {
        MockMultipartFile corruptFile = new MockMultipartFile("file", "corrupt.pdf", "application/pdf", "Not a real PDF stream".getBytes());
        AttachmentResponse attachment = attachmentService.upload(userResource.getId(), corruptFile, owner);

        IngestionResponse response = ingestionService.ingestAttachment(userResource.getId(), attachment.getId(), owner);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(IngestionStatus.FAILED);
        assertThat(response.failureReason()).isNotBlank();
    }

    private byte[] createPdf(String... pages) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            for (String text : pages) {
                PDPage page = new PDPage();
                doc.addPage(page);
                try (PDPageContentStream stream = new PDPageContentStream(doc, page)) {
                    stream.beginText();
                    stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    stream.newLineAtOffset(50, 700);
                    stream.showText(text);
                    stream.endText();
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }
}
