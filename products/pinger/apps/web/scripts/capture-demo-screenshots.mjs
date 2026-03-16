import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = "http://localhost:3010";

const OUT_DIR = "/root/PastaOS/products/pinger/assets/screenshots";
const CHROME_PATH = "/usr/bin/chromium-browser";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  await ensureDir(OUT_DIR);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/demo/dashboard`, { waitUntil: "networkidle2" });
  await page.waitForSelector("h1", { timeout: 20000 });
  await wait(1500);

  await page.screenshot({
    path: path.join(OUT_DIR, "dashboard.png"),
    fullPage: true,
    type: "png",
  });

  await page.waitForSelector(".rounded-lg.border.p-4", { timeout: 20000 }).catch(() => null);
  const cards = await page.$$(".rounded-lg.border.p-4");
  if (cards.length > 0) {
    const box = await cards[0].boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(OUT_DIR, "monitor-detail.png"),
        clip: {
          x: Math.max(0, box.x - 16),
          y: Math.max(0, box.y - 16),
          width: Math.min(1280, box.width + 32),
          height: Math.min(800, box.height + 32),
        },
        type: "png",
      });
    }
  }

  await page.goto(`${BASE_URL}/status/smith-digital`, { waitUntil: "networkidle2" });
  await wait(1000);
  await page.screenshot({
    path: path.join(OUT_DIR, "status-page.png"),
    fullPage: true,
    type: "png",
  });

  await browser.close();
  console.log(`Saved screenshots to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
