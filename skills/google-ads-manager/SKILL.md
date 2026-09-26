---
name: google-ads-manager
description: Gera campanhas de Pesquisa do Google Ads a partir de um briefing, sobe na conta via API e protege o orçamento mensal — calcula orçamentos diários, pausa campanhas que estouram limites ou regras (CPA, gasto sem conversão, gasto diário) e reativa quando o motivo expira. Use quando o usuário pedir para criar, subir, pausar, acompanhar ou controlar gastos de campanhas no Google Ads.
---

# Google Ads Manager

Ferramenta de linha de comando em `scripts/gads.py` com um arquivo YAML como fonte da verdade.
Rode sempre `python scripts/gads.py --help` (ou `<comando> --help`) antes de ler o código.

| Comando | O que faz | Precisa da API? |
|---|---|---|
| `validate` | Valida o YAML (limites de caracteres, quantidades, lances) | Não |
| `plan --no-live [--spent X]` | Mostra o orçamento diário de cada campanha | Não |
| `upload [--dry-run \| --validate-only] [--enable] [--only NOME]` | Cria campanhas (PAUSADAS por padrão), numa operação atômica por campanha | Sim |
| `guard [--dry-run]` | Lê o gasto, pausa o necessário, ajusta orçamentos, reativa o que ele mesmo pausou | Sim |
| `status` | Gasto do mês por campanha e % do limite | Sim |
| `pause --all \| --campaign NOME` | Pausa imediata (emergência) | Sim |

Opções globais: `-c campaigns.yaml`, `--credentials google-ads.yaml`, `--offline conta.json` (simula a conta sem API; ver `examples/offline-account.json`), `--date AAAA-MM-DD`.

## Fluxo para criar campanhas

1. **Briefing.** Pergunte o que faltar: negócio e oferta, URL de destino, região, público, **limite mensal** (o máximo absoluto), objetivo (cliques ou conversões), e se há conversões configuradas na conta. Nunca invente o limite mensal nem o `customer_id`.
2. **Escreva o `campaigns.yaml`** a partir de `examples/campaigns.example.yaml` (comentado, mostra todos os campos).
   - Separe grupos de anúncios por intenção (serviço, produto, marca). 5–20 palavras-chave por grupo, priorizando `[exata]` e `"frase"`; use ampla só com MAXIMIZE_CONVERSIONS.
   - Anúncio responsivo: 8–15 títulos (≤30 caracteres) e 4 descrições (≤90). Varie: benefício, prova, oferta, chamada para ação, palavra-chave. Sem títulos repetidos, sem CAIXA ALTA, sem "!" no título.
   - Inclua palavras negativas óbvias (grátis, curso, emprego, vagas, pdf, o que for irrelevante ao negócio).
   - Sem histórico de conversões: `MAXIMIZE_CLICKS` com `max_cpc`. Com conversões medidas: `MAXIMIZE_CONVERSIONS`.
   - Sempre defina `stop_rules` (ao menos `max_daily_spend`; e `max_cpa`/`pause_if_no_conversions_after` quando houver conversões).
3. `validate` e corrija até passar. Depois `plan --no-live` e mostre ao usuário quanto cada campanha vai gastar por dia.
4. `upload --validate-only` (o Google valida sem criar). Só então `upload`. Use `--enable` **apenas** com confirmação explícita do usuário.
5. Configure o guardião para rodar de hora em hora (cron, `examples/github-actions-guard.yml` ou uma Routine). Faça antes um `guard --dry-run` e mostre o resultado.

## Como o orçamento é protegido

- Utilizável = `monthly_limit × (1 − safety_margin)`. A reserva cobre o atraso dos dados do Google (até ~3 h).
- Diário total = `min(restante ÷ dias restantes, restante ÷ overspend_factor)`. Como o Google pode gastar até 2× o diário num dia, o segundo termo garante que nem o pior dia estoura o limite.
- O total é dividido por `weight`, respeitando `max_monthly` e `max_daily_spend` de cada campanha; sobra é redistribuída. Campanha que ficaria abaixo de `min_daily` fica sem orçamento e é pausada.
- Ao atingir `pause_at` do utilizável, **todas** as campanhas do arquivo são pausadas (e as de fora, se `pause_unmanaged: true`).
- Pausas por limite/CPA/sem conversão valem até o dia 1º do mês seguinte (`auto_resume_next_month`); por gasto diário ou falta de orçamento, até o dia seguinte.
- O guardião **nunca** reativa campanhas que ele não pausou. O estado fica em `guard-state.json`.

## Regras

- Não aumente `monthly_limit`, não use `--enable` e não reative campanhas sem confirmação do usuário.
- Nunca grave credenciais em arquivos versionados; use `~/google-ads.yaml` ou variáveis `GOOGLE_ADS_*` (modelo em `examples/google-ads.example.yaml`).
- Erros da API vêm com o campo problemático entre colchetes; corrija o YAML e rode de novo (o upload é atômico, nada fica pela metade).
- Credenciais e configuração inicial da API: veja `README.md`.
