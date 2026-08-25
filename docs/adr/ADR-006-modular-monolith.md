# ADR-006: Spring Boot Modular Monolith Architecture

## Status
**Accepted**

## Context
We evaluated building Abhi.iterates-OS as either a **Microservices Architecture** (separate services for Auth, Academic, AI, Assessment, Planner) or a **Modular Monolith Architecture** (single Spring Boot application with strict domain boundary packaging).

## Decision
We chose a **Spring Boot 3 Modular Monolith Architecture**.

## Rationale & Trade-offs

### Advantages:
- **Transactional Consistency**: Domain operations (e.g. submitting an assessment and updating topic progress) execute in a single ACID database transaction.
- **Operational Efficiency**: Eliminates gRPC/REST network hop overhead between services, distributed tracing infrastructure (Jaeger), and API gateway orchestration.
- **Simpler Deployment**: Deployable as a single executable JAR or Docker container.
- **Clear Domain Package Isolation**: Packages (`academic`, `planner`, `assessment`, `ai`, `resource`) maintain explicit boundary interfaces.

### Trade-offs & Consequences:
- **Shared Compute**: All domains run within the same JVM process. If vector embedding processing spikes CPU, it shares resources with REST API controllers (mitigated via HikariCP and thread pool management).
