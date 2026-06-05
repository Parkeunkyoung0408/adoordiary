import { chromium, devices } from "playwright";

const URL = process.env.URL || "http://localhost:3000";
const out = process.env.OUT || "shot-tab.png";
const tab = process.env.TAB || "아카이브";
const device = devices["iPhone 15 Pro"];

const browser = await chromium.launch();
const context = await browser.newContext({ ...device });
const page = await context.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

try {
  await page.getByText(tab, { exact: true }).first().click({ timeout: 5000 });
} catch (e) {
  console.log("tab click failed:", e.message);
}
await page.waitForTimeout(800);

await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("saved", out);
