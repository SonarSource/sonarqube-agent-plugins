---
name: sonar-integrate
description: "Installs sonarqube-cli if not already installed, authenticates, and integrates SonarQube with the current agent (installs analysis hooks & SonarQube MCP Server). Use when the user wants to set up SonarQube integration or asks to configure SonarQube."
allowed-tools: Bash(sonar:*), Bash(docker ps:*), Bash(podman ps:*), Bash(nerdctl ps:*)
---

# Integrate SonarQube

Guide the user through installing **sonarqube-cli** (if needed), **updating it to the latest version** when already installed, authenticating, and completing agent-specific integration. Assume SonarQube itself is already set up; this skill only wires the assistant.

## Instructions

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

### Step 1 — Install or update sonarqube-cli

Invoke the sonar-install-cli skill. It installs the CLI when it is missing, or updates it to the latest version, and reports **installed**, **up to date**, **not updated** or **not installed**. On **not installed**, stop: the user has to install `sonarqube-cli` and re-invoke this skill. Otherwise, continue to Step 2.

---

### Step 2 — Login

Invoke the sonar-login skill. It checks `sonar auth status`, and when the CLI is not logged in, builds the `sonar auth login` command for the user to run and verifies the login. Once it reports a successful login (the connected server, plus the organization for SonarQube Cloud), continue to Step 3. If the user stops without logging in, stop here too.

---

### Step 3 — Agent-specific integration

> **Container runtime requirement:** The SonarQube MCP Server runs inside a container, started via `sonar run mcp` (which detects Docker, Podman, or Nerdctl). A container runtime must be **installed and running** for the MCP tools to load — otherwise integration can complete successfully yet no `mcp__sonarqube__*` tools appear in the session. **Verify this yourself:** run `docker ps` (falling back to `podman ps` / `nerdctl ps`). If one succeeds, the runtime is up — proceed. If none do, tell the user their container runtime is not running and ask them to start it, then note they must restart the agent session afterward for the tools to load (starting the daemon and restarting the session are the only parts you cannot do for them).

For the current agent, run this command yourself using a shell command:

```bash
sonar integrate <agent> --non-interactive
```

Use the current agent's name: `claude`, `copilot`, `codex`, `cursor`, `antigravity`, `devin`, `pi`, or `opencode`.

Exceptions:

- **Cursor:** After the command completes, tell the user to open **Settings → MCP** and enable the `sonarqube` entry.
- **Factory Droid:** Skip the command; the plugin's `mcp.json` already configures the SonarQube MCP Server via `sonar run mcp`.

After integration completes, tell the user to ensure Docker, Podman, or Nerdctl is running, then restart the current agent session to load the configuration.

---

### Summary message

After all steps complete, print a summary:

```
✅ SonarQube integration is ready.

  sonarqube-cli:     up to date
  Authentication:    token stored in system keychain
  Integration:       configured

Ensure Docker, Podman, or Nerdctl is running, then restart the current agent session to load the configuration.

You can verify at any time with:  sonar auth status
To refresh CLI + wiring later:    invoke the sonar-integrate skill again
```

For **Cursor**, insert this message before the container runtime and restart instruction:

```
Enable the sonarqube entry in Cursor Settings → MCP before restarting.
```

If sonar-install-cli reported **installed** in Step 1, replace the `sonarqube-cli` summary line with `sonarqube-cli: installed`.

If it reported **not updated** in Step 1, adjust the summary: omit the `sonarqube-cli` line or state that the CLI was not updated and suggest the manual upgrade command sonar-install-cli returned for its install route.

If any other step failed, note it clearly and suggest the corrective action.
