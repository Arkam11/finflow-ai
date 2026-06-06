# FinFlow AI

> Enterprise-grade AI-powered Banking & Retail Intelligence Platform built as a microservices system with real-time event streaming, GenAI financial assistant, and full Kubernetes deployment.

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20_LTS-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Kafka](https://img.shields.io/badge/Apache_Kafka-3.7-231F20?logo=apachekafka)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.35-326CE5?logo=kubernetes)
![GraphQL](https://img.shields.io/badge/GraphQL-Apollo_4-E10098?logo=graphql)
![CI](https://github.com/Arkam11/finflow-ai/actions/workflows/ci.yml/badge.svg)

---

## What this project is

FinFlow AI is a production-architecture fullstack platform that simulates a real banking and retail intelligence system. It was built to demonstrate senior-level engineering across the full stack — from microservices design and event-driven architecture to GenAI integration, GraphQL APIs, and Kubernetes deployment.

The platform has two primary user groups: **banking customers** who can view accounts, make transfers, chat with an AI financial assistant, and receive real-time fraud alerts; and **retail merchants** who get a live sales analytics dashboard. Every feature is wired together through a real event bus (Kafka), a real AI model (LLaMA 3.3 70B via Groq), and a real Kubernetes cluster (minikube).

---

## Architecture overview

```
Browser (React :5173)
        |
        v  [Vite proxy]
API Gateway :3000
JWT verification + rate limiting + GraphQL + REST proxy
        |
        v
+--------------------------------------------------+
|  Auth Service         :3001                      |
|  Account Service      :3002                      |
|  Transaction Service  :3003                      |
|  AI Service           :3004                      |
|  Analytics Service    :3005                      |
|  Notification Service :3006                      |
|  Fraud Service        :3007                      |
|  Retail Service       :3008                      |
+--------------------------------------------------+
        |
        v  [publish / subscribe]
Apache Kafka :9092  (KRaft mode, no Zookeeper)
        |
        v  [persist / cache]
PostgreSQL :5432  +  Redis :6379
        |
        v  [deploy]
Kubernetes (minikube) with HPA + rolling updates
```

---

## Technology stack

| Layer          | Technologies                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------- |
| **Frontend**   | React 18, TypeScript, Vite, Tailwind CSS, Material UI, React Query, Zustand, React Router v6 |
| **Backend**    | Node.js 20, Express.js, TypeScript (strict mode)                                             |
| **API**        | REST microservices, GraphQL (Apollo Server 4), DataLoader                                    |
| **Auth**       | JWT (access 15min + refresh 7d), OAuth2 (Google + GitHub), Passport.js                       |
| **AI / GenAI** | Groq API (LLaMA 3.3 70B), RAG pipeline, SSE streaming, Redis chat history                    |
| **Messaging**  | Apache Kafka 3.7 (KRaft mode), 3 event topics, 4 consumer services                           |
| **Databases**  | PostgreSQL 16 (TypeORM), Redis 7 (sessions, cache, chat history)                             |
| **DevOps**     | Docker, Kubernetes 1.35, Helm, Horizontal Pod Autoscaler                                     |
| **CI/CD**      | GitHub Actions (lint → test → build → Docker images)                                         |
| **Monitoring** | Prometheus metrics, structured Winston logging (JSON in prod)                                |
| **Quality**    | ESLint, Prettier, Husky pre-commit hooks, Jest, Supertest                                    |

---

## Microservices

| Service                | Port | Responsibility                                                    |
| ---------------------- | ---- | ----------------------------------------------------------------- |
| `gateway`              | 3000 | API routing, JWT verification, rate limiting, GraphQL, REST proxy |
| `auth-service`         | 3001 | OAuth2 login, JWT tokens, Redis sessions, RBAC                    |
| `account-service`      | 3002 | Account management, balance queries _(planned)_                   |
| `transaction-service`  | 3003 | Fund transfers, fraud detection, Kafka publishing                 |
| `ai-service`           | 3004 | LLM chat, RAG pipeline, spending analysis, fraud explanation      |
| `analytics-service`    | 3005 | Real-time metrics aggregation _(planned)_                         |
| `notification-service` | 3006 | Kafka consumer, email/SMS alerts                                  |
| `fraud-service`        | 3007 | Rule-based + AI fraud scoring _(planned)_                         |
| `retail-service`       | 3008 | Merchant sales analytics _(planned)_                              |

---

## Kafka event topics

| Topic                 | Producer            | Consumers                               |
| --------------------- | ------------------- | --------------------------------------- |
| `transaction.created` | transaction-service | notification-service, analytics-service |
| `transaction.failed`  | transaction-service | notification-service                    |
| `fraud.alert`         | transaction-service | notification-service, fraud-service     |

---

## Key features built

### Real-time transaction engine

Every fund transfer goes through rule-based fraud scoring (0-100 risk score). Transfers above $50,000 or with suspicious patterns are automatically flagged, a `fraud.alert` Kafka event fires, and the notification service logs an alert in real time.

### GenAI financial assistant (RAG)

The AI service fetches the user's last 20 transactions from Postgres on every chat request and injects them as context into the LLaMA 3.3 70B prompt. The model responds with awareness of real account activity — flagged transactions, spending patterns, anomalies. Responses stream token-by-token via Server-Sent Events.

### GraphQL API layer

Apollo Server 4 runs inside the gateway alongside REST. DataLoader solves the N+1 query problem by batching transaction fetches. Redis caches hot queries (transactions: 30s, stats: 60s, spending analysis: 5min). Cache is invalidated automatically on mutations.

### Kubernetes deployment

All services are containerised with multi-stage Dockerfiles running as non-root users. Horizontal Pod Autoscalers scale the transaction service (2-8 pods) and AI service (2-6 pods) based on CPU and memory. Rolling updates ensure zero downtime on every deployment.

### GitHub Actions CI/CD

Every push triggers: lint → format check → TypeScript compile → Jest tests → Docker image builds. Branch protection on `main` requires all checks to pass before merging.

---

## Project phases

| Phase | What was built                                                                     |
| ----- | ---------------------------------------------------------------------------------- |
| 1     | GitHub monorepo, TypeScript, ESLint + Prettier + Husky, GitHub Actions CI          |
| 2     | Auth Service — OAuth2, JWT, Redis sessions, RBAC, 8 tests                          |
| 3     | API Gateway — JWT middleware, proxy routing, rate limiting, health aggregation     |
| 4     | Kafka Event Streaming — Transaction Service, Notification Service, fraud detection |
| 5     | GenAI Assistant — Groq LLaMA integration, RAG pipeline, SSE streaming              |
| 6     | React Frontend — Dashboard, Transactions, AI Chat, real-time data                  |
| 7     | GraphQL + Performance — Apollo Server 4, DataLoader, Redis cache, Prometheus       |
| 8     | Kubernetes — Deployments, HPA, Helm chart, Docker image CI pipeline                |

---

## What was proven working end to end

- OAuth2 login flow → JWT issued → protected routes enforced at gateway
- `POST /transactions` → fraud scored → Kafka event published → notification consumed in real time (verified with $75,000 flagged transfer)
- AI chat → RAG fetches real transactions → LLaMA streams response token-by-token → saved to Redis session
- GraphQL query → DataLoader batches fetch → Redis cache hit on second request
- React dashboard → live transaction count, flagged alert badge, AI spending analysis, streaming chat UI
- Kubernetes pods → Postgres and Redis healthy, HPA configured, rolling update strategy active

---

## Local development

### Prerequisites

- Node.js 20 via nvm
- Docker Desktop with WSL2 integration
- Git with SSH key configured

### Start infrastructure

```bash
docker compose up -d
```

### Start all services

```bash
# Terminal 1 — gateway
cd services/gateway && npm run dev

# Terminal 2 — auth
cd services/auth-service && npm run dev

# Terminal 3 — transactions
cd services/transaction-service && npm run dev

# Terminal 4 — AI assistant
cd services/ai-service && npm run dev

# Terminal 5 — notifications
cd services/notification-service && npm run dev

# Terminal 6 — frontend
cd apps/web && npm run dev
```

### Generate a test JWT

```bash
node scripts/generate-test-token.js
```

### Run all tests

```bash
npm test
```

### GraphQL playground

```
http://localhost:3000/graphql
```

### Prometheus metrics

```
http://localhost:3000/metrics
```

---

## Environment variables

Each service has a `.env.example` file. Key variables:

| Variable                    | Description                    |
| --------------------------- | ------------------------------ |
| `JWT_ACCESS_SECRET`         | Must match across all services |
| `GROQ_API_KEY`              | Free at console.groq.com       |
| `DB_HOST` / `DB_PORT`       | Postgres — port 5434 locally   |
| `REDIS_HOST` / `REDIS_PORT` | Redis — port 6380 locally      |
| `KAFKA_BROKERS`             | Kafka — localhost:9092         |

---

## Planned improvements

### Technical enhancements

- **pgvector** — store transaction embeddings for semantic similarity search in the RAG pipeline
- **Account Service** — full account CRUD, balance management, transfer validation
- **Retail Analytics Service** — merchant dashboard with real-time sales aggregation from Kafka
- **WebSocket gateway** — upgrade AI chat from SSE to bidirectional WebSocket
- **Distributed tracing** — OpenTelemetry + Jaeger for end-to-end request tracing across microservices
- **Redis Cluster** — replace single Redis with cluster mode for high availability
- **Kafka Schema Registry** — enforce Avro schemas on all event topics

### Features to add

- **Multi-factor authentication** — TOTP as second factor after OAuth2
- **Transaction limits** — per-day and per-transaction limits configurable per user role
- **Scheduled payments** — cron-based recurring transfers using BullMQ
- **PDF statements** — generate monthly account statements
- **Merchant onboarding** — self-service registration with KYC document upload
- **Push notifications** — FCM integration for mobile fraud alerts
- **Admin panel** — user management, transaction override, fraud rule configuration

### DevOps improvements

- **GitHub Container Registry** — push Docker images to GHCR on every main merge
- **ArgoCD** — GitOps-based continuous deployment to Kubernetes
- **Grafana dashboard** — visualise Prometheus metrics with pre-built FinFlow panels
- **Chaos engineering** — Chaos Mesh experiments to test service resilience

---

## Folder structure

```
finflow-ai/
├── apps/
│   └── web/                     # React frontend (Vite + TypeScript)
├── services/
│   ├── gateway/                 # API Gateway (Express + Apollo GraphQL)
│   ├── auth-service/            # Authentication (JWT + OAuth2)
│   ├── transaction-service/     # Transactions + Fraud detection
│   ├── ai-service/              # GenAI assistant (Groq + RAG)
│   └── notification-service/    # Kafka consumer + alerts
├── packages/
│   └── shared/                  # Shared TypeScript types
├── infra/
│   ├── k8s/                     # Kubernetes manifests
│   │   ├── configmaps/
│   │   ├── secrets/
│   │   ├── deployments/
│   │   ├── hpa/
│   │   └── ingress/
│   └── helm/finflow/            # Helm chart
├── scripts/
│   └── generate-test-token.js   # JWT test token generator
├── docker-compose.yml           # Local infrastructure
├── .github/workflows/ci.yml     # GitHub Actions pipeline
└── package.json                 # Monorepo root (npm workspaces)
```

---

## Author

**Arkam Mohammed** — Full Stack Developer

Built as a portfolio project demonstrating senior-level engineering for enterprise financial platforms.

GitHub: [github.com/Arkam11](https://github.com/Arkam11)
