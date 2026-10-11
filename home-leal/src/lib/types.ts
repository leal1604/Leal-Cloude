export type DepartmentId =
  | "mercearia"
  | "frutas-legumes"
  | "limpeza"
  | "laticinios"
  | "proteinas"
  | "higiene"
  | "padaria"
  | "congelados"
  | "bebidas"
  | "outros";

export type Unit = "un" | "kg" | "g" | "L" | "ml" | "emb" | "dúzia";

export interface Item {
  id: string;
  name: string;
  department: DepartmentId;
  quantity: number;
  unit: Unit;
  /** Preço estimado por unidade (em euros). */
  unitPrice: number | null;
  notes: string;
  bought: boolean;
  /** Valor total efetivamente pago (em euros), registado ao marcar como comprado. */
  pricePaid: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ItemInput = Pick<
  Item,
  "name" | "department" | "quantity" | "unit" | "unitPrice" | "notes"
>;
