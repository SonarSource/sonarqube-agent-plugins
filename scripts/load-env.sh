#!/bin/bash
# Load environment variables from .env file
# This script can be sourced by other scripts or MCP server

PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="$PLUGIN_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    set -a  # automatically export all variables
    source "$ENV_FILE"
    set +a
fi
