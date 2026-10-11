import { useMemo } from "react";
import { navigate, useLocation } from "./router";

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useRouter() {
  return { push: navigate, replace: (href: string) => navigate(href) };
}
