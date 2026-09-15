# Scrapegraph-ai

Local install of [Scrapegraph-ai](https://github.com/ScrapeGraphAI/Scrapegraph-ai) —
a web scraping library that builds LLM + graph-logic scraping pipelines on top of LangChain.

## Install

```bash
./scrapegraph-ai/install.sh
```

Creates `.venv/` at the repository root (gitignored) with `scrapegraphai` and its
dependencies pinned by `requirements.lock.txt`. Pass `--latest` to resolve the newest
release instead of the pinned set.

`scrapegraphai` requires **Python >= 3.12**; the script provisions it through `uv`
(the system interpreter here is 3.11).

Verify:

```bash
.venv/bin/python scrapegraph-ai/smoke_test.py
```

## Browsers

Page fetching goes through Playwright. This sandbox already ships Chromium at
`/opt/pw-browsers/chromium` (build 1194), but `playwright==1.63.0` expects build 1243,
so a plain `chromium.launch()` fails looking for the newer binary. Point it at the
bundled one rather than downloading:

```python
loader_kwargs = {"executable_path": "/opt/pw-browsers/chromium", "args": ["--no-sandbox"]}
```

`ChromiumLoader` forwards any extra keyword argument straight to
`playwright.chromium.launch()`, and graphs accept the same dict as `loader_kwargs`.

Outside this sandbox, run `.venv/bin/playwright install chromium` once and drop
`executable_path`.

## Usage

```python
from scrapegraphai.graphs import SmartScraperGraph

graph_config = {
    "llm": {"api_key": "<OPENAI_API_KEY>", "model": "openai/gpt-4o-mini"},
    "verbose": True,
    "headless": True,
    "loader_kwargs": {
        "executable_path": "/opt/pw-browsers/chromium",
        "args": ["--no-sandbox"],
    },
}

result = SmartScraperGraph(
    prompt="List every project title and its description",
    source="https://example.org/projects",
    config=graph_config,
).run()
```

Other pipelines: `SearchGraph` (multi-page search), `SmartScraperMultiGraph`,
`ScriptCreatorGraph`, `SpeechGraph`. Providers other than OpenAI (Ollama, Mistral,
AWS Bedrock) are installed as well — see the
[docs](https://docs.scrapegraphai.com/introduction).

## Network

Outbound traffic goes through this session's egress proxy, so a graph can only reach
hosts that policy allows; anything else fails with `ERR_TUNNEL_CONNECTION_FAILED`
(`https://example.com` and `https://github.com` are blocked here, `https://pypi.org`
is not). Running an LLM-backed graph additionally needs a provider key in the
environment — none is configured in this session.
