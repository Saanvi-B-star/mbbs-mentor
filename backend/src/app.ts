import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { config, stream } from './config';
import { passport } from './config/passport'; // Import passport configuration
import {
  errorMiddleware,
  globalRateLimiter,
  loggingMiddleware,
  requestIdMiddleware,
} from './middleware';
import { API_VERSION } from './shared/constants';

/**
 * Express Application Setup
 */
const app: Application = express();

// ==================== SECURITY MIDDLEWARE ====================

// Helmet - Security headers with CSP configured for static assets
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable CSP to allow images from same origin
  })
);

// CORS - Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = config.corsOrigin;
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ==================== PARSING MIDDLEWARE ====================

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== PASSPORT INITIALIZATION ====================

// Initialize Passport for OAuth authentication
// Note: We use JWT tokens (stateless), NOT sessions
app.use(passport.initialize());

// ==================== STATIC FILES ====================

import path from 'path';
// Serve static files from public directory
// Mount at /api/v1 to match frontend expectation (NEXT_PUBLIC_API_URL + fileUrl)
app.use('/api/v1', express.static(path.join(__dirname, '../public')));
// Also mount at root for direct access
app.use(express.static(path.join(__dirname, '../public')));

// ==================== COMPRESSION ====================

app.use(compression());

// ==================== LOGGING ====================

// HTTP request logging (Morgan)
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream }));
}

// Request ID middleware
app.use(requestIdMiddleware);

// Custom API logging middleware
app.use(loggingMiddleware);

// ==================== RATE LIMITING ====================

// Global rate limiter
app.use(globalRateLimiter);

// ==================== HEALTH CHECK ====================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    },
  });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'MBBS Mentor API',
    data: {
      version: '1.0.0',
      status: 'running',
      environment: config.nodeEnv,
      docs: '/api/docs',
    },
  });
});

// ==================== API DOCUMENTATION (SWAGGER) ====================

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './config/swagger.config';

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MBBS Mentor API Documentation',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ==================== API ROUTES ====================

// Import routes from modules
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/user';
import { tokenRoutes } from './modules/token';
import { paymentRoutes } from './modules/payment';
import { notesRoutes } from './modules/notes';
import { subjectRoutes } from './modules/subject';
import { topicRoutes } from './modules/topic';
import { questionRoutes } from './modules/question';
import { testRoutes } from './modules/test';
import { analyticsRoutes } from './modules/analytics';
import { studentGoalsRoutes } from './modules/studentGoals'; // ADD THIS LINE
import { studyMaterialRoutes } from './modules/studyMaterial';
import { llmRoutes } from './modules/llm';
import { ragRoutes } from './modules/rag';

// Mount routes
app.use(`${API_VERSION.V1}/auth`, authRoutes);
app.use(`${API_VERSION.V1}/users`, userRoutes);
app.use(`${API_VERSION.V1}/tokens`, tokenRoutes);
app.use(`${API_VERSION.V1}/payments`, paymentRoutes);
app.use(`${API_VERSION.V1}/notes`, notesRoutes);
app.use(`${API_VERSION.V1}/subjects`, subjectRoutes);
app.use(`${API_VERSION.V1}/topics`, topicRoutes);
app.use(`${API_VERSION.V1}/questions`, questionRoutes);
app.use(`${API_VERSION.V1}/tests`, testRoutes);
app.use(`${API_VERSION.V1}/analytics`, analyticsRoutes);
app.use(`${API_VERSION.V1}/student-goals`, studentGoalsRoutes); // ADD THIS LINE
app.use(`${API_VERSION.V1}/study-material`, studyMaterialRoutes);
app.use(`${API_VERSION.V1}/llm`, llmRoutes);
app.use(`${API_VERSION.V1}/rag`, ragRoutes);

// API info endpoint
app.get(`${API_VERSION.V1}`, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'MBBS Mentor API v1',
    data: {
      version: 'v1',
      status: 'operational',
      endpoints: {
        auth: `${API_VERSION.V1}/auth`,
        users: `${API_VERSION.V1}/users`,
        tokens: `${API_VERSION.V1}/tokens`,
        payments: `${API_VERSION.V1}/payments`,
        ai: `${API_VERSION.V1}/ai`,
        notes: `${API_VERSION.V1}/notes`,
        subjects: `${API_VERSION.V1}/subjects`,
        topics: `${API_VERSION.V1}/topics`,
        questions: `${API_VERSION.V1}/questions`,
        tests: `${API_VERSION.V1}/tests`,
        analytics: `${API_VERSION.V1}/analytics`,
        studentGoals: `${API_VERSION.V1}/student-goals`, // ADD THIS LINE
        llm: `${API_VERSION.V1}/llm`,
        rag: `${API_VERSION.V1}/rag`,
      },
      documentation: '/api/docs',
    },
  });
});

// ==================== 404 HANDLER ====================

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested route ${req.originalUrl} does not exist`,
    },
  });
});

// ==================== GLOBAL ERROR HANDLER ====================

app.use(errorMiddleware);

export default app;