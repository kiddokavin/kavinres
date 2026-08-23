import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        decisionSupport: resolve(__dirname, 'decision-support.html'),
      },
    },
  },
});
