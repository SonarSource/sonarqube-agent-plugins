#!/bin/bash
# Wrapper script to start MCP server with environment variables loaded from .env

# Get the plugin directory - handle multiple cases
if [ -n "$CLAUDE_PLUGIN_ROOT" ]; then
    PLUGIN_DIR="$CLAUDE_PLUGIN_ROOT"
elif [ -f "$(dirname "$0")/../.env" ]; then
    PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
else
    # Fall back to searching for .env file
    PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
fi

ENV_FILE="$PLUGIN_DIR/.env"

# Load environment variables from .env file if it exists
if [ -f "$ENV_FILE" ]; then
    # Use set -a to automatically export all variables
    set -a
    source "$ENV_FILE"
    set +a
fi

# Start the Docker container with environment variables
exec docker run -i --rm \
    -e "SONARQUBE_TOKEN=${SONARQUBE_TOKEN}" \
    -e "SONARQUBE_URL=${SONARQUBE_URL}" \
    -e "SONARQUBE_ORG=${SONARQUBE_ORG}" \
    mcp/sonarqube
