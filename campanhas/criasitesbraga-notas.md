# Cria Sites Braga — notas de configuração

Resumo do que foi decidido com o cliente, para qualquer sessão continuar daqui.

## Contas
| Item | Valor |
|---|---|
| Google Ads (conta nova) | **394-111-6472** — Portugal, EUR, fuso Europe/Lisbon |
| Conta Google com acesso ao Google Ads | shoppexpress77@gmail.com |
| Conta Windsor.ai com o Google Ads | euroshops77@gmail.com (plano Trial — precisa de plano pago antes de expirar, senão o guardião para) |
| Conta Windsor.ai antiga (só Meta Ads) | prpl1604@gmail.com — não usar para o Google Ads |

## Decisões
- Limite: **50 €/mês** (utilizável 45 €, pausa geral em ~44 €). Máx. 4 €/dia, CPC máx. 1,50 €.
- Começar **só Portugal** (`criasitesbraga.yaml`). Brasil guardado em `criasitesbraga-brasil.yaml` para quando o orçamento subir.
- Negócio: criação de sites e landing pages, sediado em Braga, atende Portugal e Brasil.
- **Site criasitesbraga.com ainda sem domínio configurado na HostGator**: subir campanhas PAUSADAS e **não ativar** até o site abrir com https.
- Cliente autorizou modo automático: o guardião pode pausar e reduzir/ajustar orçamentos diários sem perguntar; nunca aumentar o limite mensal nem reativar o que o cliente pausou.
- No assistente de criação da conta: meta "Enviar formulário de lead" (+ "Leads telefônicos" se atender por telefone). Qualquer campanha criada pelo assistente deve ficar pausada (`pause_unmanaged: true`).
- Desligar "Recomendações › Aplicar automaticamente" na conta.

## Estado atual (26/09/2026)
- Windsor (euroshops77) conectado ao Claude; conta Google Ads `394-111-6472` visível.
- Criado via Windsor, tudo **PAUSADO** no nível da campanha:
  | Item | ID |
  |---|---|
  | Campanha "PT \| Pesquisa \| Criação de Sites" (Maximizar cliques, 1,45 €/dia, CPC máx. 1,50 €, Portugal 2620, idioma pt, 17 negativas) | 24285479961 |
  | Grupo "PT - Criação de Sites" (10 palavras-chave, 1 RSA) | 204386986750 |
  | Grupo "PT - Landing Pages" (6 palavras-chave, 1 RSA) | 206177973088 |

## Rotina do guardião (de hora em hora)
1. Windsor `get_data` (google_ads, conta 394-111-6472), campos `campaign, campaign_id, campaign_status, budget_amount, spend, conversions, clicks`:
   `date_preset: this_monthT` → month.json; `date_from = date_to = hoje (Lisboa)` → today.json.
2. `python skills/google-ads-manager/scripts/windsor_snapshot.py --month month.json --today today.json -o snap.json`
3. `python skills/google-ads-manager/scripts/gads.py -c campanhas/criasitesbraga.yaml --offline snap.json guard --state campanhas/criasitesbraga-guard-state.json --json actions.json`
4. Executar `actions.json` via Windsor: pause → `pause_campaign`; set_budget → `set_campaign_budget` (daily, `new_budget_micros`); enable → `enable_campaign`.
5. Commit + push de `campanhas/criasitesbraga-guard-state.json`.

## Pendente
- Ativar a campanha (`enable_campaign` 24285479961) **só quando o cliente avisar que o site abre com https** (o ambiente não consegue acessar o site para checar).
- Windsor em plano Trial: assinar antes de expirar.
