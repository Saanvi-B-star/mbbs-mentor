# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MBBS Mentor is an AI-powered learning platform for medical students with a three-tier architecture:
- **Backend:** Express.js + TypeScript + Prisma (Node 22+)
- **Frontend-User:** Next.js 15 student portal (port 3000)
- **Frontend-Admin:** Next.js 15 admin portal (port 3001)

The platform features token-based subscriptions, AI-driven content generation (via OpenRouter), OCR processing for user notes, adaptive testing, and payment integration (Razorpay).

## Development Commands

### Backend (from `/backend` directory)

```bash
# Development
npm run dev                  # Start dev server (port 5000) with hot reload

# Building
npm run build                # Compile TypeScript to JavaScript
npm start                    # Run production build

# Database (Prisma)
npm run prisma:generate      # Generate Prisma Client after schema changes
npm run prisma:migrate       # Create and run new migration
npm run prisma:migrate:prod  # Deploy migrations to production
npm run prisma:seed          # Seed database with initial data
npm run prisma:studio        # Open Prisma Studio GUI
npm run prisma:reset         # Reset database (WARNING: deletes all data)

# Testing
npm test                     # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate coverage report

# Code Quality
npm run lint                 # Run ESLint
npm run lint:fix             # Auto-fix ESLint issues
npm run format               # Format code with Prettier
```

### Frontend-User (from `/frontend-user` directory)

```bash
npm run dev         # Start dev server on port 3000
npm run build       # Build for production
npm start           # Start production server on port 3000
npm run lint        # Run Next.js linting
npm run type-check  # Run TypeScript type checking
```

### Frontend-Admin (from `/frontend-admin` directory)

```bash
npm run dev         # Start dev server on port 3001
npm run build       # Build for production
npm start           # Start production server on port 3001
npm run lint        # Run Next.js linting
npm run type-check  # Run TypeScript type checking
```

## Architecture

### Backend Module Structure

The backend uses a **domain-driven module architecture**. Each module in `backend/src/modules/` follows this pattern:

```
module-name/
├── module-name.controller.ts   # HTTP request handlers
├── module-name.service.ts      # Business logic
├── module-name.routes.ts       # Route definitions & Swagger docs
├── module-name.validation.ts   # Zod validation schemas
├── module-name.types.ts        # TypeScript interfaces
└── index.ts                    # Module exports
```

**Key Modules:**
- `auth` - Authentication (JWT, password reset, token refresh)
- `user` - User management & profiles
- `token` - Token balance & transaction system
- `payment` - Razorpay integration (orders, verification, webhooks)
- `notes` - User note uploads with OCR processing
- `ai` - OpenRouter AI assistant integration
- `subject` - Medical subject hierarchy management
- `topic` - Topic management within subjects
- `question` - Question bank (MCQ, SAQ, TRUE_FALSE, IMAGE_BASED)
- `test` - Test generation, attempts, and evaluation
- `analytics` - Performance tracking & reporting
- `email` - AWS SES email service (8 templates)

### Shared Infrastructure (`backend/src/shared/`)

- `constants/` - Application-wide constants (HTTP codes, API versions, token costs)
- `exceptions/` - Custom exception classes (BadRequestException, NotFoundException, etc.)
- `interfaces/` - Common TypeScript interfaces
- `utils/` - Utility functions (hashing, validation, file processing)

### Configuration (`backend/src/config/`)

All service configurations are centralized here:
- `environment.ts` - Environment variable validation
- `database.ts` - Prisma client singleton
- `logger.ts` - Winston logger configuration
- `aws.config.ts` - S3, SES, Textract clients
- `openrouter.config.ts` - AI service configuration
- `razorpay.config.ts` - Payment gateway setup
- `queue.config.ts` - BullMQ job queue configuration
- `swagger.config.ts` - API documentation setup

### Middleware Pipeline

Request flow: `requestIdMiddleware` → `loggingMiddleware` → `globalRateLimiter` → `authMiddleware` (protected routes) → `tokenCheckMiddleware` (token-consuming endpoints) → `validation` → Controller

### Database (Prisma)

- **ORM:** Prisma 5.x with PostgreSQL 17
- **Schema:** `backend/prisma/schema.prisma`
- **Key Models:** User, AdminUser, Subscription, TokenTransaction, Subject, Topic, Question, Test, TestAttempt, UserNote, AIConversation, PaymentTransaction
- **Always run** `npm run prisma:generate` after schema changes
- **Migrations:** Use `npm run prisma:migrate` in development, `npm run prisma:migrate:prod` for production

### Frontend Architecture (Next.js 15)

Both frontends use:
- **App Router** (not Pages Router)
- **ShadCN UI + Radix UI** components
- **Tailwind CSS 4.0** for styling
- **Zustand** for state management
- **Axios** for API calls

Structure:
```
src/
├── app/           # Next.js App Router pages
├── lib/           # Utilities and API client
├── store/         # Zustand stores
└── types/         # TypeScript types
```

## Important Patterns

### API Response Format

All endpoints return:
```typescript
{
  success: boolean;
  message: string;
  data?: any;
  error?: { code: string; message: string; details?: any; };
}
```

### Error Handling

Use custom exceptions from `shared/exceptions/`:
```typescript
throw new NotFoundException('User not found');
throw new UnauthorizedException('Invalid credentials');
throw new BadRequestException('Invalid input');
```

These are caught by `errorMiddleware` and formatted consistently.

### Authentication

- **JWT-based** with access tokens (15m) and refresh tokens (7d)
- Protected routes use `authMiddleware`
- User role checking: `authMiddleware(['ADMIN', 'SUPER_ADMIN'])`
- Tokens stored in HTTP-only cookies (frontend) or Authorization header

### Token System

- Users consume tokens for AI features (questions, notes processing, etc.)
- Check token balance with `tokenCheckMiddleware(cost)`
- Token transactions logged in `TokenTransaction` model

### Validation

- Use **Zod** schemas defined in `*.validation.ts` files
- Apply via `validateRequest` middleware:
  ```typescript
  router.post('/', validateRequest(createSchema), controller.create);
  ```

### Background Jobs (BullMQ)

- Used for async tasks (OCR processing, email sending, analytics generation)
- Requires Redis connection
- Queue configuration in `queue.config.ts`
- Optional: App works without Redis but background jobs won't process

## Environment Setup

### Required Environment Variables

Must be set in `backend/.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Access token secret (32+ chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (32+ chars)
- `OPENROUTER_API_KEY` - OpenRouter AI API key

### Optional Services

The app gracefully handles missing optional services. Leave blank or comment out if not using:

- **Redis** (`REDIS_URL`) - For background jobs & caching
- **AWS** (`AWS_*` variables) - For S3 uploads, SES email, Textract OCR
- **Razorpay** (`RAZORPAY_*` variables) - For payment processing
- **OAuth** (`GOOGLE_*`, `APPLE_*`) - For social login

Missing optional services will log warnings but won't prevent app startup.

## API Documentation

- **Swagger UI:** http://localhost:5000/api-docs
- **Swagger JSON:** http://localhost:5000/api-docs.json
- Swagger annotations defined in `*.routes.ts` files
- Base API URL: http://localhost:5000/api/v1

## Development Workflow

1. **Database changes:**
   - Modify `backend/prisma/schema.prisma`
   - Run `npm run prisma:generate`
   - Run `npm run prisma:migrate`
   - Update affected services/controllers

2. **New API endpoint:**
   - Add to appropriate module or create new module
   - Define Zod validation schema
   - Implement service layer logic
   - Create controller handler
   - Add route with Swagger docs
   - Export route in `app.ts`

3. **New frontend feature:**
   - Create API client functions in `lib/`
   - Add Zustand store if needed
   - Build UI with ShadCN components
   - Implement in App Router pages

## Testing Strategy

- **Unit tests:** Test service layer logic in isolation
- **Integration tests:** Test API endpoints with supertest
- **Test database:** Use separate test database or in-memory DB
- Tests should be created in `backend/tests/` (currently not implemented - Phase 4)

## Known Limitations

- Testing suite not yet implemented (Phase 4 roadmap)
- Some features require optional services (AWS, Redis, Razorpay)
- Frontend UI components still being built out
- No mobile apps (web-only)

## Code Quality Standards

- TypeScript strict mode enabled
- ESLint configuration enforced
- Prettier for code formatting
- Follow existing module structure patterns
- Use custom exceptions, not generic Error throws
- All async operations should have proper error handling
- Validate all user inputs with Zod schemas
