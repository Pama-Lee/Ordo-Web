// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()],

  // The old benchmarks page is now the speed section of the engine page.
  redirects: {
    '/benchmarks': '/engine#speed',
    '/en/benchmarks': '/en/engine#speed',
    '/zh-TW/benchmarks': '/zh-TW/engine#speed',
  },
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['en', 'zh-CN', 'zh-TW'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});