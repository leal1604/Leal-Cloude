from datetime import date

from gads_tool.clients import ENABLED, PAUSED, CampaignSnapshot, FakeAdsClient
from gads_tool.guard import ACCOUNT_LIMIT, DAILY_LIMIT, MAX_CPA, GuardState, run_guard
from helpers import campaign, make_config


def snap(name, status=ENABLED, **kw):
    kw.setdefault("daily_budget", 50.0)
    return CampaignSnapshot(name=name, status=status, resource_name=f"c/{name}", budget_resource=f"b/{name}", **kw)


def kinds(result):
    return [(a.kind, a.campaign) for a in result.actions]


def test_pauses_everything_at_account_limit_and_resumes_next_month():
    cfg = make_config([campaign("A"), campaign("B")])
    client = FakeAdsClient([snap("A", cost_month=2000), snap("B", cost_month=1100), snap("Outra", cost_month=0)])
    state = GuardState()
    result = run_guard(cfg, client, state, date(2026, 10, 20))
    assert ("pause", "A") in kinds(result) and ("pause", "B") in kinds(result)
    assert client.campaigns["Outra"].status == ENABLED  # fora do arquivo: não mexe
    assert state.paused["A"]["reason"] == ACCOUNT_LIMIT

    for s in client.campaigns.values():
        s.cost_month = 0
    result = run_guard(cfg, client, state, date(2026, 11, 1))
    assert client.campaigns["A"].status == ENABLED
    assert client.campaigns["B"].status == ENABLED
    assert not state.paused


def test_pause_unmanaged_on_limit():
    cfg = make_config([campaign("A")], pause_unmanaged=True)
    client = FakeAdsClient([snap("A", cost_month=3100), snap("Outra")])
    run_guard(cfg, client, GuardState(), date(2026, 10, 20))
    assert client.campaigns["Outra"].status == PAUSED


def test_daily_limit_pauses_until_tomorrow():
    cfg = make_config([campaign("A", stop_rules={"max_daily_spend": 40})])
    client = FakeAdsClient([snap("A", daily_budget=40, cost_today=45)])
    state = GuardState()
    run_guard(cfg, client, state, date(2026, 10, 10))
    assert client.campaigns["A"].status == PAUSED
    assert state.paused["A"]["reason"] == DAILY_LIMIT

    run_guard(cfg, client, state, date(2026, 10, 10))  # mesmo dia: continua pausada
    assert client.campaigns["A"].status == PAUSED

    client.campaigns["A"].cost_today = 0
    run_guard(cfg, client, state, date(2026, 10, 11))
    assert client.campaigns["A"].status == ENABLED


def test_cpa_rule_needs_minimum_spend():
    rules = {"max_cpa": 50, "min_spend_for_cpa": 300}
    cfg = make_config([campaign("A", stop_rules=rules)])
    client = FakeAdsClient([snap("A", cost_month=200, conversions_month=1)])
    run_guard(cfg, client, GuardState(), date(2026, 10, 10))
    assert client.campaigns["A"].status == ENABLED

    client.campaigns["A"].cost_month = 400
    state = GuardState()
    run_guard(cfg, client, state, date(2026, 10, 10))
    assert client.campaigns["A"].status == PAUSED
    assert state.paused["A"]["reason"] == MAX_CPA


def test_no_conversions_rule():
    cfg = make_config([campaign("A", stop_rules={"pause_if_no_conversions_after": 100})])
    client = FakeAdsClient([snap("A", cost_month=120, conversions_month=0)])
    run_guard(cfg, client, GuardState(), date(2026, 10, 10))
    assert client.campaigns["A"].status == PAUSED


def test_never_enables_campaign_paused_by_user():
    cfg = make_config([campaign("A")])
    client = FakeAdsClient([snap("A", status=PAUSED)])
    result = run_guard(cfg, client, GuardState(), date(2026, 10, 10))
    assert ("enable", "A") not in kinds(result)
    assert client.campaigns["A"].status == PAUSED


def test_rebalances_daily_budget():
    cfg = make_config([campaign("A")])
    client = FakeAdsClient([snap("A", daily_budget=500)])
    run_guard(cfg, client, GuardState(), date(2026, 10, 1))
    assert client.campaigns["A"].daily_budget == 100.0


def test_small_budget_change_is_ignored():
    cfg = make_config([campaign("A")])
    client = FakeAdsClient([snap("A", daily_budget=98)])
    result = run_guard(cfg, client, GuardState(), date(2026, 10, 1))
    assert not result.actions


def test_dry_run_changes_nothing():
    cfg = make_config([campaign("A")])
    client = FakeAdsClient([snap("A", cost_month=5000)])
    result = run_guard(cfg, client, GuardState(), date(2026, 10, 10), dry_run=True)
    assert ("pause", "A") in kinds(result)
    assert client.calls == []


def test_released_but_still_blocked_stays_tracked():
    cfg = make_config([campaign("A", stop_rules={"max_daily_spend": 40})])
    client = FakeAdsClient([snap("A", daily_budget=40, cost_today=45, cost_month=3100)])
    state = GuardState()
    run_guard(cfg, client, state, date(2026, 10, 10))
    client.campaigns["A"].cost_today = 0
    run_guard(cfg, client, state, date(2026, 10, 11))  # diário expirou, mas o mês estourou
    assert client.campaigns["A"].status == PAUSED
    assert state.paused["A"]["reason"] == ACCOUNT_LIMIT

    for s in client.campaigns.values():
        s.cost_month = 0
    run_guard(cfg, client, state, date(2026, 11, 1))
    assert client.campaigns["A"].status == ENABLED


def test_failure_on_one_campaign_does_not_stop_others():
    class Flaky(FakeAdsClient):
        def set_status(self, s, status):
            if s.name == "A":
                raise RuntimeError("erro da API")
            super().set_status(s, status)

    cfg = make_config([campaign("A"), campaign("B")])
    client = Flaky([snap("A", cost_month=2000), snap("B", cost_month=2000)])
    result = run_guard(cfg, client, GuardState(), date(2026, 10, 10))
    assert [a.campaign for a in result.errors] == ["A"]
    assert client.campaigns["B"].status == PAUSED


def test_state_persists(tmp_path):
    cfg = make_config([campaign("A")])
    client = FakeAdsClient([snap("A", cost_month=5000)])
    path = str(tmp_path / "state.json")
    run_guard(cfg, client, GuardState.load(path), date(2026, 10, 10))
    assert GuardState.load(path).paused["A"]["reason"] == ACCOUNT_LIMIT
