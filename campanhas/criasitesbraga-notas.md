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

## Próximos passos
1. Confirmar no Windsor (`get_connectors`) que `google_ads` mostra a conta 3941116472.
2. Subir `criasitesbraga.yaml` PAUSADO via ações do Windsor (create_campaign, create_ad_group, push_keywords, push_negative_keywords, create_responsive_search_ad, set_campaign_geo_targeting 2620, set_campaign_language_targeting 1014).
3. Criar rotina de hora em hora: ler gasto (get_data), gerar snapshot JSON e rodar `gads.py --offline <snapshot> guard` para decidir; executar pausas/orçamentos via Windsor.
4. Ativar a campanha só quando o site estiver no ar com https.
