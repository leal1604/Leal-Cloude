"""Cálculo dos orçamentos diários a partir do limite mensal.

Como o Google cobra:
  * num único dia a campanha pode gastar até 2x o orçamento diário;
  * no mês, o teto cobrado é 30,4x o orçamento diário médio.
Por isso o orçamento diário é recalculado a cada execução com base no que
ainda resta do mês, e nunca fica acima de `restante / overspend_factor`:
mesmo que o Google gaste o dobro hoje, o limite mensal não é ultrapassado.
"""

from __future__ import annotations

import calendar
import math
from dataclasses import dataclass, field
from datetime import date

from .config import CampaignConfig, Config

NO_BUDGET = "NO_BUDGET"
CAMPAIGN_CAP = "CAMPAIGN_CAP"
OUT_OF_PERIOD = "OUT_OF_PERIOD"
EXCLUDED = "EXCLUDED"


@dataclass
class Allocation:
    name: str
    daily: float
    reason: str | None = None  # por que ficou zerado/limitado, se for o caso


@dataclass
class BudgetPlan:
    today: date
    monthly_limit: float
    usable: float
    spent: float
    remaining: float
    days_left: int
    daily_pool: float
    allocations: dict[str, Allocation] = field(default_factory=dict)

    @property
    def allocated_total(self) -> float:
        return round(sum(a.daily for a in self.allocations.values()), 2)


def floor_cents(value: float) -> float:
    return max(0.0, math.floor(value * 100 + 1e-6) / 100)


def days_left_in_month(today: date) -> int:
    """Dias restantes no mês, contando hoje."""
    return calendar.monthrange(today.year, today.month)[1] - today.day + 1


def days_left_for_campaign(camp: CampaignConfig, today: date) -> int:
    last = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
    if camp.end_date and camp.end_date < last:
        last = camp.end_date
    return max(1, (last - today).days + 1)


def plan_budgets(
    cfg: Config,
    today: date,
    spent_total: float,
    spent_by_campaign: dict[str, float] | None = None,
    excluded: set[str] | frozenset[str] = frozenset(),
) -> BudgetPlan:
    """Distribui o que resta do limite mensal entre as campanhas, por peso.

    `spent_total` é o gasto do mês que conta para o limite (a conta toda ou só
    as campanhas gerenciadas, conforme `budget.scope`). `excluded` são
    campanhas que não devem receber orçamento (ex.: pausadas por regra).
    """
    spent_by_campaign = spent_by_campaign or {}
    b = cfg.budget
    remaining = max(0.0, b.usable - spent_total)
    days_left = days_left_in_month(today)
    pool = min(remaining / days_left, remaining / b.overspend_factor)
    plan = BudgetPlan(
        today=today,
        monthly_limit=b.monthly_limit,
        usable=round(b.usable, 2),
        spent=round(spent_total, 2),
        remaining=round(remaining, 2),
        days_left=days_left,
        daily_pool=floor_cents(pool),
    )

    eligible: list[CampaignConfig] = []
    for camp in cfg.campaigns:
        if camp.name in excluded:
            plan.allocations[camp.name] = Allocation(camp.name, 0.0, EXCLUDED)
        elif not camp.is_active_on(today):
            plan.allocations[camp.name] = Allocation(camp.name, 0.0, OUT_OF_PERIOD)
        else:
            eligible.append(camp)

    caps: dict[str, float] = {}
    for camp in eligible:
        if camp.max_monthly is not None:
            left = max(0.0, camp.max_monthly - spent_by_campaign.get(camp.name, 0.0))
            caps[camp.name] = min(left / days_left_for_campaign(camp, today), left / b.overspend_factor)
        if camp.stop_rules.max_daily_spend is not None:
            caps[camp.name] = min(caps.get(camp.name, math.inf), camp.stop_rules.max_daily_spend)

    # Se não há dinheiro para o mínimo diário de todas, a campanha de menor
    # peso fica sem orçamento (e será pausada) e o cálculo é refeito.
    while eligible:
        shares = _water_fill(eligible, pool, caps)
        below = [c for c in eligible if shares[c.name] < b.min_daily]
        if not below:
            break
        victim = min(below, key=lambda c: (c.weight, c.name))
        capped = victim.name in caps and caps[victim.name] <= shares[victim.name] + 1e-9
        plan.allocations[victim.name] = Allocation(victim.name, 0.0, CAMPAIGN_CAP if capped else NO_BUDGET)
        eligible.remove(victim)
    else:
        shares = {}

    for camp in eligible:
        reason = CAMPAIGN_CAP if camp.name in caps and shares[camp.name] >= caps[camp.name] - 1e-9 else None
        plan.allocations[camp.name] = Allocation(camp.name, floor_cents(shares[camp.name]), reason)

    # Mantém a ordem do arquivo de configuração.
    plan.allocations = {c.name: plan.allocations[c.name] for c in cfg.campaigns}
    return plan


def _water_fill(campaigns: list[CampaignConfig], pool: float, caps: dict[str, float]) -> dict[str, float]:
    """Divide `pool` por peso; campanhas que batem no teto ficam no teto e a
    sobra é redistribuída entre as demais."""
    shares: dict[str, float] = {}
    active = list(campaigns)
    left = pool
    while active:
        total_weight = sum(c.weight for c in active)
        proposal = {c.name: left * c.weight / total_weight for c in active}
        capped = [c for c in active if c.name in caps and proposal[c.name] >= caps[c.name]]
        if not capped:
            shares.update(proposal)
            break
        for c in capped:
            shares[c.name] = caps[c.name]
            left -= caps[c.name]
            active.remove(c)
        left = max(0.0, left)
    return shares
