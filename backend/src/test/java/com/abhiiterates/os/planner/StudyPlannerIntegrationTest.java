package com.abhiiterates.os.planner;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.exception.BadRequestException;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.planner.dto.GeneratePlanRequest;
import com.abhiiterates.os.planner.dto.StudyPlanResponse;
import com.abhiiterates.os.planner.dto.StudyPlanSummaryResponse;
import com.abhiiterates.os.planner.service.StudyPlannerService;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for the Adaptive Study Planner.
 * Verifies: IDOR protection, plan lifecycle state machine, and single-active-plan invariant.
 *
 * Uses @Transactional to roll back all DB writes between tests.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StudyPlannerIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private SubjectRepository subjectRepository;
    @Autowired private TopicRepository topicRepository;
    @Autowired private StudyPlannerService plannerService;

    private User userA;
    private User userB;
    private Subject subjectA;
    private Topic topicA;

    @BeforeEach
    void setUp() {
        // Create two isolated users
        userA = createUser("planner-test-a@test.com");
        userB = createUser("planner-test-b@test.com");

        // Give userA a subject with a topic
        subjectA = subjectRepository.save(Subject.builder()
            .user(userA).name("Planner Test Subject").color("#3B82F6").build());
        topicA = topicRepository.save(Topic.builder()
            .subject(subjectA).name("Planner Test Topic").orderIndex(1).build());
    }

    // ── Plan Lifecycle Tests ──────────────────────────────────────────────────

    @Test
    @DisplayName("Preview plan: returns response with null ID (not persisted)")
    void previewPlan_returnsNullId() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        StudyPlanResponse response = plannerService.previewPlan(req, userA);

        assertThat(response).isNotNull();
        assertThat(response.id()).isNull();  // preview = not persisted
        assertThat(response.status()).isEqualTo(StudyPlanStatus.DRAFT);
    }

    @Test
    @DisplayName("Save draft plan: persisted with a real ID and DRAFT status")
    void saveDraftPlan_persistedWithDraftStatus() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        StudyPlanResponse response = plannerService.saveDraftPlan(req, userA);

        assertThat(response.id()).isNotNull();
        assertThat(response.status()).isEqualTo(StudyPlanStatus.DRAFT);
    }

    @Test
    @DisplayName("Activate DRAFT plan → status becomes ACTIVE")
    void activatePlan_draftBecomesActive() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        StudyPlanResponse draft = plannerService.saveDraftPlan(req, userA);

        StudyPlanResponse active = plannerService.activatePlan(draft.id(), userA);

        assertThat(active.status()).isEqualTo(StudyPlanStatus.ACTIVE);
    }

    @Test
    @DisplayName("Activating a second plan auto-expires the first ACTIVE plan")
    void activateSecondPlan_firstPlanBecomeExpired() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);

        // Create and activate first plan
        StudyPlanResponse first = plannerService.saveDraftPlan(req, userA);
        plannerService.activatePlan(first.id(), userA);

        // Create and activate second plan
        StudyPlanResponse second = plannerService.saveDraftPlan(req, userA);
        plannerService.activatePlan(second.id(), userA);

        // First plan should now be EXPIRED
        StudyPlanResponse firstNow = plannerService.getPlan(first.id(), userA);
        StudyPlanResponse secondNow = plannerService.getPlan(second.id(), userA);

        assertThat(firstNow.status()).isEqualTo(StudyPlanStatus.EXPIRED);
        assertThat(secondNow.status()).isEqualTo(StudyPlanStatus.ACTIVE);
    }

    @Test
    @DisplayName("Cannot activate a plan that is already ACTIVE")
    void activateActivePlan_throwsBadRequest() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        StudyPlanResponse draft = plannerService.saveDraftPlan(req, userA);
        plannerService.activatePlan(draft.id(), userA);

        // Try to activate it again (it's now ACTIVE, not DRAFT)
        assertThatThrownBy(() -> plannerService.activatePlan(draft.id(), userA))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("DRAFT");
    }

    @Test
    @DisplayName("Expire a plan: ACTIVE plan becomes EXPIRED")
    void expirePlan_activeBecomesExpired() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        StudyPlanResponse draft = plannerService.saveDraftPlan(req, userA);
        plannerService.activatePlan(draft.id(), userA);

        StudyPlanResponse expired = plannerService.expirePlan(draft.id(), userA);
        assertThat(expired.status()).isEqualTo(StudyPlanStatus.EXPIRED);
    }

    @Test
    @DisplayName("Get all user plans returns correct list")
    void getUserPlans_returnsAllUserPlans() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        plannerService.saveDraftPlan(req, userA);
        plannerService.saveDraftPlan(req, userA);

        List<StudyPlanSummaryResponse> plans = plannerService.getUserPlans(userA);
        assertThat(plans).hasSizeGreaterThanOrEqualTo(2);
    }

    // ── IDOR Protection Tests ─────────────────────────────────────────────────

    @Test
    @DisplayName("IDOR: User B cannot access User A's plan")
    void idor_userBCannotAccessUserAsPlan() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        StudyPlanResponse userAPlan = plannerService.saveDraftPlan(req, userA);

        // User B tries to access User A's plan
        assertThatThrownBy(() -> plannerService.getPlan(userAPlan.id(), userB))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("IDOR: User B cannot activate User A's plan")
    void idor_userBCannotActivateUserAsPlan() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        StudyPlanResponse userAPlan = plannerService.saveDraftPlan(req, userA);

        assertThatThrownBy(() -> plannerService.activatePlan(userAPlan.id(), userB))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("User B's plans do not include User A's plans")
    void getUserPlans_userBSeesOnlyOwnPlans() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);

        // Only userA has topics/plans
        plannerService.saveDraftPlan(req, userA);

        // userB has no topics → expect BadRequest (no topics)
        List<StudyPlanSummaryResponse> userBPlans = plannerService.getUserPlans(userB);
        assertThat(userBPlans).isEmpty();
    }

    @Test
    @DisplayName("No topics → previewPlan throws BadRequestException")
    void previewPlan_noTopics_throws() {
        GeneratePlanRequest req = new GeneratePlanRequest(120, 45, 7);
        // userB has no topics
        assertThatThrownBy(() -> plannerService.previewPlan(req, userB))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("No topics");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper factories
    // ─────────────────────────────────────────────────────────────────────────

    private User createUser(String email) {
        String username = email.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 4);
        return userRepository.save(User.builder()
            .email(email)
            .username(username)
            .firstName("Test")
            .lastName("User")
            .passwordHash("$2a$10$test")
            .emailVerified(true)
            .build());
    }
}
