"use client";

import { Search, Share2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DEPARTMENT_IDS, DEPARTMENTS } from "@/lib/departments";
import { formatEuro } from "@/lib/format";
import { removeBought, useItems } from "@/lib/store";
import { groupByDepartment, summarize } from "@/lib/totals";
import type { DepartmentId } from "@/lib/types";
import { DepartmentIcon } from "./DepartmentIcon";
import { ItemRow } from "./ItemRow";
import { useUI } from "./UIContext";

export function ShoppingList() {
  const { items, ready } = useItems();
  const { openShare, openNewItem } = useUI();
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const d = params.get("d");
  const filter = DEPARTMENT_IDS.includes(d as DepartmentId) ? (d as DepartmentId) : null;
  const setFilter = (id: DepartmentId | null) =>
    router.replace(id ? `/lista?d=${id}` : "/lista", { scroll: false });

  const q = query.trim().toLocaleLowerCase("pt");
  const visible = items.filter(
    (i) =>
      (!filter || i.department === filter) &&
      (!q || i.name.toLocaleLowerCase("pt").includes(q) || i.notes.toLocaleLowerCase("pt").includes(q)),
  );
  const groups = groupByDepartment(visible);
  const summary = summarize(items);

  if (!ready) return <div className="h-64" aria-busy="true" />;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sage-800">Lista de compras</h1>
          <p className="text-sm text-sage-600">
            {summary.pendingCount} pendente(s) · estimado {formatEuro(summary.estimatedPending)}
          </p>
        </div>
        <button
          type="button"
          onClick={openShare}
          aria-label="Partilhar pelo WhatsApp"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-beige-300 bg-white text-sage-700"
        >
          <Share2 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {items.length > 0 && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-sage-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar produto"
              aria-label="Procurar produto"
              className="h-11 w-full rounded-full border border-beige-300 bg-white pr-4 pl-10 text-base placeholder:text-sage-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 focus:outline-none"
            />
          </div>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar por departamento">
            <Chip active={!filter} onClick={() => setFilter(null)}>
              Todos
            </Chip>
            {DEPARTMENTS.filter((dep) => items.some((i) => i.department === dep.id)).map((dep) => (
              <Chip key={dep.id} active={filter === dep.id} onClick={() => setFilter(dep.id)}>
                {dep.label}
              </Chip>
            ))}
          </div>
        </>
      )}

      {items.length === 0 ? (
        <EmptyState onAdd={() => openNewItem()} />
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-sage-600">Nenhum produto encontrado.</p>
      ) : (
        groups.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`} className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold tracking-wide text-sage-700 uppercase">
              <DepartmentIcon id={g.id} className="h-4 w-4" />
              {g.label}
              <span className="font-normal text-sage-500 normal-case">
                ({g.items.filter((i) => !i.bought).length}/{g.items.length})
              </span>
            </h2>
            <ul className="overflow-hidden rounded-2xl border border-beige-200 divide-y divide-beige-100">
              {g.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}

      {summary.boughtCount > 0 && (
        <div className="pt-2">
          {confirmClear ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="h-12 flex-1 rounded-2xl border border-beige-300 bg-white font-medium text-sage-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  removeBought();
                  setConfirmClear(false);
                }}
                className="h-12 flex-1 rounded-2xl bg-danger font-semibold text-white"
              >
                Remover {summary.boughtCount}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="h-12 w-full rounded-2xl text-sm font-medium text-sage-600 active:bg-beige-200"
            >
              Remover produtos comprados da lista
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-10 shrink-0 rounded-full border px-4 text-sm whitespace-nowrap transition-colors ${
        active
          ? "border-sage-600 bg-sage-600 text-white"
          : "border-beige-300 bg-white text-sage-700"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-beige-300 bg-beige-50 px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold text-sage-800">A lista está vazia</p>
      <p className="mt-1 text-sm text-sage-600">Adicione o primeiro produto para começar.</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 h-12 rounded-2xl bg-sage-600 px-6 font-semibold text-white"
      >
        Adicionar produto
      </button>
    </div>
  );
}
