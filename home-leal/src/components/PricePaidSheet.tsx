"use client";

import { useState } from "react";
import { formatEuro, parseDecimal } from "@/lib/format";
import { setPricePaid } from "@/lib/store";
import { estimatedLineTotal } from "@/lib/totals";
import type { Item } from "@/lib/types";
import { fieldClass, labelClass, Sheet } from "./Sheet";

export function PricePaidSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const [value, setValue] = useState(
    item.pricePaid == null ? "" : String(item.pricePaid).replace(".", ","),
  );
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseDecimal(value);
    if (value.trim() && parsed == null) return setError("Valor inválido.");
    setPricePaid(item.id, parsed);
    onClose();
  }

  return (
    <Sheet title="Valor pago" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-sm text-sage-700">
          <strong>{item.name}</strong>
          {item.unitPrice != null && (
            <> · estimado {formatEuro(estimatedLineTotal(item))}</>
          )}
        </p>
        <div>
          <label htmlFor="paid" className={labelClass}>
            Quanto pagou no total (€)
          </label>
          <input
            id="paid"
            className={fieldClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder="Ex.: 3,49"
            autoComplete="off"
            autoFocus
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="h-13 w-full rounded-2xl bg-sage-600 font-semibold text-white active:bg-sage-700"
        >
          Guardar valor
        </button>
      </form>
    </Sheet>
  );
}
