import { expect, test } from "@playwright/test";

const norm = (s: string | null) => (s ?? "").replace(/ /g, " ");

test("fluxo completo da lista de compras", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Nossa casa, tudo organizado.")).toBeVisible();
  expect(norm(await page.getByTestId("estimated-total").textContent())).toBe("0,00 €");

  // Adicionar produto com preço
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.getByLabel("Nome").fill("Arroz agulha");
  await page.getByLabel("Quantidade", { exact: true }).fill("2");
  await page.getByLabel(/Preço estimado/).fill("1,29");
  await expect(page.getByText("Total estimado:")).toContainText("2,58");
  await page.getByRole("button", { name: "Adicionar à lista" }).click();

  // Adicionar produto noutro departamento, em kg, com observação
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.getByLabel("Nome").fill("Maçãs");
  await page.getByRole("dialog").getByText("Frutas e Legumes").click();
  await page.getByLabel("Unidade", { exact: true }).selectOption("kg");
  await page.getByLabel("Quantidade", { exact: true }).fill("1,5");
  await page.getByLabel(/Preço estimado/).fill("2");
  await page.getByLabel("Observações").fill("Gala");
  await page.getByRole("button", { name: "Adicionar à lista" }).click();

  // Validação: nome obrigatório
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar à lista" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("Indique o nome do produto.");
  await page.getByRole("button", { name: "Fechar" }).click();

  expect(norm(await page.getByTestId("estimated-total").textContent())).toBe("5,58 €");
  await expect(page.getByTestId("pending-count")).toHaveText("2");

  // Lista agrupada por departamento
  await page.getByRole("link", { name: "Lista" }).click();
  await expect(page.getByRole("heading", { name: /Mercearia/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Frutas e Legumes/ })).toBeVisible();

  // Marcar como comprado e corrigir o valor pago
  await page.getByRole("checkbox", { name: /Arroz agulha/ }).click();
  await expect(page.getByRole("checkbox", { name: /Arroz agulha/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Valor pago por Arroz agulha" }).click();
  await page.getByLabel("Quanto pagou no total (€)").fill("2,40");
  await page.getByRole("button", { name: "Guardar valor" }).click();

  // Editar produto
  await page.getByRole("button", { name: "Editar Maçãs" }).click();
  await page.getByLabel("Nome").fill("Maçãs Gala");
  await page.getByRole("button", { name: "Guardar alterações" }).click();
  await expect(page.getByRole("button", { name: "Editar Maçãs Gala" })).toBeVisible();

  // Filtro por departamento
  await page.getByRole("button", { name: "Frutas e Legumes", exact: true }).click();
  await expect(page).toHaveURL(/d=frutas-legumes/);
  await expect(page.getByRole("heading", { name: /Mercearia/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Todos" }).click();

  // Partilha WhatsApp
  await page.getByRole("button", { name: "Partilhar pelo WhatsApp" }).click();
  const preview = page.getByLabel("Pré-visualização da mensagem");
  await expect(preview).toContainText("*Frutas e Legumes*");
  await expect(preview).toContainText("Maçãs Gala — 1,5 kg");
  await expect(preview).not.toContainText("Arroz agulha");
  const href = await page.getByRole("link", { name: "Enviar pelo WhatsApp" }).getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
  expect(decodeURIComponent(href!.split("text=")[1])).toContain("Maçãs Gala");
  await page.getByText("Incluir produtos já comprados").click();
  await expect(preview).toContainText("✅ Arroz agulha");
  await page.getByRole("button", { name: "Fechar" }).click();

  // Persistência após recarregar
  await page.reload();
  await expect(page.getByRole("button", { name: "Editar Maçãs Gala" })).toBeVisible();

  // Resumo na página inicial
  await page.getByRole("link", { name: "Início" }).click();
  await expect(page.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("bought-count")).toHaveText("1");
  expect(norm(await page.getByTestId("real-total").textContent())).toBe("2,40 €");
  await page.screenshot({ path: "e2e/screenshots/inicio.png", fullPage: true });

  await page.getByRole("link", { name: "Lista" }).click();
  await expect(page.getByRole("link", { name: "Lista" })).toHaveAttribute("aria-current", "page");
  await page.screenshot({ path: "e2e/screenshots/lista.png", fullPage: true });

  // Eliminar produto (com confirmação)
  await page.getByRole("button", { name: "Editar Maçãs Gala" }).click();
  await page.screenshot({ path: "e2e/screenshots/editar.png" });
  await page.getByRole("button", { name: "Eliminar produto" }).click();
  await page.getByRole("button", { name: "Confirmar eliminação" }).click();
  await expect(page.getByRole("button", { name: "Editar Maçãs Gala" })).toHaveCount(0);

  // Remover comprados
  await page.getByRole("button", { name: "Remover produtos comprados da lista" }).click();
  await page.getByRole("button", { name: "Remover 1" }).click();
  await expect(page.getByText("A lista está vazia")).toBeVisible();
});
