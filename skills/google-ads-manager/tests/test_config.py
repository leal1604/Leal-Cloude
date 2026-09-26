import pytest

from gads_tool.config import ConfigError, parse_keyword
from helpers import AD, campaign, make_config


def test_keyword_shorthands():
    assert (parse_keyword("[a b]").text, parse_keyword("[a b]").match) == ("a b", "EXACT")
    assert parse_keyword('"a b"').match == "PHRASE"
    assert parse_keyword("a b").match == "BROAD"
    assert parse_keyword({"text": "x", "match": "exact"}).match == "EXACT"


def test_example_file_is_valid():
    import os

    from gads_tool.config import load_config

    here = os.path.dirname(__file__)
    cfg = load_config(os.path.join(here, "..", "examples", "campaigns.example.yaml"))
    assert len(cfg.campaigns) == 2
    assert cfg.account.customer_id == "1234567890"


def test_rejects_long_headline_and_few_descriptions():
    bad_ad = dict(AD, headlines=["x" * 31, "b", "c"], descriptions=["só uma"])
    camp = campaign("A")
    camp["ad_groups"][0]["ads"] = [bad_ad]
    with pytest.raises(ConfigError) as exc:
        make_config([camp])
    text = "\n".join(exc.value.errors)
    assert "31 caracteres" in text
    assert "2 a 4 descrições" in text


def test_rejects_duplicate_names_and_manual_cpc_without_bid():
    with pytest.raises(ConfigError) as exc:
        make_config([campaign("A"), campaign("A", bidding="MANUAL_CPC")])
    text = "\n".join(exc.value.errors)
    assert "duplicado" in text
    assert "default_cpc" in text


def test_campaign_cap_cannot_exceed_monthly_limit():
    with pytest.raises(ConfigError):
        make_config([campaign("A", max_monthly=5000)])
