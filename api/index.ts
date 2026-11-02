import express from 'express';
import { apiRouter } from '../server/routes/api';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount apiRouter on both /api and / to handle Vercel rewrites gracefully
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
