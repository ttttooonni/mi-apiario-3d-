import { defineConfig, devices } from '@playwright/test';

// Serves the production build under the same /mi-apiario-3d-/ prefix as GitHub Pages.
const BASE = process.env.E2E_URL ?? 'http://localhost:4173/mi-apiario-3d-/';
export default defineConfig({
  testDir: 'e2e',
  timeout: process.env.CI ? 180_000 : 60_000,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
  use: { baseURL: BASE, launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.E2E_URL ? undefined : { command: 'npx vite preview --base /mi-apiario-3d-/ --port 4173 --strictPort', url: BASE, reuseExistingServer: true },
});
