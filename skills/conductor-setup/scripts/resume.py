"""Determines the next unblocked setup step in the Conductor workflow.

Backward-compatible forwarder to scripts.conductor_engine.
"""

import json
import os
import sys

# Ensure repository root is on sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from scripts.conductor_engine import determine_resumption


if __name__ == "__main__":
    root_arg = sys.argv[1] if len(sys.argv) > 1 else "."
    result = determine_resumption(root_dir=root_arg)
    print(json.dumps(result, indent=2))
    sys.exit(0)
