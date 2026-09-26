"""Carrega e valida o arquivo YAML de campanhas.

Todas as regras de formato do Google Ads que conseguimos checar offline
(tamanho de títulos, quantidade de descrições, tipos de correspondência etc.)
são verificadas aqui, antes de qualquer chamada à API.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

import yaml

HEADLINE_MAX = 30
DESCRIPTION_MAX = 90
PATH_MAX = 15
KEYWORD_MAX_CHARS = 80
KEYWORD_MAX_WORDS = 10
MATCH_TYPES = ("EXACT", "PHRASE", "BROAD")
BIDDING_STRATEGIES = ("MANUAL_CPC", "MAXIMIZE_CLICKS", "MAXIMIZE_CONVERSIONS")
BUDGET_SCOPES = ("account", "managed")


class ConfigError(Exception):
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("\n".join(errors))


@dataclass
class Keyword:
    text: str
    match: str = "PHRASE"


@dataclass
class Ad:
    final_url: str
    headlines: list[str]
    descriptions: list[str]
    path1: str = ""
    path2: str = ""


@dataclass
class AdGroup:
    name: str
    keywords: list[Keyword]
    ads: list[Ad]
    default_cpc: float | None = None


@dataclass
class Bidding:
    strategy: str = "MAXIMIZE_CLICKS"
    max_cpc: float | None = None
    target_cpa: float | None = None


@dataclass
class StopRules:
    # Pausa se o custo por conversão do mês passar deste valor...
    max_cpa: float | None = None
    # ...desde que a campanha já tenha gastado pelo menos isto no mês.
    min_spend_for_cpa: float = 0.0
    # Pausa se gastar isto no mês sem nenhuma conversão.
    pause_if_no_conversions_after: float | None = None
    # Pausa até o dia seguinte se o gasto de hoje passar deste valor.
    max_daily_spend: float | None = None


@dataclass
class CampaignConfig:
    name: str
    ad_groups: list[AdGroup]
    weight: float = 1.0
    max_monthly: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    bidding: Bidding = field(default_factory=Bidding)
    locations: list[int] = field(default_factory=lambda: [2076])  # Brasil
    languages: list[int] = field(default_factory=lambda: [1014])  # Português
    negative_keywords: list[Keyword] = field(default_factory=list)
    stop_rules: StopRules = field(default_factory=StopRules)

    def is_active_on(self, day: date) -> bool:
        if self.start_date and day < self.start_date:
            return False
        if self.end_date and day > self.end_date:
            return False
        return True


@dataclass
class BudgetConfig:
    monthly_limit: float
    # Parte do limite que fica de reserva para cobrir atraso dos dados do
    # Google (até ~3h) e o excesso diário permitido pela plataforma.
    safety_margin: float = 0.10
    # Fração do limite utilizável em que TODAS as campanhas são pausadas.
    pause_at: float = 0.98
    # O Google pode gastar até 2x o orçamento diário em um único dia.
    overspend_factor: float = 2.0
    min_daily: float = 5.0
    # Só altera o orçamento diário se a diferença passar desta fração.
    rebalance_threshold: float = 0.05
    auto_resume_next_month: bool = True
    # "account": o limite considera o gasto de TODAS as campanhas da conta.
    # "managed": considera só as campanhas deste arquivo.
    scope: str = "account"
    # Com o limite da conta atingido, pausa também campanhas fora deste arquivo.
    pause_unmanaged: bool = False

    @property
    def usable(self) -> float:
        return self.monthly_limit * (1 - self.safety_margin)

    @property
    def hard_stop(self) -> float:
        return self.usable * self.pause_at


@dataclass
class AccountConfig:
    customer_id: str
    currency: str = "BRL"
    timezone: str = "America/Sao_Paulo"
    login_customer_id: str | None = None


@dataclass
class Config:
    account: AccountConfig
    budget: BudgetConfig
    campaigns: list[CampaignConfig]

    def campaign(self, name: str) -> CampaignConfig | None:
        return next((c for c in self.campaigns if c.name == name), None)


def load_config(path: str) -> Config:
    with open(path, encoding="utf-8") as fh:
        raw = yaml.safe_load(fh) or {}
    return parse_config(raw)


def parse_config(raw: dict[str, Any]) -> Config:
    errors: list[str] = []
    account = _parse_account(raw.get("account") or {}, errors)
    budget = _parse_budget(raw.get("budget") or {}, errors)
    campaigns = [
        _parse_campaign(c, i, errors) for i, c in enumerate(raw.get("campaigns") or [])
    ]
    if not campaigns:
        errors.append("campaigns: defina pelo menos uma campanha")
    names = [c.name for c in campaigns]
    for dup in sorted({n for n in names if names.count(n) > 1}):
        errors.append(f"campaigns: nome duplicado '{dup}'")
    for c in campaigns:
        if c.max_monthly is not None and budget.monthly_limit and c.max_monthly > budget.monthly_limit:
            errors.append(
                f"campanha '{c.name}': max_monthly ({c.max_monthly}) maior que "
                f"budget.monthly_limit ({budget.monthly_limit})"
            )
    if errors:
        raise ConfigError(errors)
    return Config(account=account, budget=budget, campaigns=campaigns)


def normalize_customer_id(value: Any) -> str:
    return re.sub(r"\D", "", str(value or ""))


def parse_keyword(value: Any) -> Keyword:
    """Aceita `{text, match}` ou atalhos: `[exata]`, `"frase"`, `ampla`."""
    if isinstance(value, dict):
        return Keyword(text=str(value.get("text", "")).strip(), match=str(value.get("match", "PHRASE")).upper())
    text = str(value).strip()
    if text.startswith("[") and text.endswith("]"):
        return Keyword(text=text[1:-1].strip(), match="EXACT")
    if len(text) >= 2 and text[0] == text[-1] == '"':
        return Keyword(text=text[1:-1].strip(), match="PHRASE")
    return Keyword(text=text, match="BROAD")


def _parse_account(raw: dict, errors: list[str]) -> AccountConfig:
    cid = normalize_customer_id(raw.get("customer_id"))
    if len(cid) != 10:
        errors.append("account.customer_id: informe o ID de 10 dígitos da conta (ex.: 123-456-7890)")
    login = normalize_customer_id(raw.get("login_customer_id")) or None
    return AccountConfig(
        customer_id=cid,
        currency=str(raw.get("currency", "BRL")).upper(),
        timezone=str(raw.get("timezone", "America/Sao_Paulo")),
        login_customer_id=login,
    )


def _parse_budget(raw: dict, errors: list[str]) -> BudgetConfig:
    limit = _num(raw.get("monthly_limit"), "budget.monthly_limit", errors, required=True) or 0.0
    b = BudgetConfig(monthly_limit=limit)
    for key in ("safety_margin", "pause_at", "overspend_factor", "min_daily", "rebalance_threshold"):
        if key in raw:
            setattr(b, key, _num(raw[key], f"budget.{key}", errors) or 0.0)
    b.auto_resume_next_month = bool(raw.get("auto_resume_next_month", b.auto_resume_next_month))
    b.pause_unmanaged = bool(raw.get("pause_unmanaged", b.pause_unmanaged))
    b.scope = str(raw.get("scope", b.scope))
    if limit <= 0:
        errors.append("budget.monthly_limit: deve ser maior que zero")
    if not 0 <= b.safety_margin < 1:
        errors.append("budget.safety_margin: use um valor entre 0 e 1 (ex.: 0.10 = 10%)")
    if not 0 < b.pause_at <= 1:
        errors.append("budget.pause_at: use um valor entre 0 e 1 (ex.: 0.98)")
    if b.overspend_factor < 1:
        errors.append("budget.overspend_factor: deve ser >= 1 (o Google usa 2)")
    if b.scope not in BUDGET_SCOPES:
        errors.append(f"budget.scope: use um de {', '.join(BUDGET_SCOPES)}")
    return b


def _parse_campaign(raw: dict, index: int, errors: list[str]) -> CampaignConfig:
    name = str(raw.get("name") or "").strip()
    where = f"campanha '{name}'" if name else f"campaigns[{index}]"
    if not name:
        errors.append(f"{where}: 'name' é obrigatório")

    bidding_raw = raw.get("bidding") or {}
    if isinstance(bidding_raw, str):
        bidding_raw = {"strategy": bidding_raw}
    bidding = Bidding(
        strategy=str(bidding_raw.get("strategy", "MAXIMIZE_CLICKS")).upper(),
        max_cpc=_num(bidding_raw.get("max_cpc"), f"{where}.bidding.max_cpc", errors),
        target_cpa=_num(bidding_raw.get("target_cpa"), f"{where}.bidding.target_cpa", errors),
    )
    if bidding.strategy not in BIDDING_STRATEGIES:
        errors.append(f"{where}: bidding.strategy deve ser um de {', '.join(BIDDING_STRATEGIES)}")

    rules_raw = raw.get("stop_rules") or {}
    rules = StopRules(
        max_cpa=_num(rules_raw.get("max_cpa"), f"{where}.stop_rules.max_cpa", errors),
        min_spend_for_cpa=_num(rules_raw.get("min_spend_for_cpa"), f"{where}.stop_rules.min_spend_for_cpa", errors) or 0.0,
        pause_if_no_conversions_after=_num(
            rules_raw.get("pause_if_no_conversions_after"), f"{where}.stop_rules.pause_if_no_conversions_after", errors
        ),
        max_daily_spend=_num(rules_raw.get("max_daily_spend"), f"{where}.stop_rules.max_daily_spend", errors),
    )

    camp = CampaignConfig(
        name=name,
        ad_groups=[_parse_ad_group(g, where, bidding, errors) for g in raw.get("ad_groups") or []],
        weight=_num(raw.get("weight", 1), f"{where}.weight", errors) or 0.0,
        max_monthly=_num(raw.get("max_monthly"), f"{where}.max_monthly", errors),
        start_date=_date(raw.get("start_date"), f"{where}.start_date", errors),
        end_date=_date(raw.get("end_date"), f"{where}.end_date", errors),
        bidding=bidding,
        locations=[int(x) for x in raw.get("locations") or [2076]],
        languages=[int(x) for x in raw.get("languages") or [1014]],
        negative_keywords=[parse_keyword(k) for k in raw.get("negative_keywords") or []],
        stop_rules=rules,
    )
    if camp.weight <= 0:
        errors.append(f"{where}: weight deve ser maior que zero")
    if not camp.ad_groups:
        errors.append(f"{where}: defina pelo menos um grupo de anúncios em ad_groups")
    if camp.start_date and camp.end_date and camp.end_date < camp.start_date:
        errors.append(f"{where}: end_date é anterior a start_date")
    for kw in camp.negative_keywords:
        _check_keyword(kw, f"{where}.negative_keywords", errors)
    return camp


def _parse_ad_group(raw: dict, where: str, bidding: Bidding, errors: list[str]) -> AdGroup:
    name = str(raw.get("name") or "").strip()
    gwhere = f"{where} > grupo '{name or '?'}'"
    if not name:
        errors.append(f"{gwhere}: 'name' é obrigatório")
    group = AdGroup(
        name=name,
        keywords=[parse_keyword(k) for k in raw.get("keywords") or []],
        ads=[_parse_ad(a, gwhere, errors) for a in raw.get("ads") or []],
        default_cpc=_num(raw.get("default_cpc"), f"{gwhere}.default_cpc", errors),
    )
    if not group.keywords:
        errors.append(f"{gwhere}: defina pelo menos uma palavra-chave")
    if not group.ads:
        errors.append(f"{gwhere}: defina pelo menos um anúncio")
    if bidding.strategy == "MANUAL_CPC" and not group.default_cpc:
        errors.append(f"{gwhere}: com MANUAL_CPC, informe default_cpc (lance por clique)")
    for kw in group.keywords:
        _check_keyword(kw, gwhere, errors)
    return group


def _parse_ad(raw: dict, where: str, errors: list[str]) -> Ad:
    ad = Ad(
        final_url=str(raw.get("final_url") or "").strip(),
        headlines=[str(h).strip() for h in raw.get("headlines") or []],
        descriptions=[str(d).strip() for d in raw.get("descriptions") or []],
        path1=str(raw.get("path1") or "").strip(),
        path2=str(raw.get("path2") or "").strip(),
    )
    if not re.match(r"^https?://", ad.final_url):
        errors.append(f"{where}: final_url deve começar com http:// ou https://")
    if not 3 <= len(ad.headlines) <= 15:
        errors.append(f"{where}: anúncio responsivo precisa de 3 a 15 títulos (tem {len(ad.headlines)})")
    if not 2 <= len(ad.descriptions) <= 4:
        errors.append(f"{where}: anúncio responsivo precisa de 2 a 4 descrições (tem {len(ad.descriptions)})")
    _check_texts(ad.headlines, HEADLINE_MAX, "título", where, errors)
    _check_texts(ad.descriptions, DESCRIPTION_MAX, "descrição", where, errors)
    for label, value in (("path1", ad.path1), ("path2", ad.path2)):
        if len(value) > PATH_MAX:
            errors.append(f"{where}: {label} '{value}' tem {len(value)} caracteres (máx. {PATH_MAX})")
    if ad.path2 and not ad.path1:
        errors.append(f"{where}: path2 exige path1")
    return ad


def _check_texts(texts: list[str], limit: int, label: str, where: str, errors: list[str]) -> None:
    seen: set[str] = set()
    for t in texts:
        if not t:
            errors.append(f"{where}: {label} vazio")
        elif len(t) > limit:
            errors.append(f"{where}: {label} '{t}' tem {len(t)} caracteres (máx. {limit})")
        if t.lower() in seen:
            errors.append(f"{where}: {label} repetido '{t}'")
        seen.add(t.lower())


def _check_keyword(kw: Keyword, where: str, errors: list[str]) -> None:
    if kw.match not in MATCH_TYPES:
        errors.append(f"{where}: palavra-chave '{kw.text}' com match inválido '{kw.match}'")
    if not kw.text:
        errors.append(f"{where}: palavra-chave vazia")
    elif len(kw.text) > KEYWORD_MAX_CHARS or len(kw.text.split()) > KEYWORD_MAX_WORDS:
        errors.append(
            f"{where}: palavra-chave '{kw.text}' excede {KEYWORD_MAX_CHARS} caracteres ou {KEYWORD_MAX_WORDS} palavras"
        )


def _num(value: Any, where: str, errors: list[str], required: bool = False) -> float | None:
    if value is None or value == "":
        if required:
            errors.append(f"{where}: obrigatório")
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        errors.append(f"{where}: '{value}' não é um número")
        return None


def _date(value: Any, where: str, errors: list[str]) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        errors.append(f"{where}: data inválida '{value}' (use AAAA-MM-DD)")
        return None
