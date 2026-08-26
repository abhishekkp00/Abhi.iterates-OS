package com.abhiiterates.os.security;

import com.abhiiterates.os.resource.AttachmentService;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceStatus;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class FileUploadSecurityTest {

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    private User testUser;
    private Resource testResource;

    @BeforeEach
    void setUp() {
        resourceRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        testUser = userRepository.save(User.builder()
                .email("file_sec_" + suffix + "@example.com")
                .username("file_sec_" + suffix)
                .passwordHash("HashPass123!")
                .firstName("File")
                .lastName("Sec")
                .build());

        testResource = resourceRepository.save(Resource.builder()
                .user(testUser)
                .title("File Upload Test Resource")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.MEDIUM)
                .status(ResourceStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Filename with path traversal sequence ('../') is strictly rejected")
    void uploadFile_pathTraversal_rejected() {
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file",
                "../../../../etc/passwd",
                "text/plain",
                "root:x:0:0:root:/root:/bin/bash".getBytes()
        );

        assertThatThrownBy(() -> attachmentService.upload(testResource.getId(), maliciousFile, testUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("invalid path sequence");
    }

    @Test
    @DisplayName("Uploading executable file extension (.exe) is strictly rejected")
    void uploadFile_executableExtension_rejected() {
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                "MZ...".getBytes()
        );

        assertThatThrownBy(() -> attachmentService.upload(testResource.getId(), maliciousFile, testUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not permitted for upload");
    }

    @Test
    @DisplayName("Uploading JSP script file (.jsp) is strictly rejected")
    void uploadFile_jspExtension_rejected() {
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file",
                "webshell.jsp",
                "application/x-jsp",
                "<% Runtime.getRuntime().exec(request.getParameter(\"cmd\")); %>".getBytes()
        );

        assertThatThrownBy(() -> attachmentService.upload(testResource.getId(), maliciousFile, testUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not permitted for upload");
    }
}
