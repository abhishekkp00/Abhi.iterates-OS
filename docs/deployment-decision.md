# Production Deployment Strategy & Infrastructure Decision

This document outlines the rationale behind the target production deployment architecture for **Abhi.iterates-OS**.

---

## 1. Chosen Deployment Architecture

**Target Deployment Model**: Single-Instance Container Host / Managed Container PaaS  
**Infrastructure Stack**:
- Docker Compose on a Linux VM (e.g. AWS EC2 t4g.medium, Hetzner, DigitalOcean Droplet) **OR**
- Single-Task Managed Container Service (e.g. Render, Railway, AWS ECS Single Task)

---

## 2. Decision Rationale & Engineering Trade-offs

### Why Single-Instance Docker Compose / Container PaaS?

1. **Alignment with Application Scope**:
   - Abhi.iterates-OS is designed as a **Modular Monolith** for student productivity.
   - Traffic volume for personal/academic productivity workloads does not require horizontal cluster auto-scaling.
2. **Zero Infrastructure Complexity & Low Cost**:
   - Avoids $200+/month baseline cluster management costs associated with Kubernetes control planes (EKS/GKE).
   - Eliminates complex service meshes, ingress controllers, distributed tracing infrastructure, and multi-node pod networking.
3. **Operational Simplicity**:
   - Single command deployment (`docker compose up -d`) and standard systemd / platform restart policies.
   - All state resides in PostgreSQL and mounted block storage volumes (`postgres_data`, `uploads_data`).
4. **Rate Limiting & Memory Efficiency**:
   - Single-instance execution allows in-process Bucket4j sliding-window rate limiting (`RateLimiterService`) without requiring an external Redis cluster.

---

## 3. Evaluation of Rejected Alternatives

| Architecture Alternative | Evaluated Impact | Rejection Reason |
|--------------------------|------------------|------------------|
| **Kubernetes (EKS/GKE/K3s)** | High complexity, $150+/mo overhead, requires Helm, ingress controllers, PV provisioners | **OVERENGINEERED**: Monolithic Spring Boot application does not require container orchestration overhead. |
| **Microservices Decomposition** | High network latency, distributed transactions, multi-repo CI complexity | **ANTI-PATTERN**: Domain boundaries are clean inside Spring Boot modular packages (`academic`, `assessment`, `planner`, `resource`, `ai`). |
| **Redis Caching / Rate Limiting** | Additional container dependency, cache invalidation complexity | **UNNECESSARY**: Database queries are tuned with JPA JOIN FETCH and Flyway indexes; in-memory sliding window handles rate limiting. |
| **Kafka / Distributed Message Bus** | Heavy JVM memory footprint, Zookeeper/KRaft operational overhead | **UNNECESSARY**: Event processing is handled in-process via Spring ApplicationEvents and Virtual Thread async execution. |

---

## 4. Cost & Maintenance Matrix

| Resource | Specification | Estimated Monthly Cost |
|----------|---------------|------------------------|
| **Compute VM / Container** | 2 vCPU, 4 GB RAM (e.g. AWS ARM t4g.medium / DigitalOcean) | ~$12 - $20 / month |
| **Block Storage** | 20 GB SSD (PostgreSQL + Uploads) | ~$2.00 / month |
| **AI LLM API** | OpenAI / Groq (Pay-per-token usage) | Variable ($1 - $10 / month) |
| **Total Baseline** | | **~$15 - $30 / month** |
