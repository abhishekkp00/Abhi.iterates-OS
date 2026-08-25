# AbhiIterates.OS

> **The Operating System for College Students.**

AbhiIterates.OS is an AI-powered academic workspace that consolidates every tool a college student needs — PDF reading, note organization, AI-powered study assistance, resource marketplace, and collaborative studying — into one cohesive platform.

---

## Problem

Students today use 8–12 applications to manage their academic life. Notes are scattered, PDFs are passive documents, AI tools don't understand personal study material, and purchased notes leak freely. Students lose hours daily switching contexts between applications.

## Solution

A single, production-grade academic OS that replaces:

| Tool Replaced | Feature in AbhiIterates.OS |
|---|---|
| Google Drive | Library + Resource Management |
| Notion | Notes + Productivity Dashboard |
| ChatGPT | AI Workspace (context-aware) |
| Adobe Acrobat | PDF Workspace |
| Telegram Groups | Collaboration |
| Gumroad / Payhip | Marketplace |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                    │
│            Vite · TypeScript · Tailwind CSS          │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS / REST / SSE
┌─────────────────────▼───────────────────────────────┐
│            Spring Boot Modular Monolith               │
│     auth · users · resources · ai · marketplace      │
│   productivity · notifications · analytics · admin   │
│                                                      │
│  AI module: Spring AI → OpenAI-compatible endpoint   │
│  SSE streaming · tool calling · conversation store   │
└─────────────────────┬───────────────────────────────┘
                      │
              ┌───────▼───────┐
              │  PostgreSQL   │
              │  (Neon/local) │
              └───────────────┘
```

**Architecture Pattern:** Modular Monolith

> See [`ARCHITECTURE.md`](ARCHITECTURE.md) for full ADR history.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v3, shadcn/ui (Radix) |
| State | Zustand (global), TanStack Query (server) |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Backend | Java 21, Spring Boot 3.3.1, Spring Security |
| Auth | JWT + Refresh Token Rotation + OAuth2 (Google) |
| ORM | Spring Data JPA + Hibernate |
| AI | Spring AI 1.0.0 (OpenAI-compatible endpoint) |
| AI Models | OpenAI GPT-4o-mini / Groq Llama (configurable via env) |
| Primary DB | PostgreSQL (Neon serverless) |
| Storage | Cloudinary (attachments & images) |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Project Structure

```
abhiiterates-os/
├── frontend/          # React application (Vite + TypeScript)
├── backend/           # Spring Boot modular monolith
│   └── src/main/java/com/abhiiterates/os/
│       ├── ai/        # AI chat, conversations, tool calling
│       ├── auth/      # JWT, OAuth2, refresh tokens
│       ├── user/      # User profiles, roles, permissions
│       ├── resource/  # Library, PDF attachments, Cloudinary
│       ├── marketplace/
│       ├── productivity/
│       ├── notification/
│       ├── analytics/
│       ├── admin/
│       ├── common/
│       ├── config/
│       └── exception/
├── ai-service/        # Reserved placeholder (empty — AI lives in backend)
├── docs/              # Architecture, design system, API docs
└── .github/           # PR templates
```

> **Note:** The `ai-service/` directory is an empty placeholder reserved for a future
> dedicated service if scale demands it. All AI functionality currently runs inside
> the Spring Boot monolith using Spring AI.

---

## Local Development Setup

> Prerequisites: Node.js 20+, Java 21, PostgreSQL 16

### Clone

```bash
git clone https://github.com/abhishekkp00/Abhi.iterates-OS.git
cd Abhi.iterates-OS
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials, JWT secret, OpenAI/Groq API key
./mvnw spring-boot:run
```

---

## Service Ports (Development)

| Service | Port |
|---|---|
| Frontend | 5180 |
| Backend | 8095 |
| PostgreSQL | 5432 |

---

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for the complete list of required
environment variables. No Redis, Python, or separate AI service is required.

---

## Git Workflow

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for commit standards and branching strategy.

---

## Roadmap

| Phase | Focus |
|---|---|
| MVP | Auth, Library, Marketplace, PDF Viewer, AI Chat (✅ Done) |
| Phase 2 | RAG document Q&A, Academic Context, Study Planner AI |
| Phase 3 | Voice AI, Mobile App, Institutions, Adaptive AI Tutor |

See [`docs/mvp-scope.md`](docs/mvp-scope.md) for complete scope definition.

---

## Documentation

| Document | Description |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Architecture decisions and ADR history |
| [`docs/backend-foundation.md`](docs/backend-foundation.md) | Backend module structure and design |
| [`docs/design-system.md`](docs/design-system.md) | Design tokens, typography, component rules |
| [`docs/mvp-scope.md`](docs/mvp-scope.md) | MVP feature set, in/out of scope |
| [`docs/api-conventions.md`](docs/api-conventions.md) | API naming, response format, error format |
| [`docs/database-design.md`](docs/database-design.md) | ER diagram, schema definitions |

---

## License

MIT License — see [LICENSE](LICENSE)

---

*Built with intention. Designed for scale. Engineered for students.*
