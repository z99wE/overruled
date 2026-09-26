import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/**/*.{ts,tsx}', 'functions/lib/**/*.ts'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
      ],
      thresholds: {
        statements: 41,
        branches: 29,
        functions: 40,
        lines: 41,
      },
    },
  },
});