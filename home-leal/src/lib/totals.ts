import { DEPARTMENTS } from "./departments";
import { roundCents } from "./format";
import type { DepartmentId, Item } from "./types";

/** Custo estimado de uma linha: quantidade × preço unitário (0 se sem preço). */
export function estimatedLineTotal(item: Item): number {
  if (item.unitPrice == null) return 0;
  return roundCents(item.quantity * item.unitPrice);
}

export interface Summary {
  pendingCount: number;
  boughtCount: number;
  /** Custo estimado de toda a lista (pendentes + comprados). */
  estimatedTotal: number;
  /** Custo estimado do que ainda falta comprar. */
  estimatedPending: number;
  /** Soma dos valores realmente pagos nos produtos comprados. */
  realTotal: number;
  /** Produtos pendentes sem preço estimado (o total pode estar subestimado). */
  pendingWithoutPrice: number;
}

export function summarize(items: Item[]): Summary {
  let estimatedTotal = 0;
  let estimatedPending = 0;
  let realTotal = 0;
  let pendingCount = 0;
  let boughtCount = 0;
  let pendingWithoutPrice = 0;

  for (const item of items) {
    const line = estimatedLineTotal(item);
    estimatedTotal += line;
    if (item.bought) {
      boughtCount++;
      realTotal += item.pricePaid ?? 0;
    } else {
      pendingCount++;
      estimatedPending += line;
      if (item.unitPrice == null) pendingWithoutPrice++;
    }
  }

  return {
    pendingCount,
    boughtCount,
    estimatedTotal: roundCents(estimatedTotal),
    estimatedPending: roundCents(estimatedPending),
    realTotal: roundCents(realTotal),
    pendingWithoutPrice,
  };
}

export interface DepartmentGroup {
  id: DepartmentId;
  label: string;
  items: Item[];
}

/** Agrupa produtos pela ordem fixa dos departamentos, omitindo grupos vazios. */
export function groupByDepartment(items: Item[]): DepartmentGroup[] {
  return DEPARTMENTS.map((d) => ({
    id: d.id,
    label: d.label,
    items: items
      .filter((i) => i.department === d.id)
      .sort(
        (a, b) =>
          Number(a.bought) - Number(b.bought) ||
          a.name.localeCompare(b.name, "pt"),
      ),
  })).filter((g) => g.items.length > 0);
}
