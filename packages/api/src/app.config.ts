import express from 'express';
import rateLimit from 'express-rate-limit';
import { analyzeLabel, parseVerifyLabelImage } from './util/funcs.js';

const app = express();

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many requests, please try again later.',
});

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Health check successful' });
});

const labelRouter = express.Router();

labelRouter.post('/verify', verifyLimiter, async (req, res) => {
  const parsedImage = parseVerifyLabelImage(req.body);
  if (!parsedImage.ok) {
    res.status(400).json({ error: parsedImage.error });
    return;
  }

  const outcome = await analyzeLabel(
    parsedImage.payload.image,
    parsedImage.payload.mediaType,
  );

  switch (outcome.status) {
    case 'success':
      res.status(200).json({ data: outcome.data });
      return;
    case 'missing_api_key':
      res.status(503).json({ error: 'Label analysis is not configured.' });
      return;
    case 'no_text':
      res.status(502).json({ error: 'Model returned no text response.' });
      return;
    case 'invalid_json':
      res.status(502).json({ error: 'Model response was not valid JSON.', rawText: outcome.rawText });
      return;
    case 'schema_error':
      res.status(422).json({
        error: 'Model response did not match label extraction schema.',
        issues: outcome.issues,
        rawText: outcome.rawText,
      });
      return;
    case 'upstream_error':
      res.status(502).json({ error: outcome.message });
      return;
    default: {
      const _exhaustive: never = outcome;
      res.status(500).json({ error: 'Unexpected analysis error.' });
      return _exhaustive;
    }
  }
});

labelRouter.post('/verify-batch', verifyLimiter, (req, res) => {
  const { labels } = req.body;
  res.status(200).json({ message: 'Label batch verified' });
});

app.use('/labels', labelRouter);

export default app;
