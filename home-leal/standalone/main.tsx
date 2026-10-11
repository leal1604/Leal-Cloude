import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HomePage from "@/app/page";
import PrivacidadePage from "@/app/privacidade/page";
import { AppShell } from "@/components/AppShell";
import { ShoppingList } from "@/components/ShoppingList";
import { SyncBadge } from "./SyncBadge";
import { useLocation } from "./shims/router";
import "./styles.css";

function App() {
  const { pathname } = useLocation();
  const page =
    pathname === "/lista" ? <ShoppingList /> : pathname === "/privacidade" ? <PrivacidadePage /> : <HomePage />;
  return (
    <AppShell>
      <SyncBadge />
      {page}
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
