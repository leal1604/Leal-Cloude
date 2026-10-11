import {
  Apple,
  Bath,
  Beef,
  Croissant,
  CupSoda,
  Milk,
  Package,
  Snowflake,
  SprayCan,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { DepartmentId } from "@/lib/types";

const ICONS: Record<DepartmentId, LucideIcon> = {
  mercearia: Wheat,
  "frutas-legumes": Apple,
  limpeza: SprayCan,
  laticinios: Milk,
  proteinas: Beef,
  higiene: Bath,
  padaria: Croissant,
  congelados: Snowflake,
  bebidas: CupSoda,
  outros: Package,
};

export function DepartmentIcon({ id, className = "h-5 w-5" }: { id: DepartmentId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={className} aria-hidden="true" />;
}
