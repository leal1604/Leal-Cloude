import { useSyncExternalStore } from "react";
import { roundCents } from "@/lib/format";
import { parseStoredItems, STORAGE_KEY } from "@/lib/storage";
import { estimatedLineTotal } from "@/lib/totals";
import type { Item, ItemInput } from "@/lib/types";

/**
 * Armazenamento da versão de página única (link pessoal no claude.ai).
 * Quando a página tem acesso à base de dados partilhada do artefacto (`db`),
 * a lista é a mesma para todas as pessoas com acesso e atualiza em tempo real.
 * Sem acesso, usa o armazenamento local deste navegador, como a app normal.
 * Mesma interface que src/lib/store.ts.
 */

type Unsubscribe = () => void;
interface DocSnap {
  id: string;
  data(): Record<string, unknown> | undefined;
}
interface DocRef {
  set(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
}
interface Collection {
  doc(id: string): DocRef;
  onSnapshot(next: (s: { docs: DocSnap[] }) => void, error?: (e: { code: string }) => void): Unsubscribe;
}
interface DB {
  collection(path: string): Collection;
}
interface UserCap {
  can(capability: string): Promise<boolean | null>;
}
declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

export type SyncMode = "connecting" | "shared" | "readonly" | "local" | "error";

interface State {
  items: Item[];
  ready: boolean;
  mode: SyncMode;
  message: string | null;
}

const MIGRATED_KEY = "home-leal:migrated-to-shared";
let state: State = { items: [], ready: false, mode: "connecting", message: null };
let items: Item[] = [];
const listeners = new Set<() => void>();
let col: Collection | null = null;

function emit(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function readLocal(): Item[] {
  try {
    return parseStoredItems(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeLocal(next: Item[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Armazenamento indisponível: fica só em memória.
  }
}

function switchToLocal(message: string | null = null) {
  col = null;
  items = readLocal();
  emit({ items, ready: true, mode: "local", message });
}

async function connect() {
  const claude = typeof window !== "undefined" ? window.claude : undefined;
  if (!claude) return switchToLocal();

  const [db, user] = (await Promise.all([claude.use("db"), claude.use("user")])) as [DB | null, UserCap | null];
  if (!db) return switchToLocal();

  const canWrite = user ? await user.can("data.write").catch(() => null) : null;
  col = db.collection("items");

  col.onSnapshot(
    (snap) => {
      const raw = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      items = parseStoredItems(JSON.stringify(raw));
      emit({ items, ready: true, mode: canWrite === false || state.mode === "readonly" ? "readonly" : "shared" });
    },
    (e) => {
      if (e.code === "revoked") emit({ mode: "readonly", message: "O acesso a esta lista mudou. Recarregue a página." });
      else emit({ mode: "error", message: "A ligação à lista partilhada falhou. Recarregue a página." });
    },
  );

  if (canWrite !== false) await migrateLocalItems();
}

/** Envia para a lista partilhada os produtos registados antes neste navegador (uma única vez). */
async function migrateLocalItems() {
  try {
    if (window.localStorage.getItem(MIGRATED_KEY)) return;
    const local = readLocal();
    for (const item of local) await write(item);
    window.localStorage.setItem(MIGRATED_KEY, "1");
    if (local.length) window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem armazenamento local: nada para migrar.
  }
}

function handleWriteError(e: unknown) {
  const code = (e as { code?: string } | null)?.code;
  if (code === "invalid_argument" || code === "not_granted") {
    emit({ mode: "readonly", message: "Pode ver a lista, mas não tem permissão para a alterar." });
  } else if (code === "quota_exceeded") {
    emit({ message: "A lista atingiu o limite de armazenamento. Remova produtos comprados." });
  } else {
    emit({ message: "Não foi possível guardar a alteração. Tente de novo." });
  }
}

async function write(item: Item) {
  if (!col) return;
  const { id, ...body } = item;
  await col.doc(id).set(body as Record<string, unknown>);
}

/** Aplica uma alteração: na lista partilhada (se ligada) ou no armazenamento local. */
function apply(next: Item[], changed: Item[], removed: string[]) {
  if (state.mode === "readonly") {
    emit({ message: "Pode ver a lista, mas não tem permissão para a alterar." });
    return;
  }
  if (!col) {
    items = next;
    writeLocal(next);
    emit({ items });
    return;
  }
  const c = col;
  void (async () => {
    try {
      for (const item of changed) await write(item);
      for (const id of removed) await c.doc(id).delete();
    } catch (e) {
      handleWriteError(e);
    }
  })();
}

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  connect().catch(() => switchToLocal());
}

export function useItems(): { items: Item[]; ready: boolean } {
  start();
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  return { items: s.items, ready: s.ready };
}

export function useSyncStatus(): { mode: SyncMode; message: string | null } {
  start();
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  return { mode: s.mode, message: s.message };
}

export function dismissMessage() {
  emit({ message: null });
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

function updateOne(id: string, fn: (i: Item) => Item) {
  const target = items.find((i) => i.id === id);
  if (!target) return;
  const changed = fn(target);
  apply(items.map((i) => (i.id === id ? changed : i)), [changed], []);
}

export function addItem(input: ItemInput): Item {
  const now = new Date().toISOString();
  const item: Item = { ...clean(input), id: newId(), bought: false, pricePaid: null, createdAt: now, updatedAt: now };
  apply([...items, item], [item], []);
  return item;
}

export function updateItem(id: string, input: ItemInput) {
  updateOne(id, (i) => ({ ...i, ...clean(input), updatedAt: new Date().toISOString() }));
}

export function removeItem(id: string) {
  apply(items.filter((i) => i.id !== id), [], [id]);
}

export function toggleBought(id: string) {
  updateOne(id, (i) => {
    const now = new Date().toISOString();
    if (i.bought) return { ...i, bought: false, pricePaid: null, updatedAt: now };
    return { ...i, bought: true, pricePaid: i.unitPrice == null ? null : estimatedLineTotal(i), updatedAt: now };
  });
}

export function setPricePaid(id: string, value: number | null) {
  updateOne(id, (i) => ({ ...i, pricePaid: value == null ? null : roundCents(value), updatedAt: new Date().toISOString() }));
}

export function removeBought() {
  const bought = items.filter((i) => i.bought).map((i) => i.id);
  apply(items.filter((i) => !i.bought), [], bought);
}
