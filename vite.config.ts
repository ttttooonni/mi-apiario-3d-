import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base: the same build works at https://ttttooonni.github.io/mi-apiario-3d-/ and in local preview.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: { output: { manualChunks: id => (id.includes('node_modules/three') ? 'three' : undefined) } },
    chunkSizeWarningLimit: 700,
  },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
