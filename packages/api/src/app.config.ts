import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many requests, please try again later.',
});

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Health check successful' });
});

app.post('/verify-label', verifyLimiter, (req, res) => {
  const { label } = req.body;
  res.status(200).json({ message: 'Label verified' });
});

app.post('/verify-label-batch', verifyLimiter, (req, res) => {
  const { labels } = req.body;
  res.status(200).json({ message: 'Label batch verified' });
});

export default app;