#!/usr/bin/env python3
"""Converte dados do Windsor.ai (get_data do conector google_ads) no JSON de
conta usado por `gads.py --offline`.

Entrada: dois arquivos JSON com a lista de linhas devolvida pelo get_data,
ambos com os campos campaign, campaign_id, campaign_status, budget_amount,
spend, conversions, clicks:
  --month  consulta com date_preset "this_monthT"
  --today  consulta com date_from = date_to = hoje (budget_amount = orçamento diário)

O campo resource_name do snapshot recebe o campaign_id, que volta nas ações
de `guard --json` para executar pause_campaign / set_campaign_budget.
"""

import argparse
import json


def load_rows(path):
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    return data.get("result", data) if isinstance(data, dict) else data


def build(month_rows, today_rows, currency, timezone):
    camps = {}
    for row in today_rows + month_rows:
        cid = str(row["campaign_id"])
        camps.setdefault(cid, {"name": row["campaign"], "status": row.get("campaign_status", "PAUSED")})
    for row in month_rows:
        c = camps[str(row["campaign_id"])]
        c["cost_month"] = c.get("cost_month", 0.0) + float(row.get("spend") or 0)
        c["conversions_month"] = c.get("conversions_month", 0.0) + float(row.get("conversions") or 0)
        c["clicks_month"] = c.get("clicks_month", 0) + int(row.get("clicks") or 0)
    for row in today_rows:
        c = camps[str(row["campaign_id"])]
        c["cost_today"] = c.get("cost_today", 0.0) + float(row.get("spend") or 0)
        c["daily_budget"] = float(row.get("budget_amount") or 0)
        c["status"] = row.get("campaign_status", c["status"])
    return {
        "account": {"currency": currency, "timezone": timezone},
        "campaigns": [
            {
                "name": c["name"],
                "status": c["status"],
                "resource_name": cid,
                "budget_resource": cid,
                "daily_budget": round(c.get("daily_budget", 0.0), 2),
                "cost_month": round(c.get("cost_month", 0.0), 2),
                "cost_today": round(c.get("cost_today", 0.0), 2),
                "conversions_month": c.get("conversions_month", 0.0),
                "clicks_month": c.get("clicks_month", 0),
            }
            for cid, c in camps.items()
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--month", required=True)
    parser.add_argument("--today", required=True)
    parser.add_argument("--currency", default="EUR")
    parser.add_argument("--timezone", default="Europe/Lisbon")
    parser.add_argument("-o", "--output", required=True)
    args = parser.parse_args()
    snap = build(load_rows(args.month), load_rows(args.today), args.currency, args.timezone)
    with open(args.output, "w", encoding="utf-8") as fh:
        json.dump(snap, fh, ensure_ascii=False, indent=2)
    print(f"{len(snap['campaigns'])} campanha(s) -> {args.output}")


if __name__ == "__main__":
    main()
