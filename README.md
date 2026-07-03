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
│              Vite · TypeScript · Tailwind            │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS / REST / WebSocket
┌─────────────────────▼───────────────────────────────┐
│               Backend (Spring Boot)                  │
│     Modular Monolith · JWT · Spring Security         │
│   auth · marketplace · library · ai · notification  │
└──────┬──────────────┬──────────────────┬────────────┘
       │              │                  │
┌──────▼───┐  ┌───────▼──────┐  ┌───────▼──────┐
│PostgreSQL│  │    Redis     │  │  AI Service  │
│  (Neon)  │  │  (Sessions   │  │  (FastAPI +  │
│          │  │   + Cache)   │  │  LangChain)  │
└──────────┘  └──────────────┘  └──────────────┘
                                        │
                               ┌────────▼────────┐
                               │ Supabase Storage │
                               │ (MVP) / CF R2    │
                               └─────────────────┘
```

**Architecture Pattern:** Modular Monolith → extractable to microservices

See [`docs/architecture.md`](docs/architecture.md) for full ADR.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui |
| State | Zustand (global), TanStack Query (server) |
| Forms | React Hook Form + Zod |
| PDF | PDF.js |
| Animations | Framer Motion |
| Backend | Java 21, Spring Boot 3, Spring Security |
| Auth | JWT + Refresh Tokens + OAuth2 (Google) |
| ORM | Spring Data JPA + Hibernate |
| AI Service | Python 3.12, FastAPI, LangChain, FAISS |
| AI Models | Google Gemini / OpenAI GPT-4o |
| Primary DB | PostgreSQL 16 (Neon) |
| Cache | Redis (Upstash) |
| Storage | Supabase Storage (MVP) → Cloudflare R2 (Production) |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |
| AI Deploy | Railway |

---

## Project Structure

```
abhiiterates-os/
├── frontend/          # React application
├── backend/           # Spring Boot application
├── ai-service/        # FastAPI AI service
├── docs/              # Architecture, design system, API docs
└── .github/           # PR templates, workflows
```

---

## Local Development Setup

> Prerequisites: Node.js 20+, Java 21, Python 3.12, PostgreSQL 16, Redis

### Clone

```bash
git clone https://github.com/your-username/abhiiterates-os.git
cd abhiiterates-os
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
./mvnw spring-boot:run
```

### AI Service

```bash
cd ai-service
cp .env.example .env
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Service Ports (Development)

| Service | Port |
|---|---|
| Frontend | 3000 |
| Backend | 8080 |
| AI Service | 8000 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## Git Workflow

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for commit standards and branching strategy.

---

## Roadmap

| Phase | Timeline | Focus |
|---|---|---|
| MVP | Weeks 1–4 | Auth, Library, Marketplace, PDF Viewer, AI Chat |
| Phase 2 | Weeks 5–8 | Ratings, Creator Dashboard, Flashcards, Analytics |
| Phase 3 | Weeks 9–12 | Voice AI, Mobile App, Institutions, AI Tutor |

See [`docs/mvp-scope.md`](docs/mvp-scope.md) for complete scope definition.

---

## Documentation

| Document | Description |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Architecture decisions and reasoning |
| [`docs/design-system.md`](docs/design-system.md) | Design tokens, typography, component rules |
| [`docs/mvp-scope.md`](docs/mvp-scope.md) | MVP feature set, in/out of scope |
| [`docs/api-conventions.md`](docs/api-conventions.md) | API naming, response format, error format |
| [`docs/database-design.md`](docs/database-design.md) | ER diagram, schema definitions |

---

## License

MIT License — see [LICENSE](LICENSE)

---

*Built with intention. Designed for scale. Engineered for students.*
