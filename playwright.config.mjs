import { defineConfig } from "@playwright/test";
process.env.PF_E2E_DB ||= "pf_test_e2e_" + Date.now().toString(36);
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: "list",
  globalTeardown: "./e2e/teardown.mjs",
  use: {
    baseURL: "http://127.0.0.1:5174",
    browserName: "chromium",
    channel:
      process.env.PW_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://127.0.0.1:5174",
    timeout: 45000,
    reuseExistingServer: false,
    env: {
      MONGODB_DB_NAME: process.env.PF_E2E_DB,
      PORT: "3002",
      FRONTEND_ORIGINS: "http://127.0.0.1:5174",
      API_PROXY_TARGET: "http://127.0.0.1:3002",
      DEMO_EMAIL: "browser@rutamotor.local",
      DEMO_PASSWORD: "BrowserTest2026!",
    },
  },
});
