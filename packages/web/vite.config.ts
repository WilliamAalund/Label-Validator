import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    watch: {
      // Required for HMR when sources are synced into the container (Compose Watch / Docker Desktop on Windows)
      usePolling: true,
    },
  },
})
