import { chromium, devices } from "playwright";

const URL = process.env.URL || "http://localhost:3000";
const DEVICE = process.env.DEVICE || "iPhone 15 Pro";
const device = devices[DEVICE] || devices["iPhone 15 Pro"];

const browser = await chromium.launch({
  headless: false,
  args: ["--window-position=80,40"],
});

const context = await browser.newContext({
  ...device,
});

const page = await context.newPage();
await page.goto(URL, { waitUntil: "load" });

console.log(`Opened ${URL} as ${device.viewport.width}x${device.viewport.height} (${DEVICE} emulation)`);
console.log("Close the browser window to exit.");

// Keep the process alive until the window/browser is closed.
await new Promise((resolve) => {
  browser.on("disconnected", resolve);
});
