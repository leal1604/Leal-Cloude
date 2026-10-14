# Leal IA

Assistente de IA com roteamento automático entre modelos e planos **Básico** e **Pro**,
inspirado na estrutura de cobrança do ChatLLM (Pro = Básico + US$ 10/mês, sem limites no Agente e no Studio).

- **Publicado:** https://claude.ai/artifact/BHaFqkDBV8p2vqTrMhouXk
- **Código:** um único ficheiro, `index.html` (HTML, CSS e JavaScript sem dependências).

## O que tem

- **Landing page** com roteador ao vivo (escreva uma pergunta e veja a rota e o custo), recursos, planos e perguntas frequentes.
- **Assistente** (`#app`) com três modos:
  - **Chat**: conversa normal, com roteador Auto ou modelo escolhido à mão (Rápido, Equilibrado, Avançado).
  - **Agente**: plano em etapas → execução → resultado.
  - **Studio**: documentos longos com revisão na mesma conversa.
- **Créditos e planos**:

  | | Básico | Pro |
  |---|---|---|
  | Preço | US$ 10/mês | US$ 20/mês |
  | Créditos por ciclo de 30 dias | 20.000 | 30.000 |
  | Tarefas de agente | 3 | sem limite |
  | Conversas no Studio | 3 (até 2.500 créditos cada) | sem limite |

  Custo de uma resposta = tamanho do texto × multiplicador do modelo (Rápido ×1, Equilibrado ×3, Avançado ×8; Agente ×1,5).

## Como funciona por dentro

- As respostas vêm do Claude através da capacidade `sample` dos Artifacts, usando a conta Claude de quem abre a página
  (a primeira mensagem pede autorização).
- As conversas e o saldo ficam guardados de forma privada por utilizador (`db`, em `data/users/<id>/`). Sem sessão,
  ficam no `localStorage` do navegador.
- A cobrança ainda **não** está ligada: mudar de plano é imediato e sem custo. Para cobrar a sério é preciso um
  backend com um fornecedor de pagamentos (por exemplo Stripe) e uma chave própria da API do Claude.
