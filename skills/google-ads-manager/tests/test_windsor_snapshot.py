import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from windsor_snapshot import build  # noqa: E402


def test_build_merges_month_and_today():
    month = [
        {"campaign": "A", "campaign_id": "1", "campaign_status": "ENABLED", "spend": 10.5, "conversions": 1, "clicks": 7},
        {"campaign": "B", "campaign_id": "2", "campaign_status": "PAUSED", "spend": 3, "conversions": 0, "clicks": 2},
    ]
    today = [{"campaign": "A", "campaign_id": "1", "campaign_status": "ENABLED", "budget_amount": 1.45, "spend": 2.1}]
    snap = build(month, today, "EUR", "Europe/Lisbon")
    by_name = {c["name"]: c for c in snap["campaigns"]}
    assert by_name["A"] == {
        "name": "A", "status": "ENABLED", "resource_name": "1", "budget_resource": "1", "daily_budget": 1.45,
        "cost_month": 10.5, "cost_today": 2.1, "conversions_month": 1.0, "clicks_month": 7,
    }
    assert by_name["B"]["cost_today"] == 0.0
    assert snap["account"]["currency"] == "EUR"
