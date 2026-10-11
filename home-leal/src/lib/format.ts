const euro = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

const number = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 3 });

export function formatEuro(value: number): string {
  return euro.format(value);
}

export function formatQuantity(value: number): string {
  return number.format(value);
}

/** Converte texto como "1,25" ou "1.25" num número. Devolve null se vazio ou inválido. */
export function parseDecimal(text: string): number | null {
  const cleaned = text.trim().replace(/\s|€/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Arredonda a cêntimos para evitar erros de vírgula flutuante. */
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
