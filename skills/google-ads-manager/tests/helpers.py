import copy

from gads_tool.config import parse_config

AD = {
    "final_url": "https://exemplo.com.br",
    "headlines": ["Título Um", "Título Dois", "Título Três"],
    "descriptions": ["Descrição um.", "Descrição dois."],
}


def campaign(name, **extra):
    data = {"name": name, "ad_groups": [{"name": "G", "keywords": ["[palavra]"], "ads": [copy.deepcopy(AD)]}]}
    data.update(extra)
    return data


def make_config(campaigns=None, **budget):
    raw = {
        "account": {"customer_id": "123-456-7890"},
        "budget": {"monthly_limit": 3100, "safety_margin": 0, "min_daily": 1, **budget},
        "campaigns": campaigns or [campaign("A", weight=1)],
    }
    return parse_config(raw)
