#!/usr/bin/env python3
"""Ponto de entrada: python scripts/gads.py --help"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gads_tool.cli import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
