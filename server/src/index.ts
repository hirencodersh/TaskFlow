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

import { httpLogger } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { logger } from './lib/logger.js';

dotenv.config();

const app = express();

const port = Number(process.env.PORT) || 3001;

const clientOrigin =
  process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

// HTTP Server
const httpServer = createServer(app);

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    credentials: true,
  },
});

setSocketInstance(io);


// Middleware
app.use(httpLogger);
app.use(helmet());

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);


app.use(express.json());
app.use(cookieParser());

// Socket.IO connection
setupSocket(io);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);

app.use('/api/v1', commentRoutes);
app.use('/api/v1', attachmentRoutes);
app.use('/api/v1/labels', labelRoutes);
app.use('/api/v1/activity-logs', activityLogRoutes);
app.use('/api/v1/admin/users', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
  });
});

app.get('/api/v1/labels-test', (_req, res) => {
  res.json({
    status: 'labels-route-reachable',
  });
});



// Global error handler
app.use(errorHandler);

// Start server
httpServer.listen(port, () => {
  logger.info(
    `TaskFlow API listening on http://localhost:${port}`,
  );
});