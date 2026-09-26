from datetime import date

from gads_tool.budget import CAMPAIGN_CAP, NO_BUDGET, OUT_OF_PERIOD, days_left_in_month, plan_budgets
from helpers import campaign, make_config


def test_days_left_counts_today():
    assert days_left_in_month(date(2026, 10, 1)) == 31
    assert days_left_in_month(date(2026, 10, 31)) == 1
    assert days_left_in_month(date(2028, 2, 29)) == 1


def test_splits_by_weight():
    cfg = make_config([campaign("A", weight=3), campaign("B", weight=1)])
    plan = plan_budgets(cfg, date(2026, 10, 1), spent_total=0)
    assert plan.daily_pool == 100.0  # 3100 / 31
    assert plan.allocations["A"].daily == 75.0
    assert plan.allocations["B"].daily == 25.0


def test_last_day_protects_against_double_spend():
    cfg = make_config()
    plan = plan_budgets(cfg, date(2026, 10, 31), spent_total=3000)
    # Restam 100; o Google pode gastar 2x o diário, então o diário é 50.
    assert plan.allocations["A"].daily == 50.0


def test_safety_margin_reduces_usable():
    cfg = make_config(safety_margin=0.1)
    plan = plan_budgets(cfg, date(2026, 10, 1), spent_total=0)
    assert plan.usable == 2790.0


def test_campaign_cap_redistributes_excess():
    cfg = make_config([campaign("A", weight=1, max_monthly=310), campaign("B", weight=1)])
    plan = plan_budgets(cfg, date(2026, 10, 1), spent_total=0, spent_by_campaign={})
    assert plan.allocations["A"].daily == 10.0
    assert plan.allocations["A"].reason == CAMPAIGN_CAP
    assert plan.allocations["B"].daily == 90.0


def test_max_daily_spend_caps_daily_budget():
    cfg = make_config([campaign("A", stop_rules={"max_daily_spend": 20}), campaign("B")])
    plan = plan_budgets(cfg, date(2026, 10, 1), spent_total=0)
    assert plan.allocations["A"].daily == 20.0
    assert plan.allocations["B"].daily == 80.0


def test_drops_lowest_weight_when_below_minimum():
    cfg = make_config([campaign("A", weight=9), campaign("B", weight=1)], min_daily=15)
    plan = plan_budgets(cfg, date(2026, 10, 1), spent_total=0)
    assert plan.allocations["B"].daily == 0
    assert plan.allocations["B"].reason == NO_BUDGET
    assert plan.allocations["A"].daily == 100.0


def test_limit_reached_means_zero():
    cfg = make_config()
    plan = plan_budgets(cfg, date(2026, 10, 15), spent_total=3200)
    assert plan.remaining == 0
    assert plan.allocations["A"].daily == 0


def test_out_of_period_gets_nothing():
    cfg = make_config([campaign("A", start_date="2026-11-01"), campaign("B")])
    plan = plan_budgets(cfg, date(2026, 10, 1), spent_total=0)
    assert plan.allocations["A"].reason == OUT_OF_PERIOD
    assert plan.allocations["B"].daily == 100.0


def test_never_allocates_more_than_pool():
    cfg = make_config([campaign(n, weight=w) for n, w in zip("ABCDE", [1, 2, 3, 5, 7])])
    for spent in (0, 999.99, 2500, 3099):
        plan = plan_budgets(cfg, date(2026, 10, 17), spent_total=spent)
        assert plan.allocated_total <= plan.daily_pool + 1e-9
        assert plan.allocated_total * cfg.budget.overspend_factor <= plan.remaining + 1e-9
