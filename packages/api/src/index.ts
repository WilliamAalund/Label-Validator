import app from './app.config';

const PORT = Number(process.env.PORT) || 3010;

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});