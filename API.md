# REST API Reference & Specification

AbhiIterates.OS exposes a RESTful HTTP API for frontend applications and external integrations.

- **Base URL**: `/api/v1`
- **Protocol**: HTTP/1.1 over TLS (Production)
- **Data Format**: JSON (`application/json`)
- **Streaming Format**: Server-Sent Events (`text/event-stream`)

---

## Standardized Response Schema

All API responses return a standardized `ApiResponse<T>` wrapper object.

### Success Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-09-29T16:00:00.000Z"
}
```

### Error Response Format (`ApiErrorResponse`)
```json
{
  "success": false,
  "message": "Resource not found with ID: 7a420798-f4c5-4fe3-8a81-88550ef64295",
  "errorCode": "RESOURCE_NOT_FOUND",
  "status": 404,
  "timestamp": "2026-09-29T16:00:00.000Z",
  "errors": null
}
```

---

## Authentication Endpoints (`/api/v1/auth`)

| Endpoint | Method | Headers / Payload | Description | Access |
|---|---|---|---|---|
| `/api/v1/auth/register` | `POST` | `RegisterRequest` | Register new student user | Public |
| `/api/v1/auth/login` | `POST` | `LoginRequest` | Authenticate & return access/refresh tokens | Public |
| `/api/v1/auth/refresh` | `POST` | `RefreshTokenRequest` | Rotate tokens & issue new access token | Public |
| `/api/v1/auth/logout` | `POST` | `Authorization: Bearer <token>` | Revoke current user session token | Authenticated |
| `/api/v1/auth/google` | `POST` | `GoogleAuthRequest` | Authenticate via Google OAuth2 ID token | Public |

---

## Resource & Library Endpoints (`/api/v1/resources`)

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/v1/resources` | `GET` | List/search resources with pagination & filtering | Authenticated |
| `/api/v1/resources` | `POST` | Upload new academic resource file & metadata | Authenticated |
| `/api/v1/resources/{id}` | `GET` | Get resource details and preview URL | Authenticated |
| `/api/v1/resources/{id}` | `PUT` | Update resource title, description, category, topic | Owner / Admin |
| `/api/v1/resources/{id}` | `DELETE` | Soft-delete resource (`ResourceStatus.ARCHIVED`) | Owner / Admin |
| `/api/v1/resources/{id}/favorite`| `POST` | Add resource to user favorites | Authenticated |
| `/api/v1/resources/{id}/favorite`| `DELETE` | Remove resource from user favorites | Authenticated |
| `/api/v1/resources/{id}/pin` | `POST` | Pin resource to dashboard | Authenticated |
| `/api/v1/resources/{id}/pin` | `DELETE` | Unpin resource | Authenticated |
| `/api/v1/resources/{id}/download`| `GET` | Securely retrieve resource download attachment | Authenticated |

---

## AI & RAG Endpoints (`/api/v1/ai`)

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/v1/ai/chat` | `POST` | Synchronous AI tutor chat request | Authenticated |
| `/api/v1/ai/chat/stream` | `GET` | Server-Sent Events (SSE) streaming chat | Authenticated |
| `/api/v1/ai/conversations` | `GET` | List active AI conversations | Authenticated |
| `/api/v1/ai/conversations/{id}`| `GET` | Retrieve conversation history messages | Authenticated |
| `/api/v1/ai/conversations/{id}`| `DELETE` | Delete conversation history | Authenticated |

---

## Planner & Productivity Endpoints (`/api/v1/tasks`)

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/v1/tasks` | `GET` | List user tasks with status/priority filters | Authenticated |
| `/api/v1/tasks` | `POST` | Create new task with priority & due date | Authenticated |
| `/api/v1/tasks/{id}` | `GET` | Get task details | Authenticated |
| `/api/v1/tasks/{id}` | `PUT` | Update task details | Owner / Admin |
| `/api/v1/tasks/{id}` | `DELETE` | Delete task | Owner / Admin |
| `/api/v1/tasks/{id}/complete` | `POST` | Mark task status as `COMPLETED` | Authenticated |

---

## Campus Marketplace Endpoints (`/api/v1/marketplace`)

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/v1/marketplace/listings` | `GET` | Search and list active marketplace listings | Authenticated |
| `/api/v1/marketplace/listings` | `POST` | Create new marketplace listing | Authenticated |
| `/api/v1/marketplace/listings/{id}`| `GET` | Get listing details & seller contact info | Authenticated |
| `/api/v1/marketplace/listings/{id}`| `PUT` | Update listing price, title, or status | Seller / Admin |
| `/api/v1/marketplace/listings/{id}`| `DELETE` | Delete marketplace listing | Seller / Admin |

---

## Notification Endpoints (`/api/v1/notifications`)

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/v1/notifications` | `GET` | List notifications for authenticated user | Authenticated |
| `/api/v1/notifications/unread-count`| `GET` | Get unread notification count | Authenticated |
| `/api/v1/notifications/{id}/read` | `PUT` | Mark specific notification as read | Authenticated |
| `/api/v1/notifications/read-all` | `PUT` | Mark all user notifications as read | Authenticated |

---

## Analytics Endpoints (`/api/v1/analytics`)

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/v1/analytics/dashboard` | `GET` | Get canonical user-scoped dashboard analytics | Authenticated |
| `/api/v1/analytics/productivity`| `GET` | Get task completion and study time analytics | Authenticated |
| `/api/v1/analytics/ai` | `GET` | Get AI chat token usage & topic stats | Authenticated |
| `/api/v1/analytics/resources` | `GET` | Get resource uploads, views, downloads stats | Authenticated |

---

## Administrative Endpoints (`/api/v1/admin`)

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/v1/admin/summary` | `GET` | Get system-wide platform statistics | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/admin/users` | `GET` | List all platform users with role filters | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/admin/users/{id}/roles`| `PUT` | Assign user roles (privilege-escalation protected) | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/admin/users/{id}/status`| `PUT` | Activate or deactivate user account | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/admin/users/{id}` | `DELETE` | Delete user account | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/admin/audit-logs` | `GET` | Retrieve administrative audit trail logs | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/admin/settings` | `GET` | Get system configuration settings | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/admin/settings` | `PUT` | Save system settings (reserved) | `SUPER_ADMIN` strictly |
