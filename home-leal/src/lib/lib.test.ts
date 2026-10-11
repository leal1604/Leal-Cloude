import { describe, expect, it } from "vitest";
import { formatEuro, parseDecimal } from "./format";
import { parseStoredItems } from "./storage";
import { groupByDepartment, summarize } from "./totals";
import type { Item } from "./types";
import { buildWhatsAppMessage, whatsAppShareUrl } from "./whatsapp";

function item(partial: Partial<Item>): Item {
  return {
    id: Math.random().toString(36),
    name: "Produto",
    department: "mercearia",
    quantity: 1,
    unit: "un",
    unitPrice: null,
    notes: "",
    bought: false,
    pricePaid: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("parseDecimal", () => {
  it("aceita vírgula e ponto", () => {
    expect(parseDecimal("1,29")).toBe(1.29);
    expect(parseDecimal("2.5")).toBe(2.5);
    expect(parseDecimal(" 3,10 € ")).toBe(3.1);
  });
  it("rejeita vazio, negativo e texto", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("-1")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });
});

describe("formatEuro", () => {
  it("usa formato português", () => {
    expect(formatEuro(1234.5).replace(/\s/g, " ")).toBe("1234,50 €");
  });
});

describe("summarize", () => {
  it("calcula estimado, pendente e valor real", () => {
    const s = summarize([
      item({ quantity: 2, unitPrice: 1.1 }),
      item({ quantity: 1.5, unit: "kg", unitPrice: 2 }),
      item({ unitPrice: null }),
      item({ quantity: 3, unitPrice: 0.5, bought: true, pricePaid: 1.4 }),
    ]);
    expect(s.pendingCount).toBe(3);
    expect(s.boughtCount).toBe(1);
    expect(s.estimatedTotal).toBe(6.7);
    expect(s.estimatedPending).toBe(5.2);
    expect(s.realTotal).toBe(1.4);
    expect(s.pendingWithoutPrice).toBe(1);
  });
  it("evita erros de arredondamento", () => {
    expect(summarize([item({ quantity: 3, unitPrice: 0.1 })]).estimatedTotal).toBe(0.3);
  });
});

describe("groupByDepartment", () => {
  it("segue a ordem dos departamentos e coloca comprados no fim", () => {
    const groups = groupByDepartment([
      item({ name: "Lixívia", department: "limpeza" }),
      item({ name: "Massa", department: "mercearia", bought: true }),
      item({ name: "Arroz", department: "mercearia" }),
    ]);
    expect(groups.map((g) => g.id)).toEqual(["mercearia", "limpeza"]);
    expect(groups[0].items.map((i) => i.name)).toEqual(["Arroz", "Massa"]);
  });
});

describe("buildWhatsAppMessage", () => {
  const items = [
    item({ name: "Arroz", quantity: 2, unitPrice: 1.2 }),
    item({ name: "Maçãs", department: "frutas-legumes", quantity: 1.5, unit: "kg", notes: "Gala" }),
    item({ name: "Leite", department: "laticinios", bought: true }),
  ];

  it("organiza por departamento e exclui comprados por defeito", () => {
    const msg = buildWhatsAppMessage(items).replace(/\u00a0/g, " ");
    expect(msg).toContain("*Mercearia*\n▫️ Arroz — 2 (~2,40 €)");
    expect(msg).toContain("*Frutas e Legumes*\n▫️ Maçãs — 1,5 kg\n    _Gala_");
    expect(msg).not.toContain("Leite");
    expect(msg.indexOf("Mercearia")).toBeLessThan(msg.indexOf("Frutas e Legumes"));
    expect(msg).toContain("(1 produto(s) sem preço estimado)");
  });

  it("pode incluir comprados", () => {
    expect(buildWhatsAppMessage(items, { includeBought: true })).toContain("✅ Leite");
  });

  it("gera link wa.me codificado", () => {
    expect(whatsAppShareUrl("a b&c")).toBe("https://wa.me/?text=a%20b%26c");
  });
});

describe("parseStoredItems", () => {
  it("ignora dados inválidos e corrige campos desconhecidos", () => {
    const raw = JSON.stringify([
      { id: "1", name: "Pão", quantity: 1, unitPrice: null, department: "xpto", unit: "zz" },
      { id: 2, name: "Inválido" },
      "lixo",
    ]);
    const items = parseStoredItems(raw);
    expect(items).toHaveLength(1);
    expect(items[0].department).toBe("outros");
    expect(items[0].unit).toBe("un");
    expect(items[0].bought).toBe(false);
  });
  it("tolera JSON corrompido", () => {
    expect(parseStoredItems("{oops")).toEqual([]);
    expect(parseStoredItems(null)).toEqual([]);
  });
});
