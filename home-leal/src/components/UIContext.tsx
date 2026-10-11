"use client";

import { createContext, useContext } from "react";
import type { DepartmentId, Item } from "@/lib/types";

export interface UIActions {
  openNewItem: (department?: DepartmentId) => void;
  openEditItem: (item: Item) => void;
  openPricePaid: (item: Item) => void;
  openShare: () => void;
}

export const UIContext = createContext<UIActions | null>(null);

export function useUI(): UIActions {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI deve ser usado dentro de <AppShell>");
  return ctx;
}
