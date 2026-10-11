"use client";

import { Check } from "lucide-react";
import { UNITS } from "@/lib/departments";
import { formatEuro, formatQuantity } from "@/lib/format";
import { toggleBought } from "@/lib/store";
import { estimatedLineTotal } from "@/lib/totals";
import type { Item } from "@/lib/types";
import { useUI } from "./UIContext";

function quantityText(item: Item) {
  const unit = item.unit === "un" ? "un." : UNITS.find((u) => u.id === item.unit)?.id ?? item.unit;
  return `${formatQuantity(item.quantity)} ${unit}`;
}

export function ItemRow({ item }: { item: Item }) {
  const { openEditItem, openPricePaid } = useUI();

  return (
    <li className="flex items-stretch gap-1 bg-white">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.bought}
        aria-label={`${item.bought ? "Desmarcar" : "Marcar"} ${item.name} como comprado`}
        onClick={() => toggleBought(item.id)}
        className="flex w-14 shrink-0 items-center justify-center"
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
            item.bought ? "border-sage-500 bg-sage-500 text-white" : "border-sage-300 bg-white"
          }`}
        >
          {item.bought && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
        </span>
      </button>

      <button
        type="button"
        onClick={() => openEditItem(item)}
        className="min-w-0 flex-1 py-3 pr-2 text-left"
        aria-label={`Editar ${item.name}`}
      >
        <span
          className={`block truncate font-medium ${
            item.bought ? "text-sage-400 line-through" : "text-ink"
          }`}
        >
          {item.name}
        </span>
        <span className="block text-sm text-sage-600">
          {quantityText(item)}
          {item.unitPrice != null && !item.bought && (
            <> · ~{formatEuro(estimatedLineTotal(item))}</>
          )}
        </span>
        {item.notes && (
          <span className="mt-0.5 block truncate text-xs text-sage-500 italic">{item.notes}</span>
        )}
      </button>

      {item.bought && (
        <button
          type="button"
          onClick={() => openPricePaid(item)}
          className="my-2 mr-3 shrink-0 self-center rounded-full bg-beige-100 px-3 py-2 text-xs font-semibold text-sage-700"
          aria-label={`Valor pago por ${item.name}`}
        >
          {item.pricePaid == null ? "Registar valor" : formatEuro(item.pricePaid)}
        </button>
      )}
    </li>
  );
}
