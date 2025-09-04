# PRIMES BA - Test Management Platform

AI-assisted platform for Power Platform test automation with Azure DevOps integration.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend**: React 18 + TypeScript + Fluent UI 9
- **Backend**: Node.js + Express + TypeScript + SQLite
- **Shared**: Common types and utilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PRIMES-BA---Test-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Build shared packages**
   ```bash
   npm run build
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📋 Environment Variables

Create a `.env.local` file with the following variables:

### Required Variables

```bash
# Azure DevOps Configuration
ADO_ORG_URL=https://dev.azure.com/your-org
ADO_PROJECT=your-project-name
ADO_PAT=your-azure-devops-pat-token

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# Power Platform Configuration
PP_TENANT_ID=your-power-platform-tenant-id
PP_ENV_URL=https://your-env.powerapps.com

# Authentication Mode
AUTH_MODE=service  # or "interactive"

# Cost Configuration
COST_CEILING_RUN_USD=10.0

# Server Configuration
PORT=3001
NODE_ENV=development
DB_PATH=./data/alpha.db

# Frontend Configuration
VITE_API_URL=http://localhost:3001
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run all tests
- `npm run clean` - Clean all build artifacts

### Package-specific scripts

**Frontend:**
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend for production

**Backend:**
- `npm run dev --workspace=backend` - Start backend dev server
- `npm run build --workspace=backend` - Build backend for production

**Shared:**
- `npm run build --workspace=shared` - Build shared types

### Project Structure

```
PRIMES-BA---Test-Management/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   ├── utils/          # Utility functions
│   │   └── test/           # Test setup
│   ├── index.html          # HTML template
│   └── vite.config.ts      # Vite configuration
├── backend/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── test/           # Test setup
│   └── tsconfig.json       # TypeScript config
├── shared/                  # Shared types and utilities
│   └── src/
│       ├── types/          # TypeScript type definitions
│       └── config/         # Configuration utilities
├── data/                    # SQLite database files
└── package.json            # Workspace configuration
```

## 🔌 API Endpoints

### Health Check
- `GET /api/health` - System health and status

### Test Cases
- `GET /api/cases` - List test cases with pagination
- `GET /api/cases?area=Contacts&priority=1` - Filter test cases

### Test Generation & Execution
- `POST /api/tests/generate/:id` - Generate Playwright test for a case
- `POST /api/tests/runs/:id/execute` - Execute a test case
- `GET /api/tests/runs/:id` - Get test run status and results

## 🗄️ Database Schema

The application uses SQLite with the following core tables:

### test_cases
- Stores Azure DevOps imported test cases
- Fields: id, title, area, priority, last_synced_at, source_rev

### test_steps
- Individual steps for each test case
- Fields: id, case_id, step_index, action, expected

### test_runs
- Test execution records
- Fields: id, case_id, started_at, finished_at, status, browser, env

### token_usage
- OpenAI API usage tracking
- Fields: id, run_id, model, prompt_tokens, completion_tokens, cost_usd

## 🧪 Testing

### Frontend Testing
- **Framework**: Jest + React Testing Library
- **Coverage**: 80% minimum threshold
- **Run**: `npm run test --workspace=frontend`

### Backend Testing
- **Framework**: Jest + Supertest
- **Coverage**: 80% minimum threshold
- **Run**: `npm run test --workspace=backend`

### Integration Testing
- Health check endpoint validation
- API response format verification
- Database connection testing

## 🔒 Security

### Environment Variable Validation
- All required variables validated at startup
- Invalid configuration causes immediate failure
- Sensitive values redacted from logs

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable via environment variables

### Security Headers
- Helmet.js for security headers
- CORS configured for development/production
- Request validation with express-validator

## 📊 Monitoring

### Health Check
The `/api/health` endpoint provides:
- System status (healthy/unhealthy)
- Database connection status
- Uptime information
- Basic statistics (test cases, runs, etc.)

### Logging
- Structured JSON logging with Winston
- Request/response logging with correlation IDs
- Secret redaction in logs
- Configurable log levels

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

### Environment Configuration

Ensure all required environment variables are set for production:

```bash
NODE_ENV=production
# ... other required variables
```

### Database

- SQLite database is created automatically
- Database path configurable via `DB_PATH`
- Migrations run automatically on startup

## 🔧 Troubleshooting

### Common Issues

**Environment validation fails:**
- Check all required variables are set in `.env.local`
- Verify variable names match exactly
- Ensure no extra spaces around values

**Database connection fails:**
- Check `DB_PATH` points to writable directory
- Ensure directory exists (created automatically)
- Verify file permissions

**Frontend can't connect to backend:**
- Ensure `VITE_API_URL` matches backend port
- Check backend is running on specified port
- Verify CORS configuration

### Debug Mode

Set `NODE_ENV=development` for:
- Detailed error messages
- Request/response logging
- Source maps in builds

## 📚 Documentation

- [Copilot Instructions](,github/copilot-instructions.md) - AI coding guidelines
- [Environment Variables](.env.example) - Configuration reference
- [API Documentation](#-api-endpoints) - Endpoint reference

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Maintain 80%+ test coverage
3. Use conventional commit messages
4. Ensure all type checks pass
5. Update documentation for new features

## 📝 License

[License information to be added]