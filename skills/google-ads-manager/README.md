# Google Ads Manager

Cria suas campanhas de Pesquisa no Google Ads a partir de um arquivo YAML, sobe
tudo pela API oficial e mantém um **guardião de orçamento** que recalcula os
orçamentos diários e pausa campanhas antes de você gastar além do limite.

```
campaigns.yaml ──validate──▶ plan ──upload──▶ Google Ads ◀──guard (a cada hora)──┐
                                                    │                             │
                                                    └── gasto do mês / de hoje ───┘
```

## 1. Instalação

```bash
cd skills/google-ads-manager
pip install -r requirements.txt
cp examples/campaigns.example.yaml campaigns.yaml   # edite com suas campanhas
```

## 2. Credenciais da API (uma vez só)

1. **Developer token**: numa conta de administrador (MCC) do Google Ads, vá em
   *Ferramentas › Centro de API* e peça o token. Ele começa em *acesso de teste*
   (só contas de teste); peça o **acesso básico** para usar na sua conta real.
2. **Cliente OAuth**: no Google Cloud Console, ative a *Google Ads API* e crie
   um ID de cliente OAuth do tipo *App para computador*.
3. **Refresh token**: rode o exemplo oficial
   [`generate_user_credentials.py`](https://github.com/googleads/google-ads-python/blob/main/examples/authentication/generate_user_credentials.py)
   com o client ID/secret e faça login com o usuário que acessa a conta.
4. Copie `examples/google-ads.example.yaml` para `~/google-ads.yaml` e preencha.
   Alternativa: variáveis de ambiente `GOOGLE_ADS_DEVELOPER_TOKEN`,
   `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`
   e `GOOGLE_ADS_USE_PROTO_PLUS=True`.

> Nunca faça commit desse arquivo. O `.gitignore` do repositório já ignora
> `google-ads.yaml` e `guard-state.json`.

## 3. Uso

```bash
python scripts/gads.py -c campaigns.yaml validate            # checa textos, limites, lances
python scripts/gads.py -c campaigns.yaml plan --no-live      # quanto cada campanha gasta por dia
python scripts/gads.py -c campaigns.yaml upload --validate-only   # o Google valida, nada é criado
python scripts/gads.py -c campaigns.yaml upload              # cria PAUSADAS para você revisar
python scripts/gads.py -c campaigns.yaml status              # gasto do mês x limite
python scripts/gads.py -c campaigns.yaml guard --dry-run     # mostra o que o guardião faria
python scripts/gads.py -c campaigns.yaml guard               # executa de verdade
python scripts/gads.py -c campaigns.yaml pause --all         # botão de emergência
```

Quer ver funcionando sem conta? Use a conta simulada:

```bash
cp examples/offline-account.json /tmp/conta.json
python scripts/gads.py -c examples/campaigns.example.yaml --offline /tmp/conta.json --date 2026-10-20 guard --state /tmp/estado.json
```

## 4. Como o orçamento é protegido

| Proteção | Configuração | Efeito |
|---|---|---|
| Reserva de segurança | `safety_margin: 0.10` | Só 90% do limite é distribuído; o resto cobre atraso dos dados (até ~3 h) |
| Excesso diário do Google | `overspend_factor: 2.0` | O diário nunca passa de metade do que resta — nem um dia de gasto 2× estoura o mês |
| Ritmo | automático | Diário = restante ÷ dias restantes, recalculado a cada execução |
| Limite da conta | `pause_at: 0.98` | Pausa **todas** as campanhas do arquivo ao atingir 98% do utilizável |
| Teto por campanha | `max_monthly` | Limita o diário e pausa a campanha ao atingir o teto |
| CPA máximo | `stop_rules.max_cpa` + `min_spend_for_cpa` | Pausa campanhas caras demais por conversão |
| Sem conversão | `stop_rules.pause_if_no_conversions_after` | Pausa quem gastou X sem converter |
| Gasto diário | `stop_rules.max_daily_spend` | Limita o diário e pausa até amanhã se passar |

Pausas por limite mensal, CPA e falta de conversão duram até o dia 1º do mês
seguinte (`auto_resume_next_month: true`); por gasto diário, até o dia
seguinte. O guardião **só reativa o que ele mesmo pausou** — o que você pausar
à mão continua pausado.

## 5. Rodando o guardião de hora em hora

O guardião só age quando é executado, então agende-o:

- **cron** (servidor/PC ligado):
  `17 * * * * cd /caminho/skills/google-ads-manager && python scripts/gads.py -c campaigns.yaml guard >> guard.log 2>&1`
- **GitHub Actions**: copie `examples/github-actions-guard.yml` para
  `.github/workflows/` de um repositório **privado** e cadastre as credenciais
  como *secrets*.
- Avisos: defina `GADS_WEBHOOK_URL` (Slack, Discord etc.) para receber uma
  mensagem sempre que algo for pausado, reativado ou ajustado.

## Limitações

- Os dados de custo do Google podem atrasar até ~3 h; por isso a reserva e a
  pausa em 98%. Aumente `safety_margin` se o seu gasto por hora for alto.
- Suporta campanhas de **Pesquisa** com anúncios responsivos. Performance Max,
  Display, Shopping e extensões ainda não.
- Orçamentos compartilhados não são ajustados automaticamente (o guardião avisa).
- Os valores do YAML são interpretados na moeda da conta.
