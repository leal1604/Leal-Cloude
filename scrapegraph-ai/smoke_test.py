"""Verify the local scrapegraphai install: import, browser launch, real fetch.

    .venv/bin/python scrapegraph-ai/smoke_test.py [url]

No LLM key is needed — this exercises the fetch half of the pipeline only.
Hosts outside this session's egress policy fail with ERR_TUNNEL_CONNECTION_FAILED.
"""

import os
import sys
import importlib.metadata as md

# Chromium shipped with the sandbox; a locally installed browser is used when absent.
CHROMIUM = "/opt/pw-browsers/chromium"

DEFAULT_URL = "https://pypi.org/project/scrapegraphai/"


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL

    from scrapegraphai.docloaders import ChromiumLoader
    from scrapegraphai.graphs import SmartScraperGraph

    print(f"scrapegraphai {md.version('scrapegraphai')}")
    print(f"playwright    {md.version('playwright')}")
    print(f"graphs        {SmartScraperGraph.__name__} importable")

    loader_kwargs = {"args": ["--no-sandbox"]}
    if os.path.exists(CHROMIUM):
        loader_kwargs["executable_path"] = CHROMIUM

    docs = ChromiumLoader([url], backend="playwright", headless=True, **loader_kwargs).load()
    print(f"fetched       {url} -> {len(docs[0].page_content)} chars")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
