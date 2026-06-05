import { chromium, devices } from "playwright";

const ROUTES = { 기록: "/edit", 버킷: "/bucket", 아카이브: "/archive", 설정: "/setting" };
const tab = process.env.TAB || "아카이브";
const path = process.env.ROUTE || ROUTES[tab] || "/archive";
const URL = process.env.URL || `http://localhost:3000${path}`;
const out = process.env.OUT || "shot-tab.png";
const device = devices["iPhone 15 Pro"];

const browser = await chromium.launch();
const context = await browser.newContext({ ...device });
const page = await context.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("saved", out);
