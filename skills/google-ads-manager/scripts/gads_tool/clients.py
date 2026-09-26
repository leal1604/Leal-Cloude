"""Acesso ao Google Ads.

`GoogleAdsApiClient` fala com a API real (biblioteca oficial `google-ads`).
`FakeAdsClient` mantém tudo em memória e serve para simulação (`--offline`)
e testes; os dois têm a mesma interface.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime

from .config import CampaignConfig, Keyword

ENABLED = "ENABLED"
PAUSED = "PAUSED"


@dataclass
class CampaignSnapshot:
    name: str
    status: str
    resource_name: str = ""
    budget_resource: str = ""
    daily_budget: float = 0.0
    budget_shared: bool = False
    cost_month: float = 0.0
    cost_today: float = 0.0
    conversions_month: float = 0.0
    clicks_month: int = 0


@dataclass
class AccountInfo:
    currency: str
    timezone: str
    name: str = ""


def to_micros(amount: float) -> int:
    # Valores monetários precisam ser múltiplos de 10.000 micros (1 centavo).
    return round(amount * 100) * 10_000


def from_micros(micros: int) -> float:
    return round(micros / 1_000_000, 2)


class FakeAdsClient:
    def __init__(self, campaigns: list[CampaignSnapshot] | None = None, account: AccountInfo | None = None):
        self.campaigns = {c.name: c for c in campaigns or []}
        self.account = account or AccountInfo(currency="BRL", timezone="America/Sao_Paulo")
        self.calls: list[tuple] = []

    @classmethod
    def from_json(cls, path: str) -> FakeAdsClient:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        account = AccountInfo(**data["account"]) if "account" in data else None
        return cls([CampaignSnapshot(**c) for c in data.get("campaigns", [])], account)

    def dump(self) -> dict:
        return {"account": asdict(self.account), "campaigns": [asdict(c) for c in self.campaigns.values()]}

    def account_info(self) -> AccountInfo:
        return self.account

    def list_campaigns(self) -> list[CampaignSnapshot]:
        return list(self.campaigns.values())

    def set_status(self, snap: CampaignSnapshot, status: str) -> None:
        self.calls.append(("set_status", snap.name, status))
        self.campaigns[snap.name].status = status

    def set_daily_budget(self, snap: CampaignSnapshot, amount: float) -> None:
        self.calls.append(("set_daily_budget", snap.name, amount))
        self.campaigns[snap.name].daily_budget = amount

    def create_campaign(self, camp: CampaignConfig, daily_budget: float, status: str, validate_only: bool = False) -> str:
        self.calls.append(("create_campaign", camp.name, daily_budget, status, validate_only))
        rn = f"customers/0/campaigns/{len(self.campaigns) + 1}"
        if not validate_only:
            self.campaigns[camp.name] = CampaignSnapshot(
                name=camp.name,
                status=status,
                resource_name=rn,
                budget_resource=f"customers/0/campaignBudgets/{len(self.campaigns) + 1}",
                daily_budget=daily_budget,
            )
        return rn


class GoogleAdsApiClient:
    def __init__(self, customer_id: str, credentials_path: str | None = None, login_customer_id: str | None = None):
        try:
            from google.ads.googleads.client import GoogleAdsClient
        except ImportError as exc:  # pragma: no cover - depende do ambiente
            raise SystemExit(
                "Biblioteca 'google-ads' não instalada. Rode: pip install -r requirements.txt"
            ) from exc

        path = credentials_path or os.environ.get("GOOGLE_ADS_CONFIGURATION_FILE_PATH")
        if path:
            client = GoogleAdsClient.load_from_storage(path=path)
        elif os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN"):
            client = GoogleAdsClient.load_from_env()
        else:
            client = GoogleAdsClient.load_from_storage()  # ~/google-ads.yaml
        if not getattr(client, "use_proto_plus", True):
            raise SystemExit("Defina use_proto_plus: True nas credenciais (GOOGLE_ADS_USE_PROTO_PLUS=True).")
        if login_customer_id:
            client.login_customer_id = login_customer_id
        self.client = client
        self.customer_id = customer_id

    # ---------- leitura ----------

    def _search(self, query: str):
        service = self.client.get_service("GoogleAdsService")
        return service.search(customer_id=self.customer_id, query=query)

    def account_info(self) -> AccountInfo:
        for row in self._search(
            "SELECT customer.currency_code, customer.time_zone, customer.descriptive_name FROM customer"
        ):
            c = row.customer
            return AccountInfo(currency=c.currency_code, timezone=c.time_zone, name=c.descriptive_name)
        raise RuntimeError("Não foi possível ler os dados da conta")

    def list_campaigns(self) -> list[CampaignSnapshot]:
        snaps: dict[int, CampaignSnapshot] = {}
        for row in self._search(
            "SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name, "
            "campaign_budget.resource_name, campaign_budget.amount_micros, "
            "campaign_budget.explicitly_shared "
            "FROM campaign WHERE campaign.status != 'REMOVED'"
        ):
            snaps[row.campaign.id] = CampaignSnapshot(
                name=row.campaign.name,
                status=row.campaign.status.name,
                resource_name=row.campaign.resource_name,
                budget_resource=row.campaign_budget.resource_name,
                daily_budget=from_micros(row.campaign_budget.amount_micros),
                budget_shared=bool(row.campaign_budget.explicitly_shared),
            )
        # Sem selecionar segments.date, as métricas vêm somadas no período.
        for period, attr in (("THIS_MONTH", "month"), ("TODAY", "today")):
            for row in self._search(
                "SELECT campaign.id, metrics.cost_micros, metrics.conversions, metrics.clicks "
                f"FROM campaign WHERE segments.date DURING {period} AND campaign.status != 'REMOVED'"
            ):
                snap = snaps.get(row.campaign.id)
                if snap is None:
                    continue
                if attr == "month":
                    snap.cost_month = from_micros(row.metrics.cost_micros)
                    snap.conversions_month = float(row.metrics.conversions)
                    snap.clicks_month = int(row.metrics.clicks)
                else:
                    snap.cost_today = from_micros(row.metrics.cost_micros)
        return list(snaps.values())

    # ---------- escrita ----------

    def _field_mask(self, message):
        from google.api_core import protobuf_helpers

        return protobuf_helpers.field_mask(None, message._pb)

    def set_status(self, snap: CampaignSnapshot, status: str) -> None:
        op = self.client.get_type("CampaignOperation")
        campaign = op.update
        campaign.resource_name = snap.resource_name
        campaign.status = getattr(self.client.enums.CampaignStatusEnum, status)
        self.client.copy_from(op.update_mask, self._field_mask(campaign))
        self.client.get_service("CampaignService").mutate_campaigns(customer_id=self.customer_id, operations=[op])

    def set_daily_budget(self, snap: CampaignSnapshot, amount: float) -> None:
        op = self.client.get_type("CampaignBudgetOperation")
        budget = op.update
        budget.resource_name = snap.budget_resource
        budget.amount_micros = to_micros(amount)
        self.client.copy_from(op.update_mask, self._field_mask(budget))
        self.client.get_service("CampaignBudgetService").mutate_campaign_budgets(
            customer_id=self.customer_id, operations=[op]
        )

    def create_campaign(self, camp: CampaignConfig, daily_budget: float, status: str, validate_only: bool = False) -> str:
        """Cria orçamento, campanha, segmentação, grupos, palavras-chave e
        anúncios numa única requisição atômica: ou tudo é criado, ou nada."""
        request = self.client.get_type("MutateGoogleAdsRequest")
        request.customer_id = self.customer_id
        request.validate_only = validate_only
        request.mutate_operations.extend(self.build_campaign_operations(camp, daily_budget, status))
        response = self.client.get_service("GoogleAdsService").mutate(request=request)
        for result in response.mutate_operation_responses:
            if result.campaign_result.resource_name:
                return result.campaign_result.resource_name
        return ""

    def build_campaign_operations(self, camp: CampaignConfig, daily_budget: float, status: str) -> list:
        client, cid = self.client, self.customer_id
        enums = client.enums
        ops: list = []
        temp_id = iter(range(-1, -100_000, -1))

        def new_op():
            op = client.get_type("MutateOperation")
            ops.append(op)
            return op

        budget_rn = f"customers/{cid}/campaignBudgets/{next(temp_id)}"
        budget = new_op().campaign_budget_operation.create
        budget.resource_name = budget_rn
        budget.name = f"{camp.name} | orçamento {datetime.now():%Y%m%d%H%M%S}"
        budget.amount_micros = to_micros(daily_budget)
        budget.delivery_method = enums.BudgetDeliveryMethodEnum.STANDARD
        budget.explicitly_shared = False

        campaign_rn = f"customers/{cid}/campaigns/{next(temp_id)}"
        campaign = new_op().campaign_operation.create
        campaign.resource_name = campaign_rn
        campaign.name = camp.name
        campaign.status = getattr(enums.CampaignStatusEnum, status)
        campaign.advertising_channel_type = enums.AdvertisingChannelTypeEnum.SEARCH
        campaign.campaign_budget = budget_rn
        campaign.contains_eu_political_advertising = (
            enums.EuPoliticalAdvertisingStatusEnum.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING
        )
        campaign.network_settings.target_google_search = True
        campaign.network_settings.target_search_network = False
        campaign.network_settings.target_partner_search_network = False
        campaign.network_settings.target_content_network = False
        if camp.start_date:
            campaign.start_date_time = f"{camp.start_date:%Y-%m-%d} 00:00:00"
        if camp.end_date:
            campaign.end_date_time = f"{camp.end_date:%Y-%m-%d} 23:59:59"
        strategy = camp.bidding.strategy
        if strategy == "MANUAL_CPC":
            campaign.manual_cpc = client.get_type("ManualCpc")
        elif strategy == "MAXIMIZE_CONVERSIONS":
            campaign.maximize_conversions = client.get_type("MaximizeConversions")
            if camp.bidding.target_cpa:
                campaign.maximize_conversions.target_cpa_micros = to_micros(camp.bidding.target_cpa)
        else:  # MAXIMIZE_CLICKS
            campaign.target_spend = client.get_type("TargetSpend")
            if camp.bidding.max_cpc:
                campaign.target_spend.cpc_bid_ceiling_micros = to_micros(camp.bidding.max_cpc)

        for geo in camp.locations:
            crit = new_op().campaign_criterion_operation.create
            crit.campaign = campaign_rn
            crit.location.geo_target_constant = f"geoTargetConstants/{geo}"
        for lang in camp.languages:
            crit = new_op().campaign_criterion_operation.create
            crit.campaign = campaign_rn
            crit.language.language_constant = f"languageConstants/{lang}"
        for kw in camp.negative_keywords:
            crit = new_op().campaign_criterion_operation.create
            crit.campaign = campaign_rn
            crit.negative = True
            self._fill_keyword(crit.keyword, kw)

        for group in camp.ad_groups:
            group_rn = f"customers/{cid}/adGroups/{next(temp_id)}"
            ad_group = new_op().ad_group_operation.create
            ad_group.resource_name = group_rn
            ad_group.name = group.name
            ad_group.campaign = campaign_rn
            ad_group.status = enums.AdGroupStatusEnum.ENABLED
            ad_group.type_ = enums.AdGroupTypeEnum.SEARCH_STANDARD
            if group.default_cpc:
                ad_group.cpc_bid_micros = to_micros(group.default_cpc)

            for kw in group.keywords:
                crit = new_op().ad_group_criterion_operation.create
                crit.ad_group = group_rn
                crit.status = enums.AdGroupCriterionStatusEnum.ENABLED
                self._fill_keyword(crit.keyword, kw)

            for ad in group.ads:
                ad_group_ad = new_op().ad_group_ad_operation.create
                ad_group_ad.ad_group = group_rn
                ad_group_ad.status = enums.AdGroupAdStatusEnum.ENABLED
                ad_group_ad.ad.final_urls.append(ad.final_url)
                rsa = ad_group_ad.ad.responsive_search_ad
                rsa.headlines.extend(self._text_assets(ad.headlines))
                rsa.descriptions.extend(self._text_assets(ad.descriptions))
                if ad.path1:
                    rsa.path1 = ad.path1
                if ad.path2:
                    rsa.path2 = ad.path2
        return ops

    def _fill_keyword(self, keyword_info, kw: Keyword) -> None:
        keyword_info.text = kw.text
        keyword_info.match_type = getattr(self.client.enums.KeywordMatchTypeEnum, kw.match)

    def _text_assets(self, texts: list[str]) -> list:
        assets = []
        for text in texts:
            asset = self.client.get_type("AdTextAsset")
            asset.text = text
            assets.append(asset)
        return assets
