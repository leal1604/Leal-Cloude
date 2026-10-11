"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ListChecks, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { DepartmentId, Item } from "@/lib/types";
import { useItems } from "@/lib/store";
import { LogoMark } from "./Logo";
import { ItemSheet } from "./ItemSheet";
import { PricePaidSheet } from "./PricePaidSheet";
import { ShareSheet } from "./ShareSheet";
import { UIContext, type UIActions } from "./UIContext";

type SheetState =
  | { kind: "none" }
  | { kind: "new"; department?: DepartmentId }
  | { kind: "edit"; item: Item }
  | { kind: "paid"; item: Item }
  | { kind: "share" };

const NAV = [
  { href: "/", label: "Início", icon: House },
  { href: "/lista", label: "Lista", icon: ListChecks },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { items } = useItems();
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" });
  const close = () => setSheet({ kind: "none" });
  const sheetOpen = sheet.kind !== "none";

  const actions = useMemo<UIActions>(
    () => ({
      openNewItem: (department) => setSheet({ kind: "new", department }),
      openEditItem: (item) => setSheet({ kind: "edit", item }),
      openPricePaid: (item) => setSheet({ kind: "paid", item }),
      openShare: () => setSheet({ kind: "share" }),
    }),
    [],
  );

  return (
    <UIContext.Provider value={actions}>
      <div inert={sheetOpen} className="mx-auto flex min-h-dvh max-w-xl flex-col">
        <header className="flex items-center gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
          <LogoMark />
          <div className="leading-tight">
            <p className="font-display text-xl font-semibold text-sage-800">Home Leal</p>
            <p className="text-xs text-sage-600">Nossa casa, tudo organizado.</p>
          </div>
        </header>

        <main className="flex-1 px-4 pb-36">{children}</main>
      </div>

      <button
        type="button"
        inert={sheetOpen}
        onClick={() => actions.openNewItem()}
        className="fixed right-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center gap-2 rounded-full bg-sage-600 pr-5 pl-4 font-semibold text-white shadow-lg shadow-sage-900/20 active:scale-95 transition-transform md:right-[calc(50%-17rem)]"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
        Adicionar
      </button>

      <nav
        aria-label="Navegação principal"
        inert={sheetOpen}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-beige-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                    active ? "text-sage-700" : "text-sage-500"
                  }`}
                >
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-sage-100" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {sheet.kind === "new" && (
        <ItemSheet key="new" defaultDepartment={sheet.department} onClose={close} />
      )}
      {sheet.kind === "edit" && (
        <ItemSheet key={sheet.item.id} item={sheet.item} onClose={close} />
      )}
      {sheet.kind === "paid" && <PricePaidSheet item={sheet.item} onClose={close} />}
      {sheet.kind === "share" && <ShareSheet items={items} onClose={close} />}
    </UIContext.Provider>
  );
}
