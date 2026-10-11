import { Suspense } from "react";
import { ShoppingList } from "@/components/ShoppingList";

export const metadata = { title: "Lista · Home Leal" };

export default function ListaPage() {
  return (
    <Suspense>
      <ShoppingList />
    </Suspense>
  );
}
