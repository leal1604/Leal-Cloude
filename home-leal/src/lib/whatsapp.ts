import { UNITS } from "./departments";
import { formatEuro, formatQuantity } from "./format";
import { estimatedLineTotal, groupByDepartment, summarize } from "./totals";
import type { Item } from "./types";

function unitLabel(item: Item): string {
  if (item.unit === "un") return "";
  return " " + (UNITS.find((u) => u.id === item.unit)?.label ?? item.unit);
}

/**
 * Gera o texto da lista para o WhatsApp, organizado por departamento.
 * Por defeito inclui só os produtos pendentes.
 */
export function buildWhatsAppMessage(
  items: Item[],
  options: { includeBought?: boolean } = {},
): string {
  const selected = options.includeBought ? items : items.filter((i) => !i.bought);
  if (selected.length === 0) return "🏡 *Home Leal*\nA lista de compras está vazia. ✅";

  const lines: string[] = ["🏡 *Home Leal — Lista de compras*", ""];

  for (const group of groupByDepartment(selected)) {
    lines.push(`*${group.label}*`);
    for (const item of group.items) {
      const mark = item.bought ? "✅" : "▫️";
      const qty = `${formatQuantity(item.quantity)}${unitLabel(item)}`;
      let line = `${mark} ${item.name} — ${qty}`;
      const est = estimatedLineTotal(item);
      if (item.unitPrice != null) line += ` (~${formatEuro(est)})`;
      if (item.notes.trim()) line += `\n    _${item.notes.trim()}_`;
      lines.push(line);
    }
    lines.push("");
  }

  const s = summarize(selected);
  lines.push(`💶 Custo estimado: *${formatEuro(s.estimatedTotal)}*`);
  if (s.pendingWithoutPrice > 0) {
    lines.push(`(${s.pendingWithoutPrice} produto(s) sem preço estimado)`);
  }
  return lines.join("\n");
}

export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
