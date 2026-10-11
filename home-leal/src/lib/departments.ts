import type { DepartmentId, Unit } from "./types";

export interface Department {
  id: DepartmentId;
  label: string;
}

export const DEPARTMENTS: Department[] = [
  { id: "mercearia", label: "Mercearia" },
  { id: "frutas-legumes", label: "Frutas e Legumes" },
  { id: "limpeza", label: "Limpeza" },
  { id: "laticinios", label: "Laticínios" },
  { id: "proteinas", label: "Proteínas" },
  { id: "higiene", label: "Higiene Pessoal" },
  { id: "padaria", label: "Padaria" },
  { id: "congelados", label: "Congelados" },
  { id: "bebidas", label: "Bebidas" },
  { id: "outros", label: "Outros" },
];

export const DEPARTMENT_IDS = DEPARTMENTS.map((d) => d.id);

export function departmentLabel(id: DepartmentId): string {
  return DEPARTMENTS.find((d) => d.id === id)?.label ?? "Outros";
}

export const UNITS: { id: Unit; label: string }[] = [
  { id: "un", label: "unidade(s)" },
  { id: "kg", label: "kg" },
  { id: "g", label: "g" },
  { id: "L", label: "L" },
  { id: "ml", label: "ml" },
  { id: "emb", label: "embalagem(ns)" },
  { id: "dúzia", label: "dúzia(s)" },
];

export const UNIT_IDS = UNITS.map((u) => u.id);
