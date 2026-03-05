#!/usr/bin/env python3
"""SessionStart hook: report SonarQube plugin prerequisite status."""

import json
import os
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import continue_with_comment


def check_sonar_cli():
    """Return True if the sonarqube-cli (`sonar`) is available in PATH."""
    return shutil.which("sonar") is not None


def check_sonar_integrated():
    """Return True if `sonar integrate claude` has been run successfully."""
    state_path = os.path.expanduser("~/.sonar/sonarqube-cli/state.json")
    try:
        with open(state_path) as f:
            state = json.load(f)
        return state.get("agents", {}).get("claude-code", {}).get("configured", False)
    except Exception:
        return False


def main():
    sonar_ok = check_sonar_cli()
    integrated = check_sonar_integrated()

    lines = ["SonarQube plugin initialised."]

    lines.append("  sonarqube-cli:    " + (
        "✓ found" if sonar_ok
        else "✗ not found — run /sonarqube:configure"
    ))
    lines.append("  Secrets scanning: " + (
        "✓ configured" if integrated
        else "✗ not set up — run /sonarqube:configure"
    ))

    continue_with_comment("\n".join(lines))
    sys.exit(0)


if __name__ == "__main__":
    main()
