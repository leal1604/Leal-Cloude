import { useSyncExternalStore } from "react";

// Navegação em memória para a versão de página única (sem servidor Next.js).
let location = { pathname: "/", search: "" };
const listeners = new Set<() => void>();

export function navigate(href: string) {
  const [pathname, search = ""] = href.split("?");
  location = { pathname: pathname || "/", search: search ? `?${search}` : "" };
  listeners.forEach((l) => l());
  window.scrollTo({ top: 0 });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLocation() {
  return useSyncExternalStore(subscribe, () => location, () => location);
}
