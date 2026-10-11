"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DEPARTMENTS, UNITS } from "@/lib/departments";
import { formatEuro, parseDecimal } from "@/lib/format";
import { addItem, removeItem, updateItem } from "@/lib/store";
import type { DepartmentId, Item, Unit } from "@/lib/types";
import { fieldClass, labelClass, Sheet } from "./Sheet";

function toText(n: number | null): string {
  return n == null ? "" : String(n).replace(".", ",");
}

export function ItemSheet({
  item,
  defaultDepartment,
  onClose,
}: {
  item?: Item;
  defaultDepartment?: DepartmentId;
  onClose: () => void;
}) {
  const editing = Boolean(item);
  const [name, setName] = useState(item?.name ?? "");
  const [department, setDepartment] = useState<DepartmentId>(
    item?.department ?? defaultDepartment ?? "mercearia",
  );
  const [quantity, setQuantity] = useState(toText(item?.quantity ?? 1));
  const [unit, setUnit] = useState<Unit>(item?.unit ?? "un");
  const [price, setPrice] = useState(toText(item?.unitPrice ?? null));
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = parseDecimal(quantity);
  const unitPrice = parseDecimal(price);
  const lineTotal = qty != null && unitPrice != null ? qty * unitPrice : null;

  function step(delta: number) {
    const next = Math.max(0, (qty ?? 0) + delta);
    setQuantity(toText(Math.round(next * 1000) / 1000));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Indique o nome do produto.");
    if (qty == null || qty <= 0) return setError("A quantidade tem de ser maior que zero.");
    if (price.trim() && unitPrice == null) return setError("O preço estimado não é válido.");

    const input = { name, department, quantity: qty, unit, unitPrice, notes };
    if (item) updateItem(item.id, input);
    else addItem(input);
    onClose();
  }

  return (
    <Sheet title={editing ? "Editar produto" : "Novo produto"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="item-name" className={labelClass}>
            Nome
          </label>
          <input
            id="item-name"
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Arroz agulha"
            autoComplete="off"
            enterKeyHint="next"
            maxLength={80}
            autoFocus={!editing}
          />
        </div>

        <fieldset>
          <legend className={labelClass}>Departamento</legend>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map((d) => (
              <label key={d.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="department"
                  value={d.id}
                  checked={department === d.id}
                  onChange={() => setDepartment(d.id)}
                  className="peer sr-only"
                />
                <span className="inline-flex min-h-10 items-center rounded-full border border-beige-300 bg-white px-3.5 text-sm text-sage-700 peer-checked:border-sage-600 peer-checked:bg-sage-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sage-300">
                  {d.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label htmlFor="item-qty" className={labelClass}>
              Quantidade
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Diminuir quantidade"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-beige-300 bg-white text-sage-700 active:bg-beige-200"
              >
                <Minus className="h-5 w-5" aria-hidden="true" />
              </button>
              <input
                id="item-qty"
                className={`${fieldClass} text-center`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Aumentar quantidade"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-beige-300 bg-white text-sage-700 active:bg-beige-200"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="item-unit" className={labelClass}>
              Unidade
            </label>
            <select
              id="item-unit"
              className={`${fieldClass} h-12.5 py-0`}
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id === "un" ? "un." : u.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="item-price" className={labelClass}>
            Preço estimado por {unit === "un" ? "unidade" : unit} (€)
          </label>
          <input
            id="item-price"
            className={fieldClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="Opcional — ex.: 1,29"
            autoComplete="off"
          />
          {lineTotal != null && (
            <p className="mt-1.5 text-sm text-sage-600">
              Total estimado: <strong>{formatEuro(lineTotal)}</strong>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="item-notes" className={labelClass}>
            Observações
          </label>
          <textarea
            id="item-notes"
            className={`${fieldClass} min-h-20 resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional — marca, tamanho, loja…"
            maxLength={300}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="h-13 w-full rounded-2xl bg-sage-600 text-base font-semibold text-white active:bg-sage-700"
        >
          {editing ? "Guardar alterações" : "Adicionar à lista"}
        </button>

        {item &&
          (confirmDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-12 flex-1 rounded-2xl border border-beige-300 bg-white font-medium text-sage-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  removeItem(item.id);
                  onClose();
                }}
                className="h-12 flex-1 rounded-2xl bg-danger font-semibold text-white"
              >
                Confirmar eliminação
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-medium text-danger active:bg-danger/10"
            >
              <Trash2 className="h-4.5 w-4.5" aria-hidden="true" />
              Eliminar produto
            </button>
          ))}
      </form>
    </Sheet>
  );
}
