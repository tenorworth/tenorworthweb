import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static marketing site for tenorworth.com. Built to dist/ and served by nginx
// on the shared VPS (see deploy/). No server runtime, no adapter.
export default defineConfig({
  site: 'https://tenorworth.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
