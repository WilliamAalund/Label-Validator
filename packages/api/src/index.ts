import app from './app.config';

// Render (and most hosts) set PORT — default 3010 is for local Docker/dev only.
const PORT = Number(process.env.PORT) || 3010;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
});