---
name: integrate
description: "Installs sonarqube-cli if not already installed, authenticates, and integrates SonarQube with the current agent (installs analysis hooks & SonarQube MCP Server). Use when the user wants to set up SonarQube integration or asks to configure SonarQube."
allowed-tools: Bash(which:*), Bash(Get-Command:*), Bash(sonar:*), Bash(docker:*)
---

# Integrate SonarQube

Guide the user through installing **sonarqube-cli** (if needed), **updating it to the latest version** when already installed, authenticating, and completing agent-specific integration. Assume SonarQube itself is already set up; this skill only wires the assistant.

## Instructions

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

### Step 1 — Check for sonarqube-cli and update it

Check if `sonar` is available on the PATH by running `which sonar` (macOS/Linux) or `Get-Command sonar` (Windows) yourself.

**If found:**

1. Run **`sonar self-update`** yourself and wait for it to finish.
   - **If it succeeds:** briefly tell the user the CLI is up to date (or was upgraded), then go to Step 2.
   - **If it fails:** show the relevant output, suggest they run `sonar self-update` manually (e.g. offline or network issues), then **still continue** to Step 2 if `sonar` remains usable — do not block the rest of the flow unless the binary is missing or broken.

**If not found:** show the user the platform-appropriate install command and ask them to run it
(this cannot be automated — it requires an interactive shell session).

| Platform      | Install command                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| macOS / Linux | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
| Windows (PS)  | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`      |

Wait for the user to confirm, then re-run the PATH check (`which sonar` or `Get-Command sonar`) yourself to verify before continuing.

---

### Step 2 — Check authentication status

Run `sonar auth status` yourself using a shell command.

**If already authenticated:** note the connected server and organisation from the output,
then skip directly to Step 4.

**If not authenticated:** proceed to Step 3.

---

### Step 3 — Authenticate (`sonar auth login`)

This step requires user interaction — do **not** run it yourself.

First determine the connection type using a single-choice selector with these options:

1. SonarQube Cloud - EU (default)
2. SonarQube Cloud - US
3. Self-hosted SonarQube Server

Do not ask an open-ended text question for this decision.

Collect:

| Scenario                       | Information needed                                            |
| ------------------------------ | ------------------------------------------------------------- |
| SonarQube Cloud — EU (default) | organization key (e.g. `my-org`)                              |
| SonarQube Cloud — US           | organization key + confirm US region (`https://sonarqube.us`) |
| SonarQube Server               | server URL (e.g. `https://sonarqube.yourcompany.com`)         |

Build the login command and show it to the user:

| Scenario             | Command                                                 |
| -------------------- | ------------------------------------------------------- |
| SonarQube Cloud — EU | `sonar auth login -o <org-key>`                         |
| SonarQube Cloud — US | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| SonarQube Server     | `sonar auth login -s <server-url>`                      |

Tell the user:

> "Run the command below — it will open your browser to log in. The token is stored
> securely in your system keychain and never appears in this chat."

Wait for the user to confirm they logged in, then run `sonar auth status` yourself to
verify before continuing.

---

### Step 4 — Agent-specific integration

Pick exactly one branch below based on which agent you are. Do not run the other branches.

- Claude Code → **4.a**
- Codex → **4.b**
- Cursor or Copilot CLI → **4.c**

#### 4.a — Claude Code (`sonar integrate claude`)

Run **`sonar integrate claude`**, which configures the **SonarQube MCP Server**, **secrets-scanning hooks**, and any other supported integration the CLI applies.

It wires **MCP** (for skills like quality-gate, analyze, coverage, duplication, dependency-risks) and **secrets-scanning hooks** into the user’s Claude Code config. When available, SonarQube Agentic Analysis hooks are also installed.

Ask the user using a single-choice selector with these options:

1. Current project only (default)
2. Global (all projects)

Do not ask an open-ended text question for this decision.

Then run the appropriate command yourself using a shell command, using the server/org
from Step 2 or Step 3 and adding `--non-interactive`:

| Scenario     | Command                                             |
| ------------ | --------------------------------------------------- |
| Project-only | `sonar integrate claude --non-interactive`          |
| Global       | `sonar integrate claude --global --non-interactive` |

#### 4.b — Codex (manual MCP server install)

Ask the user to install the **SonarQube MCP Server** themselves by following the upstream instructions:

> https://docs.sonarsource.com/sonarqube-mcp-server/quickstart-guide/codex-cli

Tell the user to follow that quickstart guide to configure the MCP server in their Codex environment (using the server/org and, if applicable, server URL collected in Step 2 or Step 3). Do **not** attempt to run, install, or configure the MCP server yourself.

Wait for the user to confirm they have completed the installation before moving on to the summary.

#### 4.c — Cursor and Copilot CLI (Docker + environment variables)

These agents use a shared `.mcp.json` at the plugin root that starts the SonarQube MCP Server via Docker. Verify the prerequisites:

1. **Docker:** run `docker info` yourself. If it fails, tell the user Docker must be installed and running, then stop.
2. **Environment variables:** check that **all three** of `SONARQUBE_TOKEN`, `SONARQUBE_ORG`, and `SONARQUBE_URL` are set in the host environment. All three are required, none may be omitted. If any are missing, tell the user which ones to set and how (`export` in shell profile on macOS/Linux, or system/user environment variables on Windows).

   Use the value from Step 3 for `SONARQUBE_URL`:

   | Connection type                | `SONARQUBE_URL` value          |
   | ------------------------------ | ------------------------------ |
   | SonarQube Cloud — EU (default) | `https://sonarcloud.io`        |
   | SonarQube Cloud — US           | `https://sonarqube.us`         |
   | Self-hosted SonarQube Server   | the server URL from Step 3     |

If both checks pass, confirm that integration is ready — the MCP server will start automatically when the agent reads `.mcp.json`.

---

### Summary message

After all steps complete, print a summary:

```
✅ SonarQube integration is ready.

  sonarqube-cli:     updated via sonar self-update
  Authentication:    token stored in system keychain
  MCP Server:        configured (restart the agent session if tools do not appear)

You can verify at any time with:  sonar auth status
To refresh CLI + wiring later:    invoke the SonarQube integrate skill again
```

If **`sonar self-update`** failed in Step 1, adjust the summary: omit the `sonarqube-cli` line or state that the CLI was not updated and suggest `sonar self-update` in a terminal.

If any other step failed, note it clearly and suggest the corrective action.
