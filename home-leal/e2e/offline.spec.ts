import { expect, test } from "@playwright/test";

test("abre sem ligação à internet depois da primeira visita", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByTestId("estimated-total")).toBeVisible();
  await context.setOffline(true);
  await page.goto("/lista");
  await expect(page.getByRole("heading", { name: "Lista de compras" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Nossa casa, tudo organizado.")).toBeVisible();
  await context.setOffline(false);
});

test("manifesto e privacidade disponíveis", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.name).toBe("Home Leal");
  expect(manifest.icons.length).toBeGreaterThan(0);
  expect((await request.get("/privacidade")).status()).toBe(200);
  expect((await request.get("/screenshots/inicio.png")).status()).toBe(200);
});
