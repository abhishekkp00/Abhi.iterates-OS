package com.abhiiterates.os.analytics;

import com.abhiiterates.os.ai.*;
import com.abhiiterates.os.analytics.dto.*;
import com.abhiiterates.os.analytics.service.AnalyticsService;
import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.marketplace.*;
import com.abhiiterates.os.productivity.domain.*;
import com.abhiiterates.os.productivity.repository.CalendarEventRepository;
import com.abhiiterates.os.productivity.repository.TaskRepository;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AnalyticsIntegrationTest {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private MarketplaceListingRepository marketplaceListingRepository;

    @Autowired
    private AiConversationRepository aiConversationRepository;

    @Autowired
    private AiMessageRepository aiMessageRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = UserTestFactory.createRegularUser("analyticsUserA");
        userA = userRepository.save(userA);

        userB = UserTestFactory.createRegularUser("analyticsUserB");
        userB = userRepository.save(userB);
    }

    @Test
    @DisplayName("Analytics: Canonical Dashboard metrics & Tenant Isolation")
    void testDashboardAnalytics_realDataAndUserIsolation() {
        Instant now = Instant.now();

        // Seed data for User A
        Task task1 = Task.builder()
                .user(userA)
                .title("A's Completed Task")
                .status(TaskStatus.COMPLETED)
                .priority(TaskPriority.HIGH)
                .build();
        task1.setUpdatedAt(now);
        taskRepository.save(task1);

        Task task2 = Task.builder()
                .user(userA)
                .title("A's Todo Task")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.LOW)
                .build();
        taskRepository.save(task2);

        CalendarEvent event1 = CalendarEvent.builder()
                .user(userA)
                .title("Operating Systems Study")
                .startTime(now.minus(2, ChronoUnit.HOURS))
                .endTime(now)
                .build();
        calendarEventRepository.save(event1);

        MarketplaceListing listing1 = MarketplaceListing.builder()
                .seller(userA)
                .title("OS Textbook")
                .description("Good condition")
                .price(new BigDecimal("45.00"))
                .category(ListingCategory.BOOKS)
                .condition(ListingCondition.GOOD)
                .status(ListingStatus.ACTIVE)
                .build();
        listing1.setCreatedAt(now);
        marketplaceListingRepository.save(listing1);

        AiConversation conv1 = AiConversation.builder()
                .user(userA)
                .title("OS Concepts")
                .build();
        aiConversationRepository.save(conv1);

        AiMessage msg1 = AiMessage.builder()
                .conversation(conv1)
                .role(MessageRole.USER)
                .content("Explain semaphores")
                .tokenCount(15)
                .build();
        msg1.setCreatedAt(now);
        aiMessageRepository.save(msg1);

        AiMessage msg2 = AiMessage.builder()
                .conversation(conv1)
                .role(MessageRole.ASSISTANT)
                .content("A semaphore is a synchronization tool...")
                .tokenCount(120)
                .build();
        msg2.setCreatedAt(now);
        aiMessageRepository.save(msg2);

        // Seed data for User B
        Task bTask = Task.builder()
                .user(userB)
                .title("B's Task")
                .status(TaskStatus.COMPLETED)
                .priority(TaskPriority.MEDIUM)
                .build();
        bTask.setUpdatedAt(now);
        taskRepository.save(bTask);

        // 1. Check User A's Dashboard Analytics
        DashboardAnalyticsDto analyticsA = analyticsService.getDashboardAnalytics(userA, 7);
        assertThat(analyticsA.getCompletedTasks()).isEqualTo(1);
        assertThat(analyticsA.getTaskCompletionRate()).isEqualTo(50.0);
        assertThat(analyticsA.getTotalStudyHours()).isCloseTo(2.0, org.assertj.core.data.Offset.offset(0.1));
        assertThat(analyticsA.getTotalAiTokens()).isEqualTo(135L);
        assertThat(analyticsA.getActiveListings()).isEqualTo(1);
        assertThat(analyticsA.getStreak()).isGreaterThanOrEqualTo(1);

        // Verify deterministic behavior (No Math.random variance!)
        DashboardAnalyticsDto analyticsA2 = analyticsService.getDashboardAnalytics(userA, 7);
        assertThat(analyticsA2.getChartData().get(analyticsA2.getChartData().size() - 1).getAiTokens())
                .isEqualTo(analyticsA.getChartData().get(analyticsA.getChartData().size() - 1).getAiTokens());

        // 2. Check User B's Dashboard Analytics (User B MUST NOT inherit User A's data)
        DashboardAnalyticsDto analyticsB = analyticsService.getDashboardAnalytics(userB, 7);
        assertThat(analyticsB.getCompletedTasks()).isEqualTo(1);
        assertThat(analyticsB.getTaskCompletionRate()).isEqualTo(100.0);
        assertThat(analyticsB.getTotalStudyHours()).isEqualTo(0.0);
        assertThat(analyticsB.getTotalAiTokens()).isEqualTo(0L);
        assertThat(analyticsB.getActiveListings()).isEqualTo(0);
    }

    @Test
    @DisplayName("Analytics: Domain Analytics Endpoints (Productivity, AI, Resource, Marketplace)")
    void testDomainAnalytics_canonicalCalculations() {
        Instant now = Instant.now();

        // 1. Productivity Data
        Task taskHigh = Task.builder().user(userA).title("High").priority(TaskPriority.HIGH).status(TaskStatus.COMPLETED).build();
        taskHigh.setUpdatedAt(now);
        taskHigh.setCreatedAt(now);
        taskRepository.save(taskHigh);

        Task taskMed = Task.builder().user(userA).title("Med").priority(TaskPriority.MEDIUM).status(TaskStatus.IN_PROGRESS).build();
        taskMed.setCreatedAt(now);
        taskRepository.save(taskMed);

        ProductivityAnalyticsDto prod = analyticsService.getProductivityAnalytics(userA, 7);
        assertThat(prod.getTotalTasks()).isEqualTo(2);
        assertThat(prod.getCompletedTasks()).isEqualTo(1);
        assertThat(prod.getInProgressTasks()).isEqualTo(1);
        assertThat(prod.getHighPriorityTotal()).isEqualTo(1);
        assertThat(prod.getHighPriorityCompleted()).isEqualTo(1);

        // 2. Resource Data
        Resource res1 = Resource.builder()
                .user(userA)
                .title("Lecture Note 1")
                .category(ResourceCategory.LECTURE)
                .priority(com.abhiiterates.os.resource.ResourcePriority.MEDIUM)
                .status(com.abhiiterates.os.resource.ResourceStatus.ACTIVE)
                .build();
        res1.setCreatedAt(now);
        resourceRepository.save(res1);

        ResourceAnalyticsDto resAnalytics = analyticsService.getResourceAnalytics(userA, 7);
        assertThat(resAnalytics.getTotalResources()).isEqualTo(1);
        assertThat(resAnalytics.getTotalLectureNotes()).isEqualTo(1);
        assertThat(resAnalytics.getTotalBooks()).isEqualTo(0);

        // 3. AI Analytics
        AiConversation conv = AiConversation.builder().user(userA).title("AI Test").build();
        aiConversationRepository.save(conv);

        AiMessage userMsg = AiMessage.builder().conversation(conv).role(MessageRole.USER).content("Hi").tokenCount(5).build();
        userMsg.setCreatedAt(now);
        aiMessageRepository.save(userMsg);

        AiAnalyticsDto aiAnalytics = analyticsService.getAiAnalytics(userA, 7);
        assertThat(aiAnalytics.getTotalConversations()).isEqualTo(1);
        assertThat(aiAnalytics.getTotalQueries()).isEqualTo(1);
        assertThat(aiAnalytics.getTotalTokens()).isEqualTo(5L);

        // 4. Marketplace Analytics
        MarketplaceListing soldListing = MarketplaceListing.builder()
                .seller(userA)
                .title("Calculus Book")
                .description("Used")
                .price(new BigDecimal("30.00"))
                .category(ListingCategory.BOOKS)
                .condition(ListingCondition.GOOD)
                .status(ListingStatus.SOLD)
                .build();
        soldListing.setCreatedAt(now);
        soldListing.setUpdatedAt(now);
        marketplaceListingRepository.save(soldListing);

        MarketplaceAnalyticsDto mpAnalytics = analyticsService.getMarketplaceAnalytics(userA, 7);
        assertThat(mpAnalytics.getTotalListings()).isEqualTo(1);
        assertThat(mpAnalytics.getSoldListings()).isEqualTo(1);
        assertThat(mpAnalytics.getActiveListings()).isEqualTo(0);
        assertThat(mpAnalytics.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("30.00"));
    }
}
