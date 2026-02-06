# MCP Server Configuration

This document explains how the `.mcp.json` configuration works.

## Overview

The `.mcp.json` file configures the Model Context Protocol (MCP) server that provides advanced SonarQube integration features to Claude Code.

## Configuration Structure

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "bash",
      "args": ["scripts/start-mcp-server.sh"]
    }
  }
}
```

**That's it!** Super clean and simple. The wrapper script handles all the complexity.

The MCP server runs from the plugin directory, so `scripts/start-mcp-server.sh` is a relative path that works automatically.

## How It Works

1. **Claude Code starts** the MCP server by running `start-mcp-server.sh`

2. **The wrapper script:**
   - Locates the `.env` file in the plugin directory
   - Loads all environment variables from it
   - Starts the Docker container with those variables

3. **Docker Container:** Receives the credentials and connects to SonarQube

**Key advantage:** No manual shell configuration required! Everything is automatic.

## Where Variables Come From

The wrapper script automatically loads variables from the `.env` file in the plugin directory:

### The .env File (Only thing you need!)
```bash
# In: /path/to/plugin/.env
export SONARQUBE_URL="https://sonarcloud.io"
export SONARQUBE_ORG="my-org"
export SONARQUBE_TOKEN="abc123..."
```

**That's it!** No shell configuration, no system environment setup. Just create this file and restart Claude Code.

## Why This Design?

### ✅ Advantages:
- **Zero Configuration:** Users just create `.env` and restart - no shell editing!
- **Clean & Readable:** `.mcp.json` is ultra-simple
- **Automatic:** Wrapper script handles everything
- **Secure:** No credentials hardcoded, `.env` is git-ignored
- **Version Control Safe:** Only wrapper script is committed, not credentials
- **No Shell Pollution:** Doesn't clutter user's shell environment

### 🎯 Design Principles:
1. **User-Friendly First:** Minimum steps for users
2. **Secure by Default:** Can't accidentally expose credentials
3. **Self-Contained:** Plugin handles its own configuration
4. **Zero Dependencies:** No shell configuration changes needed
5. **Portable:** Works the same on all machines

## Troubleshooting

### MCP Server Can't Connect

**Problem:** `Missing environment variables` error

**Check:**
1. Does `.env` file exist in the plugin directory?
2. Does it have your actual token (not `YOUR_TOKEN_HERE`)?
3. Is the format correct with `export` statements?

**Solution:** 
1. Verify `.env` file exists and has correct format
2. Make sure you replaced `YOUR_TOKEN_HERE` with your actual token
3. Restart Claude Code

### Wrapper Script Not Found

**Problem:** `start-mcp-server.sh: command not found`

**Solution:**
1. Check that `scripts/start-mcp-server.sh` exists
2. Make sure it's executable: `chmod +x scripts/start-mcp-server.sh`
3. Restart Claude Code

## Related Files

- `.env` - Local credentials storage (git-ignored)
- `.env.example` - Template for credentials
- `scripts/setup.sh` - Validates configuration
- `skills/configure/SKILL.md` - Interactive setup guide
- `CONFIGURATION.md` - Complete configuration guide

## Advanced Usage

### Custom Docker Image
To use a different MCP server image, modify the last arg in `.mcp.json`:
```json
"args": [..., "my-registry/custom-sonarqube-mcp"]
```

### Additional Environment Variables
Add more variables as needed:
```json
"env": {
  "SONARQUBE_TOKEN": "${SONARQUBE_TOKEN}",
  "SONARQUBE_URL": "${SONARQUBE_URL}",
  "SONARQUBE_ORG": "${SONARQUBE_ORG}",
  "CUSTOM_VAR": "${CUSTOM_VAR}"
}
```

### Non-Docker Deployment
Replace `docker` command with direct execution:
```json
{
  "command": "node",
  "args": ["/path/to/mcp-server/index.js"],
  "env": { ... }
}
```
