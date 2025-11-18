import { Options } from 'swagger-jsdoc';
import { config } from './environment';

/**
 * Swagger/OpenAPI 3.0 Configuration
 * Documentation will be available at /api-docs
 */
export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MBBS Mentor API',
      version: '1.0.0',
      description:
        'AI-powered learning platform for medical students preparing for MBBS exams. ' +
        'This API provides endpoints for user authentication, AI-powered learning tools, ' +
        'practice tests, note management, and more.',
      contact: {
        name: 'MBBS Mentor Support',
        email: 'support@mbbsmentor.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: config.isDevelopment ? `http://localhost:${config.port}` : 'https://api.mbbsmentor.com',
        description: config.isDevelopment ? 'Development Server' : 'Production Server',
      },
      {
        url: `http://localhost:${config.port}`,
        description: 'Local Development',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and user management endpoints',
      },
      {
        name: 'Users',
        description: 'User profile and account management',
      },
      {
        name: 'AI',
        description: 'AI-powered learning tools (chat, notes generation, summaries)',
      },
      {
        name: 'Tests',
        description: 'Practice tests, mock exams, and test attempts',
      },
      {
        name: 'Questions',
        description: 'Question bank management',
      },
      {
        name: 'Notes',
        description: 'Upload and manage study notes with OCR processing',
      },
      {
        name: 'Subjects',
        description: 'Medical subjects and topics hierarchy',
      },
      {
        name: 'Topics',
        description: 'Topic management within subjects',
      },
      {
        name: 'Tokens',
        description: 'Token balance and transaction management',
      },
      {
        name: 'Payments',
        description: 'Subscription plans and payment processing',
      },
      {
        name: 'Analytics',
        description: 'User performance analytics and insights',
      },
      {
        name: 'Health',
        description: 'API health check and status',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from the /api/v1/auth/login or /api/v1/auth/register endpoint',
        },
      },
      schemas: {
        // Standard Response Schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'An error occurred',
            },
            code: {
              type: 'string',
              example: 'VALIDATION_ERROR',
            },
            details: {
              type: 'object',
              nullable: true,
            },
          },
        },
        // User Schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'student@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
              example: 'STUDENT',
            },
            mbbsYear: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              nullable: true,
              example: 3,
            },
            college: {
              type: 'string',
              nullable: true,
              example: 'AIIMS Delhi',
            },
            university: {
              type: 'string',
              nullable: true,
              example: 'Delhi University',
            },
            profilePicture: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/profile.jpg',
            },
            emailVerified: {
              type: 'boolean',
              example: true,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            currentTokenBalance: {
              type: 'integer',
              example: 1000,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Auth Schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'student@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'SecurePass123!',
              description: 'Minimum 8 characters, must include uppercase, lowercase, number, and special character',
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'John Doe',
            },
            mbbsYear: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              nullable: true,
              example: 3,
            },
            college: {
              type: 'string',
              nullable: true,
              example: 'AIIMS Delhi',
            },
            university: {
              type: 'string',
              nullable: true,
              example: 'Delhi University',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'student@example.com',
            },
            password: {
              type: 'string',
              example: 'SecurePass123!',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login successful',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        // Token Balance Schema
        TokenBalance: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              format: 'uuid',
            },
            currentBalance: {
              type: 'integer',
              example: 1000,
            },
            totalEarned: {
              type: 'integer',
              example: 5000,
            },
            totalSpent: {
              type: 'integer',
              example: 4000,
            },
          },
        },
        // Pagination Schema
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 100,
            },
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 10,
            },
            totalPages: {
              type: 'integer',
              example: 10,
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Unauthorized access',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Forbidden access',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: {
                  field: 'email',
                  message: 'Invalid email format',
                },
              },
            },
          },
        },
        InsufficientTokensError: {
          description: 'Insufficient token balance',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Insufficient tokens',
                code: 'INSUFFICIENT_TOKENS',
              },
            },
          },
        },
      },
    },
    security: [],
  },
  apis: [
    './src/routes/*.ts',
    './src/modules/*/routes/*.ts',
    './src/modules/*/*.routes.ts',
  ],
};

export default swaggerOptions;
