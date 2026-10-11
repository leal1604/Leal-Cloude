import { expect, test } from "@playwright/test";

test("navegação inferior marca a página atual", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Lista" }).click();
  await expect(page).toHaveURL(/\/lista$/);
  await expect(page.getByRole("link", { name: "Lista" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current", "page");
  await page.goto("/lista?d=limpeza");
  await expect(page.getByRole("link", { name: "Lista" })).toHaveAttribute("aria-current", "page");
});
