import {defineConfig} from "playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: {baseURL: "http://127.0.0.1:5000"},
  webServer: {command: "npm run demo", url: "http://127.0.0.1:5000/api/health", reuseExistingServer: false},
  projects: [{name: "desktop", use: {viewport: {width: 1280, height: 900}}}, {name: "mobile", use: {viewport: {width: 390, height: 844}}}]
});
