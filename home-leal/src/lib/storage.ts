import { DEPARTMENT_IDS, UNIT_IDS } from "./departments";
import type { DepartmentId, Item, Unit } from "./types";

export const STORAGE_KEY = "home-leal:items:v1";

function isNumberOrNull(v: unknown): v is number | null {
  return v === null || (typeof v === "number" && Number.isFinite(v));
}

/** Lê e valida a lista guardada. Entradas inválidas são descartadas. */
export function parseStoredItems(raw: string | null): Item[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  return data.flatMap((d): Item[] => {
    if (typeof d !== "object" || d === null) return [];
    const o = d as Record<string, unknown>;
    if (
      typeof o.id !== "string" ||
      typeof o.name !== "string" ||
      typeof o.quantity !== "number" ||
      !isNumberOrNull(o.unitPrice) ||
      !isNumberOrNull(o.pricePaid ?? null)
    ) {
      return [];
    }
    return [
      {
        id: o.id,
        name: o.name,
        department: DEPARTMENT_IDS.includes(o.department as DepartmentId)
          ? (o.department as DepartmentId)
          : "outros",
        quantity: o.quantity,
        unit: UNIT_IDS.includes(o.unit as Unit) ? (o.unit as Unit) : "un",
        unitPrice: o.unitPrice,
        notes: typeof o.notes === "string" ? o.notes : "",
        bought: o.bought === true,
        pricePaid: (o.pricePaid as number | null | undefined) ?? null,
        createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date(0).toISOString(),
        updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date(0).toISOString(),
      },
    ];
  });
}
