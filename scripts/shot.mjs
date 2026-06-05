import { chromium, devices } from "playwright";

const URL = process.env.URL || "http://localhost:3000/edit";
const out = process.env.OUT || "shot.png";
const device = devices["iPhone 15 Pro"];

const browser = await chromium.launch();
const context = await browser.newContext({ ...device });
const page = await context.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("saved", out);
