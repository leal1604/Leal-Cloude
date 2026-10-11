"use client";

import Link from "next/link";
import { ChevronRight, Share2 } from "lucide-react";
import { DepartmentIcon } from "@/components/DepartmentIcon";
import { SummaryCards } from "@/components/SummaryCards";
import { useUI } from "@/components/UIContext";
import { DEPARTMENTS } from "@/lib/departments";
import { formatEuro } from "@/lib/format";
import { useItems } from "@/lib/store";
import { estimatedLineTotal, summarize } from "@/lib/totals";

export default function HomePage() {
  const { items, ready } = useItems();
  const { openShare, openNewItem } = useUI();
  const summary = summarize(items);

  if (!ready) return <div className="h-64" aria-busy="true" />;

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />

      <button
        type="button"
        onClick={openShare}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-beige-300 bg-white font-medium text-sage-700 active:bg-beige-200"
      >
        <Share2 className="h-4.5 w-4.5" aria-hidden="true" />
        Partilhar lista pelo WhatsApp
      </button>

      <section aria-labelledby="dept-title">
        <h2 id="dept-title" className="mb-3 font-display text-lg font-semibold text-sage-800">
          Departamentos
        </h2>
        <ul className="overflow-hidden rounded-2xl border border-beige-200 bg-white divide-y divide-beige-100">
          {DEPARTMENTS.map((d) => {
            const deptItems = items.filter((i) => i.department === d.id);
            const pending = deptItems.filter((i) => !i.bought);
            const cost = pending.reduce((sum, i) => sum + estimatedLineTotal(i), 0);
            return (
              <li key={d.id}>
                {deptItems.length > 0 ? (
                  <Link
                    href={`/lista?d=${d.id}`}
                    className="flex min-h-14 items-center gap-3 px-4 py-2.5 active:bg-beige-50"
                  >
                    <DeptBadge id={d.id} />
                    <span className="flex-1">
                      <span className="block font-medium text-ink">{d.label}</span>
                      <span className="block text-xs text-sage-600">
                        {pending.length} pendente(s) · {deptItems.length - pending.length} comprado(s)
                      </span>
                    </span>
                    {cost > 0 && <span className="text-sm text-sage-700">{formatEuro(cost)}</span>}
                    <ChevronRight className="h-4 w-4 text-sage-400" aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openNewItem(d.id)}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-beige-50"
                  >
                    <DeptBadge id={d.id} muted />
                    <span className="flex-1 text-sage-500">{d.label}</span>
                    <span className="text-xs text-sage-400">Adicionar</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function DeptBadge({ id, muted }: { id: (typeof DEPARTMENTS)[number]["id"]; muted?: boolean }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        muted ? "bg-beige-100 text-sage-400" : "bg-sage-100 text-sage-700"
      }`}
    >
      <DepartmentIcon id={id} />
    </span>
  );
}
