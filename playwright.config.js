import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8107",
    headless: true,
    ...(!process.env.CI ? { channel: "chrome" } : {}),
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:8107",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
