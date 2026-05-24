import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  analyzeLabel,
  analyzeOutcomeToResponse,
  parseVerifyLabelBatch,
  parseVerifyLabelImage,
  verifyLabelBatch,
} from './util/funcs.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Health check successful' });
});

const labelRouter = express.Router();

labelRouter.post('/verify', verifyLimiter, async (req, res) => {
  console.log('[labels/verify] analyzing label image');
  const parsedImage = parseVerifyLabelImage(req.body);
  if (!parsedImage.ok) {
    res.status(400).json({ error: parsedImage.error });
    return;
  }

  const outcome = await analyzeLabel(
    parsedImage.payload.image,
    parsedImage.payload.mediaType,
  );

  const response = analyzeOutcomeToResponse(outcome);
  res.status(response.httpStatus).json(response.body);
});

labelRouter.post('/verify-batch', verifyLimiter, async (req, res) => {
  const parsedBatch = parseVerifyLabelBatch(req.body);
  if (!parsedBatch.ok) {
    res.status(400).json({ error: parsedBatch.error });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'Label analysis is not configured.' });
    return;
  }

  const results = await verifyLabelBatch(parsedBatch.items);
  res.status(200).json({ results });
});

app.use('/labels', labelRouter);

export default app;
