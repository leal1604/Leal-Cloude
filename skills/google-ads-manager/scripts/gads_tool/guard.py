"""Guardião do orçamento: roda periodicamente (ex.: a cada hora) e

1. pausa tudo se o gasto do mês chegar ao limite;
2. pausa campanhas que violam suas regras (teto mensal, CPA, sem conversão,
   gasto diário);
3. recalcula e ajusta os orçamentos diários para o restante do mês caber
   no limite;
4. reativa campanhas que ELE MESMO pausou, quando o motivo expira (dia
   seguinte ou mês seguinte). Campanhas pausadas por você nunca são ligadas.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from .budget import BudgetPlan, plan_budgets
from .clients import ENABLED, PAUSED, CampaignSnapshot
from .config import Config

ACCOUNT_LIMIT = "ACCOUNT_LIMIT"
CAMPAIGN_LIMIT = "CAMPAIGN_LIMIT"
MAX_CPA = "MAX_CPA"
NO_CONVERSIONS = "NO_CONVERSIONS"
DAILY_LIMIT = "DAILY_LIMIT"
NO_BUDGET = "NO_BUDGET"
NOT_STARTED = "NOT_STARTED"

REASON_TEXT = {
    ACCOUNT_LIMIT: "limite mensal da conta atingido",
    CAMPAIGN_LIMIT: "teto mensal da campanha atingido",
    MAX_CPA: "custo por conversão acima do máximo",
    NO_CONVERSIONS: "gasto sem nenhuma conversão",
    DAILY_LIMIT: "gasto de hoje acima do máximo diário",
    NO_BUDGET: "orçamento restante insuficiente",
    NOT_STARTED: "campanha ainda não começou",
}


@dataclass
class Action:
    kind: str  # "pause" | "enable" | "set_budget"
    campaign: str
    reason: str = ""
    detail: str = ""
    until: str | None = None
    old_budget: float | None = None
    new_budget: float | None = None
    error: str | None = None


@dataclass
class GuardResult:
    today: date
    plan: BudgetPlan
    actions: list[Action] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    snapshots: dict[str, CampaignSnapshot] = field(default_factory=dict)
    dry_run: bool = False

    @property
    def errors(self) -> list[Action]:
        return [a for a in self.actions if a.error]


class GuardState:
    """Lembra quais campanhas o guardião pausou, por quê e até quando."""

    def __init__(self, path: str | None = None, data: dict | None = None):
        self.path = path
        self.data = data or {"version": 1, "paused": {}, "history": []}

    @classmethod
    def load(cls, path: str) -> GuardState:
        if os.path.exists(path):
            with open(path, encoding="utf-8") as fh:
                return cls(path, json.load(fh))
        return cls(path)

    def save(self) -> None:
        if not self.path:
            return
        self.data["history"] = self.data["history"][-500:]
        tmp = f"{self.path}.tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(self.data, fh, ensure_ascii=False, indent=2)
        os.replace(tmp, self.path)

    @property
    def paused(self) -> dict[str, dict]:
        return self.data["paused"]

    def log(self, action: Action, when: datetime) -> None:
        entry = {k: v for k, v in action.__dict__.items() if v not in (None, "")}
        entry["at"] = when.isoformat(timespec="seconds")
        self.data["history"].append(entry)


def next_month(day: date) -> date:
    return date(day.year + (day.month == 12), day.month % 12 + 1, 1)


def run_guard(cfg: Config, client, state: GuardState, today: date, dry_run: bool = False) -> GuardResult:
    b = cfg.budget
    snaps = {s.name: s for s in client.list_campaigns()}
    managed = [c for c in cfg.campaigns if c.name in snaps]
    warnings = [
        f"Campanha '{c.name}' não existe na conta (rode o comando upload)."
        for c in cfg.campaigns
        if c.name not in snaps
    ]

    month_until = next_month(today).isoformat() if b.auto_resume_next_month else None
    tomorrow = (today + timedelta(days=1)).isoformat()

    # Pausas anteriores do guardião: as vencidas são liberadas, as demais seguem valendo.
    released: set[str] = set()
    held: dict[str, tuple[str, str | None]] = {}
    for name, info in list(state.paused.items()):
        snap = snaps.get(name)
        if snap is None or snap.status == ENABLED:
            # Campanha removida ou reativada manualmente: esquecemos a pausa
            # (as regras abaixo voltam a valer normalmente).
            del state.paused[name]
        elif info.get("until") and info["until"] <= today.isoformat():
            released.add(name)
            del state.paused[name]
        else:
            held[name] = (info["reason"], info.get("until"))

    if b.scope == "account":
        spent_total = sum(s.cost_month for s in snaps.values())
    else:
        spent_total = sum(snaps[c.name].cost_month for c in managed)
    spent_by = {c.name: snaps[c.name].cost_month for c in managed}

    blocked: dict[str, tuple[str, str | None, str]] = {}
    for name, (reason, until) in held.items():
        blocked[name] = (reason, until, "pausa anterior ainda em vigor")

    if spent_total >= b.hard_stop:
        detail = f"gasto no mês {spent_total:.2f} >= {b.hard_stop:.2f}"
        for c in managed:
            blocked[c.name] = (ACCOUNT_LIMIT, month_until, detail)
        if b.pause_unmanaged:
            for name in snaps:
                blocked.setdefault(name, (ACCOUNT_LIMIT, month_until, detail))
    else:
        for c in managed:
            if c.name in blocked:
                continue
            hit = _check_rules(c, snaps[c.name], b.pause_at, month_until, tomorrow)
            if hit:
                blocked[c.name] = hit

    plan = plan_budgets(cfg, today, spent_total, spent_by, excluded=frozenset(blocked))
    result = GuardResult(today=today, plan=plan, warnings=warnings, snapshots=snaps, dry_run=dry_run)

    def keep_paused(name: str, reason: str, until: str | None, detail: str) -> None:
        # Liberada agora, mas continua sem poder rodar: segue registrada como
        # pausa do guardião para ser retomada quando o novo motivo expirar.
        if name in released and name not in state.paused:
            state.paused[name] = {"reason": reason, "until": until, "since": today.isoformat(), "detail": detail}

    pauses: list[Action] = []
    budgets: list[Action] = []
    enables: list[Action] = []
    for name, (reason, until, detail) in blocked.items():
        snap = snaps.get(name)
        if snap and snap.status == ENABLED:
            pauses.append(Action("pause", name, reason, detail, until))
        elif snap:
            keep_paused(name, reason, until, detail)

    for c in managed:
        if c.name in blocked:
            continue
        snap = snaps[c.name]
        if not c.is_active_on(today):
            if c.start_date and today < c.start_date:
                keep_paused(c.name, NOT_STARTED, c.start_date.isoformat(), "aguardando start_date")
            continue
        alloc = plan.allocations[c.name]
        if alloc.daily <= 0:
            if snap.status == ENABLED:
                pauses.append(Action("pause", c.name, NO_BUDGET, "sem orçamento para o mínimo diário", tomorrow))
            else:
                keep_paused(c.name, NO_BUDGET, tomorrow, "sem orçamento para o mínimo diário")
            continue
        if snap.budget_shared:
            result.warnings.append(f"'{c.name}' usa orçamento compartilhado; não foi ajustado automaticamente.")
        elif _differs(snap.daily_budget, alloc.daily, b.rebalance_threshold):
            budgets.append(
                Action("set_budget", c.name, "rebalance", old_budget=snap.daily_budget, new_budget=alloc.daily)
            )
        if snap.status == PAUSED and c.name in released:
            enables.append(Action("enable", c.name, "resume", "motivo da pausa expirou"))

    # Campanhas fora do arquivo que o guardião pausou (pause_unmanaged).
    managed_names = {c.name for c in managed}
    for name in sorted(released - managed_names - set(blocked)):
        if snaps[name].status == PAUSED:
            enables.append(Action("enable", name, "resume", "motivo da pausa expirou"))

    # Ordem importa: primeiro para o gasto, depois ajusta, por fim reativa.
    for action in pauses + budgets + enables:
        result.actions.append(action)
        if not dry_run:
            _execute(client, snaps[action.campaign], action)
        if action.error:
            continue
        if action.kind == "pause":
            state.paused[action.campaign] = {
                "reason": action.reason,
                "until": action.until,
                "since": today.isoformat(),
                "detail": action.detail,
            }
        if not dry_run:
            state.log(action, datetime.now())

    if not dry_run:
        state.save()
    return result


def _check_rules(camp, snap: CampaignSnapshot, pause_at: float, month_until, tomorrow):
    r = camp.stop_rules
    if camp.max_monthly is not None and snap.cost_month >= camp.max_monthly * pause_at:
        return CAMPAIGN_LIMIT, month_until, f"gasto {snap.cost_month:.2f} de teto {camp.max_monthly:.2f}"
    if r.pause_if_no_conversions_after is not None and snap.conversions_month == 0 and (
        snap.cost_month >= r.pause_if_no_conversions_after
    ):
        return NO_CONVERSIONS, month_until, f"gastou {snap.cost_month:.2f} sem conversões"
    if r.max_cpa is not None and snap.conversions_month > 0 and snap.cost_month >= r.min_spend_for_cpa:
        cpa = snap.cost_month / snap.conversions_month
        if cpa > r.max_cpa:
            return MAX_CPA, month_until, f"CPA {cpa:.2f} > {r.max_cpa:.2f}"
    if r.max_daily_spend is not None and snap.cost_today >= r.max_daily_spend:
        return DAILY_LIMIT, tomorrow, f"gasto hoje {snap.cost_today:.2f} >= {r.max_daily_spend:.2f}"
    return None


def _differs(current: float, new: float, threshold: float) -> bool:
    if current <= 0:
        return True
    return abs(new - current) / current > threshold


def _execute(client, snap: CampaignSnapshot, action: Action) -> None:
    try:
        if action.kind == "pause":
            client.set_status(snap, PAUSED)
        elif action.kind == "enable":
            client.set_status(snap, ENABLED)
        elif action.kind == "set_budget":
            client.set_daily_budget(snap, action.new_budget)
    except Exception as exc:  # uma falha não pode impedir as demais pausas
        action.error = str(exc).strip().splitlines()[0] if str(exc).strip() else type(exc).__name__
