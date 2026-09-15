#!/usr/bin/env bash
# Install Scrapegraph-ai (https://github.com/ScrapeGraphAI/Scrapegraph-ai)
# into a local virtualenv at the repository root.
#
#   ./scrapegraph-ai/install.sh              # pinned versions (requirements.lock.txt)
#   ./scrapegraph-ai/install.sh --latest     # resolve the newest release instead
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="$REPO_ROOT/.venv"
LOCK="$REPO_ROOT/scrapegraph-ai/requirements.lock.txt"

# scrapegraphai requires Python >= 3.12.
if command -v uv >/dev/null 2>&1; then
  uv python install 3.12
  uv venv --python 3.12 "$VENV"
  if [ "${1:-}" = "--latest" ]; then
    uv pip install --python "$VENV/bin/python" scrapegraphai
  else
    uv pip install --python "$VENV/bin/python" -r "$LOCK"
  fi
else
  python3.12 -m venv "$VENV"
  if [ "${1:-}" = "--latest" ]; then
    "$VENV/bin/pip" install scrapegraphai
  else
    "$VENV/bin/pip" install -r "$LOCK"
  fi
fi

echo
"$VENV/bin/python" - <<'PY'
import importlib.metadata as md
from scrapegraphai.graphs import SmartScraperGraph
print("scrapegraphai", md.version("scrapegraphai"), "installed;", SmartScraperGraph.__name__, "importable")
PY

cat <<'MSG'

Browsers: this sandbox ships Chromium at /opt/pw-browsers/chromium.
Do NOT run `playwright install` here — pass the executable through instead:

    loader_kwargs={"executable_path": "/opt/pw-browsers/chromium",
                   "args": ["--no-sandbox"]}

Outside this sandbox, run `.venv/bin/playwright install chromium` once.
MSG
