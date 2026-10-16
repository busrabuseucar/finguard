import {test, expect} from "playwright/test";

test("demo through real server; edits clear stale output and unsupported input fails", async ({page}) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("ÖRNEK DEMO");
  await page.getByRole("button", {name: "Örnek Mesajı Doldur"}).click();
  await page.getByRole("button", {name: "Analiz Et", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Kritik Risk"})).toBeVisible();
  await expect(page.getByText("Sabit örnek sonuç — canlı model çıktısı değildir.")).toBeVisible();
  await page.getByLabel("İncelenecek mesaj").fill("Başka bir mesaj");
  await expect(page.getByRole("heading", {name: "Kritik Risk"})).toHaveCount(0);
  await page.getByRole("button", {name: "Analiz Et", exact: true}).click();
  await expect(page.getByRole("alert")).toContainText("Demo yalnızca");
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("malformed success response cannot crash UI or become a score", async ({page}) => {
  await page.route("**/api/analyze", route => route.fulfill({json: {riskScore: 80, reasons: "not-array", mode: "live"}}));
  await page.goto("/");
  await page.getByRole("button", {name: "Örnek Mesajı Doldur"}).click();
  await page.getByRole("button", {name: "Analiz Et", exact: true}).click();
  await expect(page.getByRole("alert")).toContainText("Geçersiz analiz yanıtı");
  await expect(page.locator(".score")).toHaveCount(0);
});

test("live mode requires consent and renders validated analysis", async ({page}) => {
  const {sampleAnalysis} = await import("../src/example.js");
  await page.route("**/api/health", route => route.fulfill({json: {mode: "live", configured: true}}));
  await page.route("**/api/analyze", route => route.fulfill({json: {...sampleAnalysis, mode: "live"}}));
  await page.goto("/");
  await page.getByRole("button", {name: "Örnek Mesajı Doldur"}).click();
  await expect(page.getByRole("button", {name: "Analiz Et", exact: true})).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name: "Analiz Et", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Kritik Risk"})).toBeVisible();
});
