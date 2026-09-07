import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// app.tenorworth.com — React SPA. /api/* is proxied to the backend in dev
// (same path nginx proxies in production, see deploy/nginx/tenorworth.conf).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8002', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});
