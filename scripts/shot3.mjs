import { chromium, devices } from "playwright";

const URL = process.env.URL || "http://localhost:3000";
const out = process.env.OUT || "shot3.png";
const device = devices["iPhone 15 Pro"];

const browser = await chromium.launch();
const context = await browser.newContext({ ...device });
const page = await context.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const vp = page.viewportSize();
const cx = vp.width / 2;
const cy = vp.height / 2;

async function swipeLeft() {
  await page.mouse.move(cx + 120, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 120, cy, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(600);
}

await swipeLeft();
await swipeLeft();
await page.waitForTimeout(600);

await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("saved", out);
