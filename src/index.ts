import 'dotenv/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || 'hrms-api@1.0.0',
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    if (event.request?.data) {
      try {
        const body = typeof event.request.data === 'string' ? JSON.parse(event.request.data) : event.request.data;
        if (body.password) body.password = '[SCRUBBED]';
        if (body.password_hash) body.password_hash = '[SCRUBBED]';
        if (body.token) body.token = '[SCRUBBED]';
        if (body.accessToken) body.accessToken = '[SCRUBBED]';
        if (body.refreshToken) body.refreshToken = '[SCRUBBED]';
        event.request.data = body;
      } catch (e) {
        // ignore
      }
    }
    return event;
  }
});

process.on('uncaughtException', (err: any) => {
  if (err.code !== 'ECONNREFUSED') console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason: any, promise) => {
  if (reason && reason.code === 'ECONNREFUSED') return;
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

import express from 'express';
import http from 'http';
import { initSocket } from './socket.ts';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { globalLimiter, authLimiter } from './middleware/security.ts';
import authRoutes from './routes/auth.ts';
import employeeRoutes from './routes/employees.ts';
import selfServiceRoutes from './routes/self-service.ts';
import loanRoutes from './routes/loans.ts';
import orgRoutes from './routes/org.ts';
import payrollRoutes from './routes/payroll.ts';
import leaveRoutes from './routes/leave.ts';
import attendanceRoutes from './routes/attendance.ts';
import holidayRoutes from './routes/holidays.ts';
import salaryRoutes from './routes/salary.ts';
import dashboardRoutes from './routes/dashboard.ts';
import analyticsRoutes from './routes/analytics.ts';
import taxRoutes from './routes/tax.ts';
import announcementRoutes from './routes/announcement.ts';
import performanceRoutes from './routes/performance.ts';
import reimbursementRoutes from './routes/reimbursement.ts';
import documentRoutes from './routes/document.ts';
import searchRoutes from './routes/search.ts';
import accountRoutes from './routes/account.ts';
import auditRoutes from './routes/audit.ts';
import adminRoutes from './routes/admin.ts';
import notificationRoutes from './routes/notifications.ts';
import companyRoutes from './routes/company.ts';
import healthRoutes from './routes/health.ts';
import complianceRoutes from './routes/compliance.ts';
import intelligenceRoutes from './routes/intelligence.ts';
import { errorHandler } from './middleware/error.ts';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.ts';

import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './lib/prisma.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Proxy for Rate Limiting behind Load Balancers (Railway, Render, Nginx, etc.)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  hsts: process.env.NODE_ENV === 'production', // HSTS only in production
}));

app.use(cors({
    origin: process.env.FRONTEND_URL 
      ? [process.env.FRONTEND_URL]
      : [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5174',
          'http://127.0.0.1:5174',
          'http://localhost:5175',
          'http://127.0.0.1:5175',
          'http://localhost:4173',
          'http://127.0.0.1:4173',
          'http://localhost:5182',
          'http://127.0.0.1:5182'
      ],
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Cache-Control'
    ],
    exposedHeaders: ['Content-Disposition']
}));

app.use(cookieParser());
app.use(express.json());

import { requestIdMiddleware } from './middleware/request-id.ts';
app.use(requestIdMiddleware);

// Structured Logging with Winston
app.use((req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Routes
// Apply authLimiter specifically to auth routes first
app.use('/api/auth', authLimiter, authRoutes);

// Global Rate Limiter for ALL OTHER API routes
// This will not be reached by /api/auth because authRoutes will have already responded
app.use('/api', globalLimiter);

app.use('/api/employees', employeeRoutes);
app.use('/api/self-service', selfServiceRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/salary', salaryRoutes);
import salaryComponentRoutes from './routes/salary-components.ts';
app.use('/api/salary-components', salaryComponentRoutes);
import salaryStructureRoutes from './routes/salary-structures.ts';
app.use('/api/salary-structures', salaryStructureRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/intelligence', intelligenceRoutes);

app.use('/health', healthRoutes);

app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error("Sentry Backend Test");
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to HRMS & Payroll API' });
});

// Error Handling
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

import expressListEndpoints from 'express-list-endpoints';

const server = http.createServer(app);
const io = initSocket(server);

server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  if (error.code === 'EADDRINUSE') {
    console.error(`\n[FATAL ERROR] Port ${PORT} is already in use.`);
    console.error(`[FATAL ERROR] Terminating process to prevent duplicate server startup.`);
    process.exit(1);
  }
  throw error;
});

const gracefulShutdown = async (signal: string) => {
  
  io.close(() => {
  });
  
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error('Error disconnecting Prisma:', err);
    }
    // We do not hold a permanent SMTP connection, so we don't need to close it.
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

server.listen(PORT, async () => {
  
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error('Database Connection: FAILED', err);
  }
  
  
  const endpoints = expressListEndpoints(app);
  endpoints.forEach(route => {
    route.methods.forEach(method => {
    });
  });
});

export default app;
