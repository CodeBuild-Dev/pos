import './env'; // loads the root .env first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';
import { env } from './env';
import { authLimiter, apiLimiter } from './middleware/rateLimit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Behind a hosting proxy in production — lets rate limiting see the real client IP.
app.set('trust proxy', 1);

// Security headers. CSP is left off so the camera barcode scanner keeps working.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// tRPC API
app.use('/api/trpc', authLimiter, apiLimiter);
app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Serve built frontend in production
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(env.PORT, () => {
  console.log(`Shop POS server listening on port ${env.PORT}`);
});
