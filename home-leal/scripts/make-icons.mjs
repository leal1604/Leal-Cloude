// Gera os ícones PNG da app (Android/PWA) a partir do desenho do logótipo.
// Uso: node scripts/make-icons.mjs  (requer Playwright/Chromium)
import { chromium } from "@playwright/test";

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
<rect width="64" height="64" fill="#637657"/>
<g transform="translate(6.4 6.4) scale(0.8)">
<path d="M17 30.5 32 18l15 12.5V46a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2Z" fill="#f5efe5"/>
<path d="M32 42.5c-5.5-3.2-8-6-8-9.1 0-2.3 1.8-4 4-4 1.7 0 3.1 1 4 2.4.9-1.4 2.3-2.4 4-2.4 2.2 0 4 1.7 4 4 0 3.1-2.5 5.9-8 9.1Z" fill="#93a685"/>
</g></svg>`;

const browser = await chromium.launch();
for (const size of [192, 512, 180]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0">${svg(size)}</body>`);
  const name = size === 180 ? "src/app/apple-icon.png" : `public/icon-${size}.png`;
  await page.screenshot({ path: name, omitBackground: false });
  await page.close();
}
await browser.close();
console.log("Ícones gerados.");
