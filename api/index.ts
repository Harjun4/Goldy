import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../server/routes/api';

const app = express();

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount apiRouter on both /api and / to handle Vercel rewrites gracefully
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global JSON error handler so serverless never returns raw HTML 500 error pages
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Goldy Serverless Error]:', err);
  res.status(500).json({
    status: 'error',
    message: err?.message || 'Terjadi kesalahan pada server backend.',
    detail: String(err),
  });
});

export default app;
