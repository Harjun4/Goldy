import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { PORT, WORKSPACE_ROOT } from './server/config';
import { loadPayload, loadFullCandles } from './server/services/payloadStore';
import { syncSupabaseWithLatestData } from './server/services/supabaseSync';
import { apiRouter } from './server/routes/api';

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use('/api', apiRouter);

  try {
    const initialPayload = loadPayload(false);
    const initialCandles = loadFullCandles(false);
    syncSupabaseWithLatestData(initialPayload, initialCandles).catch(() => {});
  } catch (e) {}

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(WORKSPACE_ROOT, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Goldy Server listening on http://localhost:${PORT}`);
  });
}

startServer();
