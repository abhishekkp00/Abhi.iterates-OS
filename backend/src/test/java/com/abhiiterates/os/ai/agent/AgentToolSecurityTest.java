package com.abhiiterates.os.ai.agent;

import com.abhiiterates.os.ai.agent.tools.AgentToolsService;
import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceAttachment;
import com.abhiiterates.os.resource.ResourceAttachmentRepository;
import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.resource.ResourceStatus;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AgentToolSecurityTest {

    @Autowired
    private ToolRegistry toolRegistry;

    @Autowired
    private AgentToolsService agentToolsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceAttachmentRepository attachmentRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = userRepository.save(UserTestFactory.createRegularUser("toolUserA"));
        userB = userRepository.save(UserTestFactory.createRegularUser("toolUserB"));

        // User A resource + attachment
        Resource resourceA = resourceRepository.save(Resource.builder()
                .title("User A Operating Systems Lecture")
                .description("Processes and Threading")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .user(userA)
                .build());

        attachmentRepository.save(ResourceAttachment.builder()
                .fileName("os_lecture_1.pdf")
                .fileSize(1024L)
                .contentType("application/pdf")
                .downloadUrl("http://example.com/attachments/os_lecture_1.pdf/download")
                .resource(resourceA)
                .build());

        // User B resource + attachment
        Resource resourceB = resourceRepository.save(Resource.builder()
                .title("User B Secret Exam Paper")
                .description("Operating Systems confidential solution")
                .category(ResourceCategory.PAST_PAPER)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .user(userB)
                .build());

        attachmentRepository.save(ResourceAttachment.builder()
                .fileName("secret_exam.pdf")
                .fileSize(2048L)
                .contentType("application/pdf")
                .downloadUrl("http://example.com/attachments/secret_exam.pdf/download")
                .resource(resourceB)
                .build());
    }

    @AfterEach
    void tearDown() {
        ToolRegistry.clearContext();
    }

    @Test
    void toolDiscovery_registersAnnotatedTools() {
        Map<String, ToolRegistry.ToolDefinitionHolder> tools = toolRegistry.getTools();

        assertThat(tools).containsKey("searchResources");
        assertThat(tools).containsKey("searchMarketplace");
        assertThat(tools).containsKey("searchKnowledgeBase");
        assertThat(tools).containsKey("getCurrentProfile");
        assertThat(tools).containsKey("getDashboardSummary");
    }

    @Test
    void searchResources_tool_respectsUserContextIsolation() {
        // Set User A context
        ExecutionContext contextA = ExecutionContext.builder().user(userA).build();
        List<Map<String, Object>> resultsA = agentToolsService.searchResources("Operating Systems", contextA);
        assertThat(resultsA).hasSize(1);
        assertThat(resultsA.get(0).get("title")).isEqualTo("User A Operating Systems Lecture");

        // Set User B context
        ExecutionContext contextB = ExecutionContext.builder().user(userB).build();
        List<Map<String, Object>> resultsB = agentToolsService.searchResources("Operating Systems", contextB);
        assertThat(resultsB).hasSize(1);
        assertThat(resultsB.get(0).get("title")).isEqualTo("User B Secret Exam Paper");
    }

    @Test
    void searchKnowledgeBase_tool_scopesAttachmentQueryToAuthenticatedUserAtDbLevel() {
        // User A executes tool searching for PDF
        ExecutionContext contextA = ExecutionContext.builder().user(userA).build();
        List<Map<String, Object>> resultsA = agentToolsService.searchKnowledgeBase("exam", contextA);

        // User A must NOT see User B's secret_exam.pdf
        assertThat(resultsA).isEmpty();

        // User A searches for lecture
        List<Map<String, Object>> lectureResultsA = agentToolsService.searchKnowledgeBase("lecture", contextA);
        assertThat(lectureResultsA).hasSize(1);
        assertThat(lectureResultsA.get(0).get("fileName")).isEqualTo("os_lecture_1.pdf");
    }

    @Test
    void getCurrentProfile_tool_returnsContextUserInformation() {
        ExecutionContext contextA = ExecutionContext.builder().user(userA).build();

        Map<String, Object> profile = agentToolsService.getCurrentProfile(contextA);

        assertThat(profile.get("username")).isEqualTo(userA.getUsername());
        assertThat(profile.get("email")).isEqualTo(userA.getEmail());
    }
}
