"use client";

import { useSyncExternalStore } from "react";
import { roundCents } from "./format";
import { parseStoredItems, STORAGE_KEY } from "./storage";
import { estimatedLineTotal } from "./totals";
import type { Item, ItemInput } from "./types";

/**
 * Armazenamento local (neste dispositivo) da lista de compras.
 * Nesta 1.ª etapa os dados ficam no localStorage do navegador; a sincronização
 * entre dispositivos (Supabase) será a etapa seguinte.
 */

const EMPTY: Item[] = [];
let cache: Item[] | null = null;
const listeners = new Set<() => void>();

function read(): Item[] {
  if (cache) return cache;
  try {
    cache = parseStoredItems(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: Item[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Armazenamento indisponível (ex.: modo privado): mantém-se só em memória.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Mantém vários separadores do mesmo navegador sincronizados.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Lista de produtos e indicação se já foi lida do dispositivo. */
export function useItems(): { items: Item[]; ready: boolean } {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { items, ready };
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clean(input: ItemInput): ItemInput {
  return {
    ...input,
    name: input.name.trim(),
    notes: input.notes.trim(),
    unitPrice: input.unitPrice == null ? null : roundCents(input.unitPrice),
  };
}

export function addItem(input: ItemInput): Item {
  const now = new Date().toISOString();
  const item: Item = {
    ...clean(input),
    id: newId(),
    bought: false,
    pricePaid: null,
    createdAt: now,
    updatedAt: now,
  };
  write([...read(), item]);
  return item;
}

export function updateItem(id: string, input: ItemInput) {
  const now = new Date().toISOString();
  write(read().map((i) => (i.id === id ? { ...i, ...clean(input), updatedAt: now } : i)));
}

export function removeItem(id: string) {
  write(read().filter((i) => i.id !== id));
}

/**
 * Marca/desmarca como comprado. Ao marcar, o valor pago fica pré-preenchido
 * com o custo estimado (quando existe) e pode ser corrigido depois.
 */
export function toggleBought(id: string) {
  const now = new Date().toISOString();
  write(
    read().map((i) => {
      if (i.id !== id) return i;
      if (i.bought) return { ...i, bought: false, pricePaid: null, updatedAt: now };
      const estimate = i.unitPrice == null ? null : estimatedLineTotal(i);
      return { ...i, bought: true, pricePaid: estimate, updatedAt: now };
    }),
  );
}

export function setPricePaid(id: string, value: number | null) {
  const now = new Date().toISOString();
  write(
    read().map((i) =>
      i.id === id ? { ...i, pricePaid: value == null ? null : roundCents(value), updatedAt: now } : i,
    ),
  );
}

export function removeBought() {
  write(read().filter((i) => !i.bought));
}
