# Security Architecture & Vulnerability Reporting Policy

This document details the security posture, authentication protocols, role-based authorization controls, multi-tenant isolation safeguards, secret management policies, and vulnerability reporting procedures for AbhiIterates.OS.

---

## 1. Authentication & Session Security

- **JSON Web Tokens (JWT)**: Stateless authentication via HMAC-SHA256 tokens (`JwtTokenProvider`).
  - **Access Token Expiration**: Short-lived (15 minutes). Contains user email and granted roles.
  - **Refresh Token Expiration**: Long-lived (7 days). Stored in the database (`RefreshTokenRepository`) and tracked per active session (`UserSessionRepository`).
  - **Token Rotation & Revocation**: Refreshing a session revokes the spent token and issues a new token pair. Explicit logout immediately revokes the session token.
- **Password Security**: Passwords are hashed using BCrypt (`PasswordEncoder`) with a strength factor of 10. Raw passwords are never logged, stored in plaintext, or returned in API responses.

---

## 2. Server-Side Authorization & RBAC

All authorization logic is strictly enforced server-side via `@PreAuthorize` annotations and Spring Security configuration. Client-side UI guards are treated purely as UX helpers, not security boundaries.

### Role Hierarchy
1. **`ROLE_USER`**: Standard student user. Can access owned resources, tasks, AI tutor chat, marketplace listings, notifications, and personal analytics.
2. **`ROLE_CREATOR`**: Student content creator. Inherits `ROLE_USER` permissions plus content creation privileges.
3. **`ROLE_ADMIN`**: System administrator. Can access admin moderation dashboards (`/api/v1/admin/**`), review audit logs, toggle user status, manage listings, and moderate resources.
4. **`ROLE_SUPER_ADMIN`**: System owner. Reserved role required to modify system configuration settings (`PUT /api/v1/admin/settings`) or grant/revoke `ROLE_SUPER_ADMIN` status.

### Privilege Escalation & IDOR Protection
- Non-`SUPER_ADMIN` accounts attempting to grant `ROLE_SUPER_ADMIN` or modify a `SUPER_ADMIN` account are rejected with `403 Forbidden` (`AdminUserController`).
- Resource, task, and listing mutation endpoints enforce resource ownership checks (`resource.getUser().getId().equals(currentUser.getId())`). IDOR attempts return `403 Forbidden`.

---

## 3. RAG Multi-Tenant Data Isolation

- **Vector Metadata Filtering**: All document vector chunks stored in `ai_vector_store` are tagged with `userId` metadata (`Map.of("user_id", userId.toString(), ...)`).
- **Similarity Search Scoping**: Similarity queries execute with explicit metadata filter expressions:
  ```java
  new FilterExpressionBuilder().eq("user_id", currentUser.getId().toString()).build()
  ```
  This prevents cross-tenant document retrieval, ensuring User A can never query or extract context from User B's uploaded documents.
- **Cascade Deletion**: When a user or resource is deleted, associated vector embeddings in `ai_vector_store` are purged.

---

## 4. Secret Management & Fail-Fast Policies

- **Secret Key Isolation**: Sensitive provider credentials (`GROQ_API_KEY`, `OPENAI_API_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD`) exist strictly in backend environment variables and are never transmitted to the frontend bundle.
- **Fail-Fast Initialization**:
  - `JwtTokenProvider` validates `JWT_SECRET` presence and enforces a minimum key size of 256 bits (32 bytes).
  - `DatabaseSeeder` validates `ADMIN_EMAIL` and `ADMIN_PASSWORD` on startup, throwing an `IllegalStateException` if missing or blank.

---

## 5. Administrative Audit Logging

All sensitive administrative actions (`updateUserRoles`, `toggleUserStatus`, `deleteUser`, `updateResourceStatus`, `deleteResource`, `updateListingStatus`, `saveSettings`) generate structured audit records saved to `AuditLogRepository`:

- **Fields Logged**: `adminEmail`, `action`, `targetResourceId`, `details`, `ipAddress`, `timestamp`.

---

## 6. Vulnerability Reporting Process

If you discover a security vulnerability in AbhiIterates.OS:

1. **Do NOT open a public GitHub issue.**
2. Send a detailed report directly to security maintainers at `abhishekforcollege@gmail.com`.
3. Include proof-of-concept steps, affected endpoints, and potential impact.
4. Maintainers will respond within 48 hours to acknowledge the report and coordinate a fix.
