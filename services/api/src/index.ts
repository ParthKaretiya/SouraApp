import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { routesRouter } from './routes/routesRouter.js';

const app = express();
const PORT = process.env.PORT || 3000;
const START_TIME = Date.now();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

/**
 * GET /api/health
 * System health check endpoint for mobile client and infrastructure monitoring.
 */
app.get('/api/health', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.round((Date.now() - START_TIME) / 1000);

  res.status(200).json({
    status: 'ok',
    service: 'sauraroute-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
  });
});

// Mount Routes Router
app.use('/api/routes', routesRouter);

// Start listening
const server = app.listen(PORT, () => {
  console.log(`[SauraRoute API] Server running on http://localhost:${PORT}`);
  console.log(`[SauraRoute API] Health endpoint active at http://localhost:${PORT}/api/health`);
  console.log(`[SauraRoute API] Optimize route endpoint active at http://localhost:${PORT}/api/routes/optimize`);
  console.log(`[SauraRoute API] Reroute endpoint active at http://localhost:${PORT}/api/routes/reroute`);
});

// Graceful termination handling
process.on('SIGTERM', () => {
  console.log('[SauraRoute API] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SauraRoute API] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
