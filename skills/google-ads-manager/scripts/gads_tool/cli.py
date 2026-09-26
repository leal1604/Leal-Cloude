"""Linha de comando: validate, plan, upload, guard, status e pause."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import date, datetime

from .budget import CAMPAIGN_CAP, EXCLUDED, NO_BUDGET, OUT_OF_PERIOD, plan_budgets
from .clients import ENABLED, PAUSED, FakeAdsClient, GoogleAdsApiClient
from .config import Config, ConfigError, load_config
from .guard import REASON_TEXT, GuardState, run_guard

ALLOC_TEXT = {
    NO_BUDGET: "sem orçamento p/ mínimo diário",
    CAMPAIGN_CAP: "limitada pelo teto da campanha",
    OUT_OF_PERIOD: "fora do período",
    EXCLUDED: "bloqueada por regra",
}


def money(value: float, currency: str = "BRL") -> str:
    text = f"{value:,.2f}"
    local = text.replace(",", "_").replace(".", ",").replace("_", ".")
    if currency == "BRL":
        return f"R$ {local}"
    if currency == "EUR":
        return f"{local} €"
    return f"{currency} {text}"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="gads.py",
        description="Cria campanhas no Google Ads e protege o orçamento mensal.",
    )
    parser.add_argument("-c", "--config", default="campaigns.yaml", help="arquivo YAML das campanhas")
    parser.add_argument("--credentials", help="google-ads.yaml (padrão: variáveis GOOGLE_ADS_* ou ~/google-ads.yaml)")
    parser.add_argument("--offline", metavar="JSON", help="simula a conta a partir de um JSON (não usa a API)")
    parser.add_argument("--date", type=date.fromisoformat, help="força a data de hoje (AAAA-MM-DD), útil p/ simular")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("validate", help="valida o arquivo de campanhas (offline)")

    p = sub.add_parser("plan", help="mostra quanto cada campanha pode gastar por dia")
    p.add_argument("--spent", type=float, help="gasto do mês até agora (sem isso, lê da conta ou assume 0 com --no-live)")
    p.add_argument("--no-live", action="store_true", help="não consulta a conta")

    p = sub.add_parser("upload", help="cria as campanhas na conta (PAUSADAS por padrão)")
    p.add_argument("--only", action="append", metavar="NOME", help="cria só esta campanha (pode repetir)")
    p.add_argument("--enable", action="store_true", help="cria já ATIVAS em vez de pausadas")
    p.add_argument("--validate-only", action="store_true", help="o Google valida tudo mas não cria nada")
    p.add_argument("--dry-run", action="store_true", help="só mostra o que seria criado")

    p = sub.add_parser("guard", help="verifica gastos, pausa o necessário e ajusta orçamentos")
    p.add_argument("--dry-run", action="store_true", help="só mostra as ações, não altera nada")
    p.add_argument("--state", default="guard-state.json", help="arquivo de estado do guardião")
    p.add_argument("--webhook", default=os.environ.get("GADS_WEBHOOK_URL"), help="URL para avisar quando houver ações")
    p.add_argument("--json", metavar="ARQUIVO", help="grava as ações decididas em JSON (para executar por outro meio)")

    sub.add_parser("status", help="gasto do mês por campanha")

    p = sub.add_parser("pause", help="pausa campanhas imediatamente (emergência)")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--campaign", action="append", metavar="NOME")
    g.add_argument("--all", action="store_true", help="todas as campanhas do arquivo")
    p.add_argument("--yes", action="store_true", help="não pede confirmação")

    args = parser.parse_args(argv)

    try:
        cfg = load_config(args.config)
    except FileNotFoundError:
        print(f"Arquivo não encontrado: {args.config}", file=sys.stderr)
        return 2
    except ConfigError as exc:
        print(f"{len(exc.errors)} problema(s) em {args.config}:", file=sys.stderr)
        for err in exc.errors:
            print(f"  - {err}", file=sys.stderr)
        return 2

    if args.command == "validate":
        return cmd_validate(cfg)
    if args.command == "plan" and args.no_live:
        return cmd_plan(cfg, None, args)

    client = _make_client(cfg, args)
    try:
        if args.command == "plan":
            return cmd_plan(cfg, client, args)
        if args.command == "upload":
            return cmd_upload(cfg, client, args)
        if args.command == "guard":
            return cmd_guard(cfg, client, args)
        if args.command == "status":
            return cmd_status(cfg, client, args)
        if args.command == "pause":
            return cmd_pause(cfg, client, args)
    finally:
        simulated_write = not getattr(args, "dry_run", False) and not getattr(args, "validate_only", False)
        if isinstance(client, FakeAdsClient) and args.command in ("upload", "guard", "pause") and simulated_write:
            with open(args.offline, "w", encoding="utf-8") as fh:
                    json.dump(client.dump(), fh, ensure_ascii=False, indent=2)
    return 0


def _make_client(cfg: Config, args):
    if args.offline:
        return FakeAdsClient.from_json(args.offline)
    return GoogleAdsApiClient(cfg.account.customer_id, args.credentials, cfg.account.login_customer_id)


def _today(cfg: Config, client, args) -> date:
    if args.date:
        return args.date
    tz_name = cfg.account.timezone
    if client is not None:
        info = client.account_info()
        if info.currency != cfg.account.currency:
            print(
                f"ATENÇÃO: a conta usa {info.currency}, mas o arquivo diz {cfg.account.currency}. "
                "Os valores do arquivo são interpretados na moeda da conta.",
                file=sys.stderr,
            )
        tz_name = info.timezone or tz_name
    try:
        from zoneinfo import ZoneInfo

        return datetime.now(ZoneInfo(tz_name)).date()
    except Exception:
        return date.today()


def cmd_validate(cfg: Config) -> int:
    groups = sum(len(c.ad_groups) for c in cfg.campaigns)
    ads = sum(len(g.ads) for c in cfg.campaigns for g in c.ad_groups)
    kws = sum(len(g.keywords) for c in cfg.campaigns for g in c.ad_groups)
    print(f"OK: {len(cfg.campaigns)} campanha(s), {groups} grupo(s), {ads} anúncio(s), {kws} palavra(s)-chave.")
    print(
        f"Limite mensal {money(cfg.budget.monthly_limit, cfg.account.currency)}; "
        f"utilizável {money(cfg.budget.usable, cfg.account.currency)} "
        f"(reserva de {cfg.budget.safety_margin:.0%})."
    )
    return 0


def cmd_plan(cfg: Config, client, args) -> int:
    cur = cfg.account.currency
    today = _today(cfg, client, args)
    spent_by: dict[str, float] = {}
    if args.spent is not None:
        spent = args.spent
    elif client is not None:
        snaps = client.list_campaigns()
        names = {c.name for c in cfg.campaigns}
        spent_by = {s.name: s.cost_month for s in snaps if s.name in names}
        spent = sum(s.cost_month for s in snaps) if cfg.budget.scope == "account" else sum(spent_by.values())
    else:
        spent = 0.0
    plan = plan_budgets(cfg, today, spent, spent_by)
    print(f"Plano de orçamento para {today:%d/%m/%Y}")
    print(f"  Limite mensal:        {money(plan.monthly_limit, cur)}")
    print(f"  Utilizável (reserva): {money(plan.usable, cur)}")
    print(f"  Gasto no mês:         {money(plan.spent, cur)}")
    print(f"  Restante:             {money(plan.remaining, cur)} em {plan.days_left} dia(s)")
    print(f"  Total diário:         {money(plan.daily_pool, cur)}")
    print()
    width = max(len(n) for n in plan.allocations) + 2
    for name, alloc in plan.allocations.items():
        note = ALLOC_TEXT.get(alloc.reason, "")
        print(f"  {name:<{width}} {money(alloc.daily, cur):>14}/dia  {note}")
    print()
    print(
        "Mesmo que o Google gaste 2x o orçamento diário hoje, o total fica dentro "
        "do limite: o valor diário nunca passa de restante / "
        f"{cfg.budget.overspend_factor:g}."
    )
    return 0


def cmd_upload(cfg: Config, client, args) -> int:
    cur = cfg.account.currency
    today = _today(cfg, client, args)
    snaps = {s.name: s for s in client.list_campaigns()}
    names = {c.name for c in cfg.campaigns}
    spent_by = {n: s.cost_month for n, s in snaps.items() if n in names}
    spent = sum(s.cost_month for s in snaps.values()) if cfg.budget.scope == "account" else sum(spent_by.values())
    plan = plan_budgets(cfg, today, spent, spent_by)

    selected = [c for c in cfg.campaigns if not args.only or c.name in args.only]
    for missing in set(args.only or []) - {c.name for c in selected}:
        print(f"Campanha '{missing}' não está no arquivo.", file=sys.stderr)
        return 2

    failures = created_paused = 0
    for camp in selected:
        if camp.name in snaps:
            print(f"= '{camp.name}' já existe na conta; nada a fazer.")
            continue
        daily = plan.allocations[camp.name].daily
        status = ENABLED if args.enable else PAUSED
        note = ""
        if daily <= 0:
            daily = cfg.budget.min_daily
            status = PAUSED
            note = " (sem orçamento disponível agora: criada PAUSADA)"
        label = "[dry-run] " if args.dry_run else "[validate-only] " if args.validate_only else ""
        groups = len(camp.ad_groups)
        kws = sum(len(g.keywords) for g in camp.ad_groups)
        print(
            f"+ {label}'{camp.name}': {money(daily, cur)}/dia, {camp.bidding.strategy}, "
            f"{groups} grupo(s), {kws} palavra(s)-chave, status {status}{note}"
        )
        if args.dry_run:
            continue
        try:
            rn = client.create_campaign(camp, daily, status, validate_only=args.validate_only)
            print(f"  OK {'(validado pelo Google, nada criado)' if args.validate_only else rn}")
            created_paused += status == PAUSED and not args.validate_only
        except Exception as exc:
            failures += 1
            print(f"  ERRO: {_api_error(exc)}", file=sys.stderr)
    if created_paused:
        print(
            "\nCampanhas criadas PAUSADAS. Revise no Google Ads e ative por lá, ou rode "
            "'upload --enable' da próxima vez. O 'guard' cuida do orçamento depois."
        )
    return 1 if failures else 0


def cmd_guard(cfg: Config, client, args) -> int:
    cur = cfg.account.currency
    today = _today(cfg, client, args)
    state = GuardState.load(args.state)
    result = run_guard(cfg, client, state, today, dry_run=args.dry_run)
    plan = result.plan

    prefix = "[dry-run] " if args.dry_run else ""
    print(f"{prefix}Guardião — {today:%d/%m/%Y}")
    print(
        f"Gasto no mês {money(plan.spent, cur)} de {money(plan.usable, cur)} utilizáveis "
        f"(limite {money(plan.monthly_limit, cur)}); restam {money(plan.remaining, cur)} "
        f"para {plan.days_left} dia(s)."
    )
    for w in result.warnings:
        print(f"  ! {w}")
    if not result.actions:
        print("Nenhuma ação necessária.")
    for a in result.actions:
        if a.kind == "pause":
            until = f" até {a.until}" if a.until else " (reative manualmente)"
            line = f"PAUSAR '{a.campaign}': {REASON_TEXT.get(a.reason, a.reason)} — {a.detail}{until}"
        elif a.kind == "enable":
            line = f"REATIVAR '{a.campaign}': {a.detail}"
        else:
            line = f"ORÇAMENTO '{a.campaign}': {money(a.old_budget or 0, cur)} -> {money(a.new_budget or 0, cur)}/dia"
        status = f"  ERRO: {a.error}" if a.error else ""
        print(f"  {prefix}{line}{status}")

    if args.json:
        payload = {
            "date": today.isoformat(),
            "spent_month": plan.spent,
            "usable": plan.usable,
            "hard_stop": round(cfg.budget.hard_stop, 2),
            "warnings": result.warnings,
            "actions": [
                {
                    "kind": a.kind,
                    "campaign": a.campaign,
                    "campaign_id": result.snapshots[a.campaign].resource_name if a.campaign in result.snapshots else "",
                    "reason": a.reason,
                    "detail": a.detail,
                    "until": a.until,
                    "new_budget": a.new_budget,
                    "new_budget_micros": round((a.new_budget or 0) * 100) * 10_000 if a.new_budget else None,
                }
                for a in result.actions
            ],
        }
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)
    if args.webhook and result.actions and not args.dry_run:
        _notify(args.webhook, result, cur)
    return 1 if result.errors else 0


def cmd_status(cfg: Config, client, args) -> int:
    cur = cfg.account.currency
    today = _today(cfg, client, args)
    snaps = client.list_campaigns()
    managed = {c.name for c in cfg.campaigns}
    total = sum(s.cost_month for s in snaps)
    print(f"Status em {today:%d/%m/%Y}")
    width = max([len(s.name) for s in snaps] + [8]) + 2
    print(f"  {'Campanha':<{width}} {'Status':<8} {'Orç./dia':>14} {'Hoje':>14} {'Mês':>14} {'Conv.':>6}")
    for s in sorted(snaps, key=lambda x: -x.cost_month):
        mark = "" if s.name in managed else " (fora do arquivo)"
        print(
            f"  {s.name:<{width}} {s.status:<8} {money(s.daily_budget, cur):>14} {money(s.cost_today, cur):>14} "
            f"{money(s.cost_month, cur):>14} {s.conversions_month:>6.1f}{mark}"
        )
    b = cfg.budget
    used = total / b.monthly_limit if b.monthly_limit else 0
    print(f"\nTotal no mês: {money(total, cur)} = {used:.0%} do limite de {money(b.monthly_limit, cur)}.")
    print(f"Pausa automática em {money(b.hard_stop, cur)}.")
    return 0


def cmd_pause(cfg: Config, client, args) -> int:
    snaps = {s.name: s for s in client.list_campaigns()}
    names = [c.name for c in cfg.campaigns] if args.all else args.campaign
    targets = [snaps[n] for n in names if n in snaps and snaps[n].status == ENABLED]
    for n in names:
        if n not in snaps:
            print(f"'{n}' não encontrada na conta.", file=sys.stderr)
    if not targets:
        print("Nenhuma campanha ativa para pausar.")
        return 0
    print("Pausar: " + ", ".join(f"'{s.name}'" for s in targets))
    if not args.yes and input("Confirmar? [s/N] ").strip().lower() not in ("s", "sim", "y", "yes"):
        print("Cancelado.")
        return 1
    failures = 0
    for snap in targets:
        try:
            client.set_status(snap, PAUSED)
            print(f"  pausada: {snap.name}")
        except Exception as exc:
            failures += 1
            print(f"  ERRO em {snap.name}: {_api_error(exc)}", file=sys.stderr)
    return 1 if failures else 0


def _api_error(exc: Exception) -> str:
    failure = getattr(exc, "failure", None)
    if failure is not None:
        parts = []
        for err in failure.errors:
            path = ".".join(el.field_name for el in err.location.field_path_elements)
            parts.append(f"{err.message} [{path}]" if path else err.message)
        return "; ".join(parts)
    return str(exc)


def _notify(url: str, result, cur: str) -> None:
    lines = [f"Google Ads — guardião ({result.today:%d/%m/%Y})"]
    for a in result.actions:
        if a.kind == "pause":
            lines.append(f"⏸ {a.campaign}: {REASON_TEXT.get(a.reason, a.reason)} ({a.detail})")
        elif a.kind == "enable":
            lines.append(f"▶ {a.campaign}: reativada")
        else:
            lines.append(f"💰 {a.campaign}: {money(a.old_budget or 0, cur)} → {money(a.new_budget or 0, cur)}/dia")
    body = json.dumps({"text": "\n".join(lines), "content": "\n".join(lines)}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as exc:
        print(f"  ! falha ao enviar aviso: {exc}", file=sys.stderr)
