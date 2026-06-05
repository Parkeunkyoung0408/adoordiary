import { chromium, devices } from "playwright";

const URL = process.env.URL || "http://localhost:3000";
const out = process.env.OUT || "shot-bucket-demo.png";
const device = devices["iPhone 15 Pro"];

const browser = await chromium.launch();
const context = await browser.newContext({ ...device });
const page = await context.newPage();
await page.addInitScript(() => localStorage.removeItem("maeum_bucket"));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

await page.getByText("버킷", { exact: true }).first().click();
await page.waitForTimeout(400);

// Add a few presets
for (const phrase of ["오늘의 다짐 체크", "감정 환기하기", "따뜻한 차 마시기"]) {
  await page.getByText(phrase, { exact: true }).first().click();
  await page.waitForTimeout(300);
}
await page.waitForTimeout(400);

// Tap some units on the first tracker (habit grid)
const cells = page.locator('[aria-label^="격자"]');
const n = Math.min(4, await cells.count());
for (let i = 0; i < n; i++) {
  await cells.nth(i).click();
  await page.waitForTimeout(120);
}
await page.waitForTimeout(500);

await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("saved", out);
