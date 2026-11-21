import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import './firebase.js';
import { serialize, HttpError } from './util.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.set('trust proxy', 1); // Render/Railway sit behind a proxy; needed for correct client IPs

app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    if (!origin || config.clientUrls.includes(origin)) return cb(null, true); // no Origin = curl/health checks
    cb(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret'],
}));
app.use(express.json({ limit: '100kb' }));
app.use((_req, res, next) => { const json = res.json.bind(res); res.json = (d) => json(serialize(d)); next(); });

const limiter = (windowMin, max) => rateLimit({
  windowMs: windowMin * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});
app.use('/api', limiter(15, 600));
app.use('/api/invitations', limiter(15, 120)); // token endpoints: stricter, makes guessing impractical

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err.message === 'Origin not allowed by CORS') return res.status(403).json({ error: 'Origin not allowed.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

app.listen(config.port, () => console.log(`Placecard API listening on port ${config.port}`));
