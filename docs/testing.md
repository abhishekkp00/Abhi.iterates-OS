# Test Strategy, Suite Architecture & Matrix

This document outlines the testing architecture, test coverage, and validation matrix for **Abhi.iterates-OS**.

---

## Testing Strategy & Test Pyramid

```
                       ┌───────────────────────┐
                       │     E2E Workflow      │
                       │    Integration Test   │
                       │ (1 Closed-Loop Suite) │
                       └───────────┬───────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │    Integration Tests      │
                     │  (Controller, Repository, │
                     │   IDOR, Security Suites)  │
                     └─────────────┬─────────────┘
                                   │
       ┌───────────────────────────┴───────────────────────────┐
       │                       Unit Tests                      │
       │ (Phase Engines, Priority Calculators, Domain DTOs)    │
       └───────────────────────────────────────────────────────┘
```

---

## Key Test Suite Breakdown

### 1. Primary Closed-Loop End-to-End Test (`UserWorkflowIntegrationTest.java`)
- **Location**: `backend/src/test/java/com/abhiiterates/os/workflow/UserWorkflowIntegrationTest.java`
- **Purpose**: Validates the end-to-end user workflow sequence in a single transactional Spring Boot test environment:
  $$\text{User Registration} \rightarrow \text{Subject/Topic Creation} \rightarrow \text{Exam Definition} \rightarrow \text{Adaptive Study Plan} \rightarrow \text{Study Session Execution} \rightarrow \text{Assessment Attempt Submission} \rightarrow \text{Factual Exam Coverage Verification}$$

### 2. IDOR & Security Isolation Tests (`IdorSecurityIntegrationTest.java`)
- **Location**: `backend/src/test/java/com/abhiiterates/os/security/IdorSecurityIntegrationTest.java`
- **Purpose**: Verifies that User A cannot read, update, complete, or delete User B's subjects, topics, exams, study plans, study sessions, assessments, or uploaded resources.

### 3. Exam & Planner Engine Unit Tests (`ExamPhaseEngineTest.java`, `ExamCoverageServiceTest.java`)
- **Location**: `backend/src/test/java/com/abhiiterates/os/academic/`
- **Purpose**: Deterministic unit test coverage for exam phase date calculations, non-linear priority weights, and factual coverage percentages without requiring a database.

---

## Verification Test Matrix

| Area | Suite / Test Class | Scope | Verification Status |
| :--- | :--- | :--- | :--- |
| **Auth & Security** | `AuthServiceImplTest.java` | JWT token generation & password hashing | **PASSED** |
| **IDOR Protection** | `IdorSecurityIntegrationTest.java` | Cross-user data isolation across 8 domains | **PASSED** |
| **Academic Domain** | `AcademicDashboardIntegrationTest.java` | Dashboard aggregation & date boundaries | **PASSED** |
| **Exam Engine** | `ExamPhaseEngineTest.java` | Proximity date-based phase calculation | **PASSED** |
| **Exam Coverage** | `ExamCoverageServiceTest.java` | Non-predictive study/assessment coverage | **PASSED** |
| **Adaptive Planner** | `ExamAwarePlannerIntegrationTest.java` | Exam-linked session priority scheduling | **PASSED** |
| **Learning Engine** | `AdaptiveLearningEngineIntegrationTest.java` | Dynamic replanning on mastery state change | **PASSED** |
| **Assessment Engine** | `AiAssessmentControllerIntegrationTest.java` | Assessment generation & attempt scoring | **PASSED** |
| **Resource Ownership** | `ResourceOwnershipIntegrationTest.java` | Resource file upload & retrieval ownership | **PASSED** |
| **Primary Closed Loop**| `UserWorkflowIntegrationTest.java` | Full primary closed-loop integration pass | **PASSED** |
| **Frontend Compilation**| `npm run build` | TypeScript static typing & bundle production | **PASSED** |

---

## Automated Test Command Execution

- **Backend Unit & Integration Tests**:
  ```bash
  cd backend
  mvn clean test
  ```
  *(Result: 236 Tests Run, 0 Failures, 0 Errors, 0 Skipped)*

- **Frontend Type-Check & Production Build**:
  ```bash
  cd frontend
  npm run build
  ```
  *(Result: Clean production build built in ~6.4s with 0 errors)*
