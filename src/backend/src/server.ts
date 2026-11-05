import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
import propertyRoutes from './routes/properties';
import taskRoutes from './routes/tasks';
import visitRoutes from './routes/visits';
import activityRoutes from './routes/activities';
import dashboardRoutes from './routes/dashboard';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { env } from './config/env';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '1mb' }));

app.use('/health', (req, res) => res.json({ status: 'ok', service: 'inmofollow-ai' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`INMO FOLLOW AI escuchando en http://localhost:${env.port}`);
});

export default app;