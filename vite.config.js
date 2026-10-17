import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // three.js lands in a lazily loaded chunk of its own.
    chunkSizeWarningLimit: 700,
  },
});
