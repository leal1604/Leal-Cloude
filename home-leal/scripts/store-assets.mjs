// Gera as imagens para a ficha da Play Store (capturas 1080x1920 e imagem de destaque 1024x500).
// Uso: npm run build && npm run start -- -p 3100  (noutro terminal)  e depois  node scripts/store-assets.mjs
import { chromium } from "@playwright/test";
import { copyFileSync, readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const now = new Date().toISOString();
const demo = [
  ["Arroz agulha", "mercearia", 2, "un", 1.29, "", false],
  ["Azeite virgem extra", "mercearia", 1, "L", 7.49, "", false],
  ["Maçãs", "frutas-legumes", 1.5, "kg", 1.99, "Gala ou Fuji", false],
  ["Bananas", "frutas-legumes", 1, "kg", 1.29, "", true, 1.25],
  ["Detergente da loiça", "limpeza", 1, "un", 2.19, "", false],
  ["Leite meio-gordo", "laticinios", 6, "L", 0.85, "", true, 5.1],
  ["Iogurtes naturais", "laticinios", 1, "emb", 1.89, "", false],
  ["Peito de frango", "proteinas", 1, "kg", 6.49, "", false],
  ["Pão de forma", "padaria", 1, "un", 1.59, "Integral", false],
  ["Água com gás", "bebidas", 6, "un", 0.45, "", false],
].map(([name, department, quantity, unit, unitPrice, notes, bought, pricePaid], i) => ({
  id: `demo-${i}`, name, department, quantity, unit, unitPrice, notes, bought,
  pricePaid: bought ? pricePaid : null, createdAt: now, updatedAt: now,
}));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "pt-PT",
});
await ctx.addInitScript((items) => {
  if (!localStorage.getItem("home-leal:items:v1")) localStorage.setItem("home-leal:items:v1", JSON.stringify(items));
}, demo);
const page = await ctx.newPage();
const shot = (name) => page.screenshot({ path: `play-store/${name}.png` });

await page.goto(`${BASE}/`);
await page.getByTestId("estimated-total").waitFor();
await shot("1-inicio");
await page.goto(`${BASE}/lista`);
await page.getByRole("heading", { name: /Mercearia/ }).waitFor();
await shot("2-lista");
await page.getByRole("button", { name: "Editar Maçãs" }).click();
await page.getByRole("dialog").waitFor();
await page.waitForTimeout(400);
await shot("3-editar");
await page.getByRole("button", { name: "Fechar" }).click();
await page.getByRole("button", { name: "Partilhar pelo WhatsApp" }).click();
await page.getByRole("dialog").waitFor();
await page.waitForTimeout(400);
await shot("4-partilhar");
await ctx.close();

// Imagem de destaque 1024x500
const fg = await browser.newPage({ viewport: { width: 1024, height: 500 } });
const icon = readFileSync("src/app/icon.svg", "utf8");
await fg.setContent(`<html><body style="margin:0;width:1024px;height:500px;display:flex;align-items:center;gap:56px;padding:0 90px;box-sizing:border-box;background:#f5efe5;font-family:Georgia,serif">
  <div style="width:220px;height:220px;flex-shrink:0">${icon.match(/<svg[\s\S]*<\/svg>/)[0].replace("<svg", '<svg width="220" height="220"')}</div>
  <div><div style="font-size:84px;font-weight:600;color:#3b4735;line-height:1">Home Leal</div>
  <div style="font-family:sans-serif;font-size:34px;color:#637657;margin-top:18px">Nossa casa, tudo organizado.</div></div>
</body></html>`);
await fg.screenshot({ path: "play-store/feature-graphic.png" });
await browser.close();

copyFileSync("play-store/1-inicio.png", "public/screenshots/inicio.png");
copyFileSync("play-store/2-lista.png", "public/screenshots/lista.png");
copyFileSync("public/icon-512.png", "play-store/icon-512.png");
console.log("Imagens da Play Store geradas em play-store/");
