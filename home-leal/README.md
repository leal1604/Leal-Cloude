# Home Leal

> Nossa casa, tudo organizado.

Aplicação web (otimizada para telemóveis Android) para organizar as compras da casa.
Feita com **Next.js 16**, **TypeScript** e **Tailwind CSS 4**.

## Estado atual — Etapa 1

Implementado e testado:

- Página inicial com resumo: produtos pendentes, comprados, custo estimado, valor que falta comprar e valor real pago.
- 10 departamentos: Mercearia, Frutas e Legumes, Limpeza, Laticínios, Proteínas, Higiene Pessoal, Padaria, Congelados, Bebidas e Outros.
- Adicionar, editar e eliminar produtos (nome, quantidade, unidade, preço estimado por unidade e observações).
- Marcar como comprado; o valor pago fica pré-preenchido com o estimado e pode ser corrigido.
- Lista agrupada por departamento, com pesquisa e filtro.
- Partilha pelo WhatsApp, organizada por departamento (com opção de incluir comprados) e botão para copiar o texto.
- Pode ser instalada no ecrã inicial do Android (manifesto PWA e ícones).

**Limitação importante:** nesta etapa os dados ficam guardados **apenas no navegador deste dispositivo**
(`localStorage`). O Paulo e a Ana ainda **não** veem a mesma lista em telemóveis diferentes —
isso chega na Etapa 2, com o Supabase.

## Próximas etapas

2. Autenticação (Supabase Auth) e lista partilhada em tempo real entre Paulo e Ana.
3. Listas de compras habituais.
4. Orçamento mensal e histórico de compras.

## Executar localmente

Requisitos: Node.js 20.9 ou superior.

```bash
cd home-leal
npm install
npm run dev
```

Abrir <http://localhost:3000>. Para testar no telemóvel na mesma rede Wi-Fi, use
`npm run dev -- -H 0.0.0.0` e abra `http://<IP-do-computador>:3000` no telemóvel.

## Testes

```bash
npm test            # testes unitários (cálculos, mensagem WhatsApp, leitura de dados)
npm run build       # build de produção
npm run test:e2e    # teste ponta-a-ponta num Pixel 7 emulado (requer build feito e Playwright)
```

## Publicar (Vercel)

1. Entrar em <https://vercel.com> com a conta GitHub.
2. **Add New → Project** e importar este repositório.
3. Em **Root Directory** escolher `home-leal`. O resto fica por defeito (Next.js é detetado).
4. **Deploy**. No fim recebe um endereço `https://….vercel.app`.
5. No Android, abrir esse endereço no Chrome → menu ⋮ → **Adicionar ao ecrã principal**.

Nesta etapa não são necessárias variáveis de ambiente nem chaves.
