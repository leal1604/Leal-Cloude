"""Confere as operações montadas para a API real (sem rede)."""

from unittest import mock

import pytest

pytest.importorskip("google.ads.googleads")

from google.ads.googleads.client import GoogleAdsClient  # noqa: E402
from google.auth.credentials import AnonymousCredentials  # noqa: E402

from gads_tool.clients import CampaignSnapshot, GoogleAdsApiClient  # noqa: E402
from helpers import campaign, make_config  # noqa: E402


@pytest.fixture
def api():
    obj = GoogleAdsApiClient.__new__(GoogleAdsApiClient)
    obj.client = GoogleAdsClient(credentials=AnonymousCredentials(), developer_token="x", use_proto_plus=True)
    obj.customer_id = "1234567890"
    return obj


def test_campaign_operations(api):
    cfg = make_config([
        campaign("A", start_date="2026-10-01", negative_keywords=["grátis"], bidding={"max_cpc": 2.5})
    ])
    ops = api.build_campaign_operations(cfg.campaigns[0], 12.34, "PAUSED")
    kinds = [op._pb.WhichOneof("operation") for op in ops]
    assert kinds == [
        "campaign_budget_operation",
        "campaign_operation",
        "campaign_criterion_operation",  # local
        "campaign_criterion_operation",  # idioma
        "campaign_criterion_operation",  # negativa
        "ad_group_operation",
        "ad_group_criterion_operation",
        "ad_group_ad_operation",
    ]
    budget = ops[0].campaign_budget_operation.create
    camp = ops[1].campaign_operation.create
    assert budget.amount_micros == 12_340_000
    assert camp.campaign_budget == budget.resource_name
    assert camp.status.name == "PAUSED"
    assert camp._pb.WhichOneof("campaign_bidding_strategy") == "target_spend"
    assert camp.target_spend.cpc_bid_ceiling_micros == 2_500_000
    assert camp.start_date_time == "2026-10-01 00:00:00"
    assert camp.contains_eu_political_advertising.name == "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING"
    assert ops[4].campaign_criterion_operation.create.negative is True
    ad = ops[-1].ad_group_ad_operation.create.ad
    assert [h.text for h in ad.responsive_search_ad.headlines] == ["Título Um", "Título Dois", "Título Três"]


@pytest.mark.parametrize(
    "strategy,oneof", [("MANUAL_CPC", "manual_cpc"), ("MAXIMIZE_CONVERSIONS", "maximize_conversions")]
)
def test_bidding_strategies(api, strategy, oneof):
    camp = campaign("A", bidding=strategy)
    camp["ad_groups"][0]["default_cpc"] = 1.0
    cfg = make_config([camp])
    ops = api.build_campaign_operations(cfg.campaigns[0], 10, "ENABLED")
    assert ops[1].campaign_operation.create._pb.WhichOneof("campaign_bidding_strategy") == oneof


def test_updates_use_field_masks(api):
    service = mock.MagicMock()
    api.client.get_service = lambda name, **kw: service
    s = CampaignSnapshot("A", "ENABLED", "customers/1/campaigns/5", "customers/1/campaignBudgets/7")
    api.set_status(s, "PAUSED")
    op = service.mutate_campaigns.call_args.kwargs["operations"][0]
    assert "status" in op.update_mask.paths
    api.set_daily_budget(s, 33.33)
    op = service.mutate_campaign_budgets.call_args.kwargs["operations"][0]
    assert op.update.amount_micros == 33_330_000
    assert "amount_micros" in op.update_mask.paths
