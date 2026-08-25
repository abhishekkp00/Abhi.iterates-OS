# Production Deployment Guide

This document provides step-by-step instructions for deploying **Abhi.iterates-OS** into production using Docker Compose or standalone container runtimes.

---

## Deployment Prerequisites

1. **Host Server**: Linux server (Ubuntu 22.04 LTS or Debian 12 recommended), 4+ vCPUs, 8+ GB RAM.
2. **Container Engine**: Docker 24.0+ & Docker Compose v2.20+.
3. **Domain & DNS**: Pointed domain name (e.g. `app.abhiiterates.os`).
4. **AI API Key**: OpenAI or Groq API Key for LLM & Embedding capabilities.

---

## Quickstart Production Deployment via Docker Compose

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/abhishekkp00/Abhi.iterates-OS.git
cd Abhi.iterates-OS
cp .env.example .env
```

### 2. Configure Production Environment Variables (`.env`)
Edit `.env` and set secure random values:
```env
POSTGRES_DB=abhi_iterates_os_prod
POSTGRES_USER=abhi_os_user
POSTGRES_PASSWORD=Use_A_Strong_Random_Database_Password_123!
POSTGRES_PORT=5432

BACKEND_PORT=8080
FRONTEND_PORT=3000

JWT_SECRET=Use_A_Strong_Random_JWT_Secret_At_Least_64_Characters_Long!
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=AdminStrongP@ssword123!

OPENAI_API_KEY=sk-proj-your-actual-openai-or-groq-key
OPENAI_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-4o-mini

CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
```

### 3. Build & Launch Containers
```bash
docker compose up --build -d
```

### 4. Verify Health Endpoints
- **Backend Health Check**:
  ```bash
  curl -i http://localhost:8080/actuator/health
  ```
  *Expected Response*: `HTTP/1.1 200 OK` with `{"status":"UP"}`.

- **Database Migrations**: Flyway automatically runs migrations `V1` to `V10` on backend container startup.

---

## Nginx Reverse Proxy & SSL Configuration (Certbot / Let's Encrypt)

For domain deployment with SSL/TLS encryption, configure host Nginx:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v1/ai/chat/stream {
        proxy_pass http://localhost:8080/api/v1/ai/chat/stream;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```
