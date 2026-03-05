"""Shared utilities for sonarqube-claude-code-plugin hook scripts."""

import json
import os
from datetime import datetime


def timestamp():
    """Return current local time as YYYY-MM-DD HH:MM:SS."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log_csv(log_path, header, row):
    """Append a CSV row to log_path, writing the header first if the file is new."""
    log_dir = os.path.dirname(log_path)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)
    write_header = not os.path.isfile(log_path)
    with open(log_path, "a") as f:
        if write_header:
            f.write(header + "\n")
        f.write(row + "\n")


def continue_with_comment(comment):
    """Output a JSON continuation message that Claude Code passes through to the model."""
    print(json.dumps({"reason": comment}))
