import { chromium, devices } from "playwright";

const URL = process.env.URL || "http://localhost:3000";
const out = process.env.OUT || "shot-archive-demo.png";
const device = devices["iPhone 15 Pro"];

const browser = await chromium.launch();
const context = await browser.newContext({ ...device });
const page = await context.newPage();
await page.addInitScript(() => localStorage.removeItem("maeum_bucket"));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

await page.getByText("버킷", { exact: true }).first().click();
await page.waitForTimeout(400);

// Add the order preset (3 units) and complete it
await page.getByText("비워낼 생각 3가지", { exact: true }).first().click();
await page.waitForTimeout(400);

for (let i = 0; i < 3; i++) {
  await page.getByText(`우선순위 ${i + 1}`, { exact: true }).first().click();
  await page.waitForTimeout(250);
}
// wait for auto-archive
await page.waitForTimeout(1500);

await page.getByText("아카이브", { exact: true }).first().click();
await page.waitForTimeout(600);

await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("saved", out);
