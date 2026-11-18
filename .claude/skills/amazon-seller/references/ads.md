# Amazon Ads — playbook

## Pré-requisitos antes de anunciar

- Anúncio pronto (título, bullets, 7 fotos). Ads em anúncio fraco só compra cliques que não convertem.
- Estoque suficiente para o período (campanha sem estoque perde ranking).
- Ganhando a Buy Box (sem Buy Box o anúncio patrocinado não aparece).
- ACoS de equilíbrio e ACoS-alvo calculados (`precificacao.md`).
- Idealmente algumas avaliações; sem nenhuma, a conversão tende a ser baixa — considere o Programa de Avaliações oficial da Amazon (Vine), se elegível.

## Nomenclatura

`[SKU] - [TIPO] - [SEGMENTAÇÃO] - [detalhe]` — ex.: `GARRAFA01 - SP - EXATA - principais`. Um produto (ou família de variações) por campanha facilita ler o ACoS.

## Estrutura de lançamento (Sponsored Products)

| Campanha | Configuração | Lance inicial |
|---|---|---|
| AUTO | Automática, 4 grupos de segmentação ativos (correspondência próxima, ampla, substitutos, complementos) | Sugerido pela Amazon ou um pouco abaixo |
| EXATA | 5–15 termos mais relevantes, correspondência exata | Perto do sugerido; são os termos mais valiosos |
| AMPLA | Os mesmos termos em frase/ampla para descoberta | 20–30% abaixo da EXATA |
| ASIN | Segmentação por produto: concorrentes com preço/avaliação piores que o seu; e seus próprios ASINs (defesa) | Moderado |

Estratégia de lance: **Dinâmico – somente para baixo** no começo (mais seguro). Ajuste de posicionamento em "topo da pesquisa" só depois de ver que o topo converte melhor.

Orçamento: divida o diário entre as campanhas, mais peso em AUTO e EXATA no lançamento. Campanha que esgota orçamento cedo todo dia perde vendas — ou sobe orçamento, ou reduz lances.

## Rotina de otimização (semanal)

Use o relatório de **termos de pesquisa** (mínimo 7–14 dias de dados; a atribuição da Amazon tem atraso de alguns dias).

| Situação do termo | Ação |
|---|---|
| Vendeu, ACoS ≤ alvo | Colhe para EXATA (se ainda não está) e negativa exata na AUTO/AMPLA para não competir com você |
| Vendeu, ACoS acima do alvo | Reduz lance proporcionalmente: `novo_lance = lance × (ACoS_alvo ÷ ACoS_atual)` |
| Muitos cliques, zero venda (cliques ≥ ~2× o nº de cliques que normalmente gera 1 venda) | Negativa exata (ou frase, se o termo é claramente irrelevante) |
| Irrelevante (outro produto, outra finalidade) | Negativa imediatamente |
| Impressões altas, cliques baixíssimos (CTR baixo) | Problema de imagem principal, preço ou título — não de lance |
| Cliques ok, conversão baixa | Problema de anúncio, preço, avaliações ou Buy Box |

Não mexa nos lances de um termo mais de uma vez por semana: deixe os dados assentarem.

## Fases

1. **Lançamento (semanas 1–4):** foco em visibilidade e primeiras vendas; aceita ACoS perto do equilíbrio.
2. **Otimização (mês 2–3):** cortar desperdício, mover verba para EXATA, ACoS caminhando para o alvo.
3. **Escala/lucro:** TACoS caindo; com Registro de Marca, adicionar Sponsored Brands (banner com logo + 3 produtos, ou vídeo) e Sponsored Display para remarketing.

## Diagnóstico rápido

| Sintoma | Causa provável |
|---|---|
| Quase sem impressões | Lance baixo, orçamento baixo, anúncio não indexado, sem Buy Box |
| ACoS altíssimo na AUTO | Normal no início; negativar com disciplina |
| Vende por ads mas orgânico não cresce | Preço/anúncio fraco, poucas avaliações, termos-alvo muito genéricos |
| Gasto parou de repente | Orçamento esgotado, cartão recusado, anúncio suprimido ou sem estoque |
