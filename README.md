# MBBS Mentor - AI-Powered Learning Platform

An AI-powered learning platform designed specifically for MBBS students, combining adaptive learning, AI-driven content generation, performance analytics, and a token-based subscription model.

## Tech Stack

### Backend
- **Runtime:** Node.js 22 (Latest LTS)
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.3+
- **ORM:** Prisma 5.x
- **Database:** PostgreSQL 17.6
- **Cache:** Redis 7.x
- **Queue:** BullMQ
- **Validation:** Zod

### Frontend (Coming Soon)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.3+
- **UI Library:** ShadCN UI + Radix UI
- **Styling:** Tailwind CSS 4.0

### AI & Processing
- **LLM Provider:** OpenRouter AI
- **Models:** GPT-4, Claude, Gemini (via OpenRouter)
- **OCR:** AWS Textract + Tesseract.js
- **Document Processing:** pdf-parse, sharp

### Infrastructure (AWS)
- **Storage:** S3
- **Email:** SES
- **OCR:** Textract

### Payment
- **Gateway:** Razorpay

## Project Structure

```
mbbs-mentor/
├── backend/                       # Express API Backend
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   ├── middleware/           # Express middleware
│   │   ├── modules/              # Feature modules (domain-driven)
│   │   ├── shared/               # Shared utilities
│   │   │   ├── constants/       # Application constants
│   │   │   ├── interfaces/      # Common interfaces
│   │   │   ├── utils/           # Utility functions
│   │   │   └── exceptions/      # Custom exception classes
│   │   ├── database/            # Database files
│   │   ├── types/               # Global type definitions
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # Server entry point
│   ├── prisma/                  # Prisma schema and migrations
│   ├── tests/                   # Test files
│   └── package.json
└── frontend/                     # Next.js Frontend (Coming Soon)
```

## Getting Started

### Prerequisites

- Node.js 22 or higher
- PostgreSQL 17 or higher
- Redis 7 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mbbs-mentor
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your configuration:
   - Database URL
   - Redis URL
   - JWT secrets
   - AWS credentials
   - OpenRouter API key
   - Razorpay credentials

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # (Optional) Seed the database
   npm run prisma:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Build
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio
npm run prisma:reset     # Reset database
```

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Health Check
```
GET /health
```

### API Endpoints (Coming Soon)
- `/auth` - Authentication
- `/users` - User management
- `/subjects` - Subject management
- `/topics` - Topic management
- `/materials` - Study materials
- `/questions` - Question bank
- `/tests` - Test management
- `/ai` - AI assistant
- `/notes` - User notes upload & processing
- `/tokens` - Token management
- `/subscriptions` - Subscription management
- `/payments` - Payment processing
- `/analytics` - Analytics & reporting
- `/admin` - Admin portal

## Features

### Core Features
- AI-Powered Study Materials
- User Notes Upload & Processing (PDF/Images → OCR → AI Formatting)
- Intelligent Testing System
- Performance Tracking & Analytics
- Token-Based Usage System
- Subscription Management
- Payment Integration (Razorpay)

### Key Workflows
1. **User Notes Processing**
   - Upload PDF or images
   - OCR extraction (AWS Textract)
   - AI-powered formatting
   - Summary generation
   - Flashcard creation

2. **AI Assistant**
   - Ask questions
   - Get explanations
   - Context-aware responses
   - Related topics suggestions

3. **Payment & Subscriptions**
   - Multiple subscription plans
   - Razorpay integration
   - Automatic token allocation
   - Subscription renewal

## Database Schema

The application uses PostgreSQL 17 with Prisma ORM. Key models include:

- User management (User, AdminUser)
- Subscription & billing (SubscriptionPlan, Subscription, PaymentTransaction)
- Token system (TokenTransaction)
- Content management (Subject, Topic, StudyMaterial)
- User notes (UserNote)
- Questions & tests (Question, Test, TestAttempt)
- AI conversations (AIConversation, AIMessage)
- Analytics & logging (AuditLog, APILog, FeatureUsageAnalytics)

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Request validation with Zod
- Rate limiting
- SQL injection prevention (Prisma)
- XSS prevention
- CORS configuration
- Helmet security headers

## Environment Variables

See `.env.example` for all required environment variables:

- App configuration (NODE_ENV, PORT, CORS)
- Database (PostgreSQL URL)
- Redis URL
- JWT secrets
- AWS credentials (S3, SES, Textract)
- OpenRouter AI API key
- Razorpay credentials
- OAuth credentials (Google, Apple)

## Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Project structure setup
- [x] Database schema with Prisma
- [x] Configuration management
- [x] Middleware (auth, error, validation, rate-limit)
- [x] Shared utilities and exceptions
- [x] Express app setup

### Phase 2: Core Modules ✅ COMPLETE
- [x] Authentication module (register, login, JWT, password reset)
- [x] User management module (profile, stats, CRUD)
- [x] Token system (balance, transactions, deduction)
- [x] Notes upload & processing (S3, OCR ready)
- [x] AI integration (OpenRouter: GPT-4, Claude, Gemini)
- [x] Payment integration (Razorpay: orders, verification, webhooks)
- [x] Two separate frontends (User Portal + Admin Portal)

### Phase 3: Advanced Features ✅ COMPLETE
- [x] Subject & topic management (with hierarchy)
- [x] Question bank (MCQ, SAQ, TRUE_FALSE, IMAGE_BASED)
- [x] Test generation & evaluation (auto-scoring, analytics)
- [x] Analytics module (user, test, platform, revenue)
- [x] Email service (AWS SES with 8 templates)
- [x] OCR processor (AWS Textract + Tesseract.js)
- [x] BullMQ job queue (async processing)

### Phase 4: Polish & Production (Next)
- [ ] Testing (unit, integration, E2E)
- [ ] Performance optimization
- [ ] Additional UI components
- [ ] Mobile responsiveness
- [ ] Documentation & API docs
- [ ] Deployment guides

## Contributing

1. Follow the project structure guidelines
2. Write tests for new features
3. Follow TypeScript and ESLint rules
4. Use conventional commits
5. Update documentation

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for MBBS students**
