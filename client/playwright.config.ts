import { defineConfig, devices } from "@playwright/test";

const CLIENT_PORT = 5173;
const SERVER_PORT = 3001;
const BASE_URL = `http://localhost:${CLIENT_PORT}`;

/**
 * End-to-end tests run the real client, the real server and a real database.
 * They must never point at the development Supabase instance, so the database
 * URL comes from TEST_DATABASE_URL and `client/e2e/global-setup.ts` refuses to
 * run if it matches DATABASE_URL. See client/e2e/README.md.
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "";

const serverEnv = {
  NODE_ENV: "test",
  PORT: String(SERVER_PORT),
  CLIENT_ORIGIN: BASE_URL,
  DATABASE_URL: testDatabaseUrl,
  DIRECT_URL: process.env.TEST_DIRECT_URL ?? testDatabaseUrl,
  JWT_SECRET: process.env.TEST_JWT_SECRET ?? "e2e-jwt-secret",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "e2e-placeholder-key",
  // The suite creates and deletes a lot of rows in a short window; the
  // production limits would trip partway through a run.
  RATE_LIMIT_MAX: "100000",
  AI_RATE_LIMIT_MAX: "100000",
};

export default defineConfig({
  testDir: "./e2e/tests",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      command: "npm run server",
      cwd: "../server",
      url: `http://localhost:${SERVER_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      env: serverEnv,
    },
    {
      command: "npm run dev",
      cwd: ".",
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
