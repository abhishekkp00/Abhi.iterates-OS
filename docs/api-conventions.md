# API Conventions — AbhiIterates.OS

This document defines how every API endpoint is named, versioned, and structured.
All engineers must follow these conventions without exception.
Inconsistent APIs create client-side bugs, confuse integrators, and generate technical debt.

---

## Base URL

```
Development:  http://localhost:8080
Production:   https://api.abhiiterates.com
```

---

## Versioning

All APIs are versioned in the URL path. We use **URI versioning**.

```
/api/v1/auth/login
/api/v1/library/resources
/api/v1/marketplace/listings
```

**Why URI versioning?**
- Visible in logs, browser history, and API documentation
- Easy to route at the reverse proxy level
- Clients can test v2 alongside v1 without header manipulation

**Rules:**
- Version only changes on **breaking changes**
- Adding new optional fields is NOT a breaking change
- Removing a field IS a breaking change
- Changing a field type IS a breaking change
- v1 must remain functional until v2 has been in production for 90 days

---

## URL Naming Conventions

### Rules

1. **All lowercase** — no camelCase, no PascalCase in URLs
2. **Hyphens for word separation** — `/user-profiles`, not `/user_profiles` or `/userProfiles`
3. **Plural nouns for collections** — `/resources`, `/users`, `/bookmarks`
4. **No verbs in URLs** — the HTTP method IS the verb
5. **Hierarchical relationships** — `/users/{userId}/bookmarks`
6. **No trailing slashes**

### Examples

```
# Correct
GET    /api/v1/library/resources
POST   /api/v1/library/resources
GET    /api/v1/library/resources/{resourceId}
PUT    /api/v1/library/resources/{resourceId}
DELETE /api/v1/library/resources/{resourceId}
GET    /api/v1/library/resources/{resourceId}/highlights
POST   /api/v1/library/resources/{resourceId}/highlights

# Wrong — never do these
GET    /api/v1/getResources          ← verb in URL
GET    /api/v1/library/Resources     ← uppercase
GET    /api/v1/library/resource      ← singular
GET    /api/v1/library/resources/    ← trailing slash
POST   /api/v1/library/createResource  ← verb
```

---

## HTTP Method Semantics

| Method | Semantics | Idempotent | Body |
|---|---|---|---|
| `GET` | Read, never modify | Yes | No |
| `POST` | Create, non-idempotent actions | No | Yes |
| `PUT` | Full update (replace) | Yes | Yes |
| `PATCH` | Partial update | No | Yes |
| `DELETE` | Delete | Yes | Optional |

---

## Standard Response Envelope

**Every API response** (success or error) follows this shape:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-07-04T00:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

### Paginated Success Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 143,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  },
  "meta": {
    "timestamp": "2026-07-04T00:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource could not be found.",
    "details": null
  },
  "meta": {
    "timestamp": "2026-07-04T00:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

### Validation Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed. See details.",
    "details": {
      "email": "Email address is required.",
      "password": "Password must be at least 8 characters."
    }
  },
  "meta": {
    "timestamp": "2026-07-04T00:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

---

## HTTP Status Codes

| Code | When to Use |
|---|---|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST that creates a resource |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Invalid request body or params |
| `401 Unauthorized` | Missing or invalid authentication |
| `403 Forbidden` | Authenticated but not authorized |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource (email already registered) |
| `422 Unprocessable Entity` | Validation failed |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error |

---

## Error Codes (Application-Level)

Application error codes are machine-readable strings used by the frontend to display
appropriate messages without string matching on messages.

```
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
AUTH_TOKEN_INVALID
AUTH_REFRESH_TOKEN_INVALID
AUTH_REFRESH_TOKEN_EXPIRED
AUTH_EMAIL_ALREADY_EXISTS
AUTH_ACCOUNT_DISABLED

RESOURCE_NOT_FOUND
RESOURCE_ACCESS_DENIED
RESOURCE_UPLOAD_FAILED
RESOURCE_TYPE_NOT_SUPPORTED

LIBRARY_SUBJECT_NOT_FOUND
LIBRARY_SUBJECT_DUPLICATE

MARKETPLACE_LISTING_NOT_FOUND
MARKETPLACE_ALREADY_PURCHASED
MARKETPLACE_PAYMENT_FAILED

AI_CONTEXT_NOT_FOUND
AI_QUOTA_EXCEEDED
AI_SERVICE_UNAVAILABLE

VALIDATION_FAILED
INTERNAL_SERVER_ERROR
RATE_LIMIT_EXCEEDED
```

---

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

Token lifecycle:
- Access token: 15 minutes, validated stateless (JWT signature check)
- Refresh token: 30 days, stored in PostgreSQL, rotated on use

---

## Pagination

All list endpoints support pagination via query parameters.

```
GET /api/v1/library/resources?page=0&size=20&sort=createdAt&direction=DESC
```

| Parameter | Default | Description |
|---|---|---|
| `page` | `0` | Zero-indexed page number |
| `size` | `20` | Items per page, max `100` |
| `sort` | `createdAt` | Field to sort by |
| `direction` | `DESC` | `ASC` or `DESC` |

---

## Filtering

Filters are passed as query parameters with the field name:

```
GET /api/v1/library/resources?type=PDF&subjectId=3
GET /api/v1/marketplace/listings?minPrice=0&maxPrice=500&type=PDF
```

---

## Request ID Tracing

Every response includes a `requestId` (UUID) in the meta object.
The same ID is logged on the server side for tracing.
When a user reports an error, the request ID is used to find the exact log entry.
