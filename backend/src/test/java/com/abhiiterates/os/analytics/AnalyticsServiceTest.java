package com.abhiiterates.os.analytics;

import com.abhiiterates.os.ai.AiConversationRepository;
import com.abhiiterates.os.ai.AiMessageRepository;
import com.abhiiterates.os.analytics.dto.DashboardAnalyticsDto;
import com.abhiiterates.os.analytics.service.AnalyticsService;
import com.abhiiterates.os.marketplace.MarketplaceListingRepository;
import com.abhiiterates.os.productivity.domain.CalendarEvent;
import com.abhiiterates.os.productivity.domain.Task;
import com.abhiiterates.os.productivity.domain.TaskStatus;
import com.abhiiterates.os.productivity.repository.CalendarEventRepository;
import com.abhiiterates.os.productivity.repository.TaskRepository;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AnalyticsServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private CalendarEventRepository calendarEventRepository;

    @Mock
    private AiConversationRepository aiConversationRepository;

    @Mock
    private AiMessageRepository aiMessageRepository;

    @Mock
    private MarketplaceListingRepository marketplaceListingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("student@example.com")
                .username("student")
                .build();
    }

    @Test
    @DisplayName("Streak Engine: Streak breaks and resets to 0 if no activity yesterday and today")
    void testCurrentStreakResetsToZeroWhenNoActivityForTwoDays() {
        Instant threeDaysAgo = Instant.now().minus(3, ChronoUnit.DAYS);

        Task oldTask = Task.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .title("Old Task")
                .status(TaskStatus.COMPLETED)
                .build();
        oldTask.setUpdatedAt(threeDaysAgo);

        when(taskRepository.findAllByUser(any(User.class))).thenReturn(List.of(oldTask));
        when(calendarEventRepository.findAllByUser(any(User.class))).thenReturn(List.of());

        DashboardAnalyticsDto analytics = analyticsService.getDashboardAnalytics(testUser, 7);

        assertEquals(0, analytics.getStreak(), "Streak must break and reset to 0 when user has no activity yesterday or today");
    }

    @Test
    @DisplayName("Streak Engine: Streak increments on consecutive daily completed activities")
    void testCurrentStreakIncrementsWithConsecutiveDailyActivity() {
        Instant today = Instant.now();
        Instant yesterday = Instant.now().minus(1, ChronoUnit.DAYS);

        Task taskToday = Task.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .title("Task Today")
                .status(TaskStatus.COMPLETED)
                .build();
        taskToday.setUpdatedAt(today);

        CalendarEvent eventYesterday = CalendarEvent.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .title("Study Event Yesterday")
                .startTime(yesterday)
                .endTime(yesterday.plus(1, ChronoUnit.HOURS))
                .build();

        when(taskRepository.findAllByUser(any(User.class))).thenReturn(List.of(taskToday));
        when(calendarEventRepository.findAllByUser(any(User.class))).thenReturn(List.of(eventYesterday));

        DashboardAnalyticsDto analytics = analyticsService.getDashboardAnalytics(testUser, 7);

        assertEquals(2, analytics.getStreak(), "Streak must accurately count 2 consecutive active days");
    }
}
