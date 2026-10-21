// Gera os ícones PNG (Android/PWA) a partir de icon.svg.
// Uso: node scripts/make-icons.mjs  (requer Playwright/Chromium)
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const svg = readFileSync(new URL("../icon.svg", import.meta.url), "utf8");
const browser = await chromium.launch();
const jobs = [
  { file: "icon-192.png", size: 192, inset: 0 },
  { file: "icon-512.png", size: 512, inset: 0 },
  // Ícone "maskable": o desenho fica dentro da zona segura (80%) com fundo a toda a área.
  { file: "icon-maskable-512.png", size: 512, inset: 0.1 },
];
for (const { file, size, inset } of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const pad = Math.round(size * inset);
  const inner = svg.replace("<svg ", `<svg width="${size - pad * 2}" height="${size - pad * 2}" `).replace(' rx="16"', inset ? "" : ' rx="16"');
  await page.setContent(`<body style="margin:0;background:${inset ? "#5F7BFF" : "transparent"};width:${size}px;height:${size}px;display:grid;place-items:center">${inner}</body>`);
  await page.screenshot({ path: new URL("../" + file, import.meta.url).pathname, omitBackground: !inset });
  await page.close();
}
await browser.close();
console.log("Ícones gerados.");
