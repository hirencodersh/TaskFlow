import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './modules/auth/auth.routes.js';
import projectRoutes from './modules/projects/project.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import commentRoutes from './modules/comments/comment.routes.js';
import attachmentRoutes from './modules/attachments/attachment.routes.js';
import labelRoutes from './modules/labels/label.routes.js';
import activityLogRoutes from './modules/activity-logs/activity-log.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

import { setupSocket } from './lib/socket.js';
import { setSocketInstance } from './lib/socket-instance.js';
import { logger } from './lib/logger.js';

import { httpLogger } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();

/*
|--------------------------------------------------------------------------
| Environment
|--------------------------------------------------------------------------
*/

const port = Number(process.env.PORT) || 3001;

const clientOrigin =
  process.env.CLIENT_ORIGIN || 'http://localhost:5173';

/*
|--------------------------------------------------------------------------
| HTTP Server
|--------------------------------------------------------------------------
*/

const httpServer = createServer(app);

/*
|--------------------------------------------------------------------------
| Socket.IO
|--------------------------------------------------------------------------
*/

const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    credentials: true,
  },
});

setSocketInstance(io);

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

app.use(httpLogger);

app.use(
  helmet(),
);

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  }),
);

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Socket Connection
|--------------------------------------------------------------------------
*/

setupSocket(io);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/projects', projectRoutes);

app.use('/api/v1/tasks', taskRoutes);

app.use('/api/v1', commentRoutes);

app.use('/api/v1', attachmentRoutes);

app.use('/api/v1/labels', labelRoutes);

app.use('/api/v1/activity-logs', activityLogRoutes);

app.use('/api/v1/admin/users', adminRoutes);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/api/health', (_req, res) => {
  return res.status(200).json({
    success: true,
    status: 'ok',
  });
});

/*
|--------------------------------------------------------------------------
| Labels Test
|--------------------------------------------------------------------------
*/

app.get('/api/v1/labels-test', (_req, res) => {
  return res.status(200).json({
    success: true,
    status: 'labels-route-reachable',
  });
});

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
|
| Any request that doesn't match a route reaches this middleware.
| It forwards the error to the global error handler.
|
*/

app.use((req, _res, next) => {
  const error = new Error(
    `Route not found: ${req.method} ${req.originalUrl}`,
  );

  (error as Error & { statusCode?: number }).statusCode = 404;

  next(error);
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This MUST be the last app.use().
|
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

httpServer.listen(port, '0.0.0.0', () => {
  logger.info(
    `TaskFlow API listening on port ${port}`,
  );

  logger.info(
    `Client origin: ${clientOrigin}`,
  );
});

/*
|--------------------------------------------------------------------------
| Server Error Handling
|--------------------------------------------------------------------------
*/

httpServer.on('error', (error) => {
  logger.error(error);
});

export default app;