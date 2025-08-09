import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

// Import routes
import statusRoutes from './routes/status.js';
import userRoutes from './routes/users.js';
import teamRoutes from './routes/teams.js';
import appRoutes from './routes/apps.js';
import reportRoutes from './routes/reports.js';
import vulnRoutes from './routes/vulns.js';
import viewRoutes from './routes/views.js';
import settingsRoutes from './routes/settings.js';
import authRoutes from './routes/auth.js';

// Import database connection
import { connectToDatabase } from './config/database.js';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// Register security plugins
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
});

// Register CORS
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Register rate limiting
await fastify.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  timeWindow: process.env.RATE_LIMIT_WINDOW_MS || '15 minutes',
  errorResponseBuilder: function (request, context) {
    return {
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`,
      date: Date.now(),
      expiresIn: context.ttl
    };
  }
});

// Register routes
await fastify.register(statusRoutes, { prefix: '/api' });
await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(userRoutes, { prefix: '/api' });
await fastify.register(teamRoutes, { prefix: '/api' });
await fastify.register(appRoutes, { prefix: '/api' });
await fastify.register(reportRoutes, { prefix: '/api' });
await fastify.register(vulnRoutes, { prefix: '/api' });
await fastify.register(viewRoutes, { prefix: '/api' });
await fastify.register(settingsRoutes, { prefix: '/api' });

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Global error handler
fastify.setErrorHandler(function (error, request, reply) {
  fastify.log.error(error);
  
  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation
    });
  }

  // Handle not found errors
  if (error.statusCode === 404) {
    return reply.status(404).send({
      error: 'Not Found',
      message: 'The requested resource was not found'
    });
  }

  // Handle unauthorized errors
  if (error.statusCode === 401) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Handle forbidden errors
  if (error.statusCode === 403) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Access denied'
    });
  }

  // Default error response
  reply.status(error.statusCode || 500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  fastify.log.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await fastify.close();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    // Connect to database
    await connectToDatabase();
    
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    fastify.log.info(`Server is running on http://${host}:${port}`);
    fastify.log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 