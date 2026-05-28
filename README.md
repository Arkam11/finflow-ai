# FinFlow AI

AI-Powered Banking & Retail Intelligence Platform

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Material UI
- **Backend:** Node.js, Express.js, TypeScript (microservices)
- **AI:** Anthropic Claude API, RAG pipeline, pgvector
- **Messaging:** Apache Kafka
- **Auth:** JWT, OAuth2 (Google, GitHub)
- **API:** REST + GraphQL (Apollo Server)
- **Infra:** Docker, Kubernetes, Helm, GitHub Actions CI/CD

## Services

| Service              | Port | Responsibility                              |
| -------------------- | ---- | ------------------------------------------- |
| gateway              | 3000 | API routing, auth middleware, rate limiting |
| auth-service         | 3001 | OAuth2, JWT, session management             |
| account-service      | 3002 | Accounts, balances                          |
| transaction-service  | 3003 | Transfers, transaction history              |
| ai-service           | 3004 | LLM chat, RAG, spending analysis            |
| analytics-service    | 3005 | Real-time metrics, dashboards               |
| notification-service | 3006 | Email, SMS alerts                           |
| fraud-service        | 3007 | Rule-based + AI fraud detection             |
| retail-service       | 3008 | Merchant sales analytics                    |

## Getting started

```bash
# Start all infrastructure
docker compose up -d

# Install all dependencies
npm install
```
