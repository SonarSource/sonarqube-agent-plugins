---
name: integrate
description: "Installs sonarqube-cli if not already installed, authenticates, and integrates SonarQube with OpenAI Codex (installs analysis hooks & SonarQube MCP Server). Use when the user wants to set up SonarQube integration or asks to configure SonarQube."
allowed-tools: Bash(which:*), Bash(sonar:*)
---

# Integrate SonarQube with OpenAI Codex

Guide the user through installing **sonarqube-cli** (if needed), **updating it to the latest version** when already installed, authenticating, and running **`sonar integrate codex`**. That command configures the **SonarQube MCP Server** and **secrets-scanning hooks** in OpenAI Codex. When available, SonarQube Agentic Analysis hooks are also installed. Assume SonarQube itself is already set up; this skill only wires the assistant. The bundled `.mcp.json` is a catalog template; `sonar integrate codex` merges the live SonarQube MCP definition into your local Codex config.

## Instructions

### Step 1 — Check for sonarqube-cli and update it

Run `which sonar` yourself using the Bash tool.

**If found:**

1. Run **`sonar self-update`** yourself using the Bash tool and wait for it to finish.
   - **If it succeeds:** briefly tell the user the CLI is up to date (or was upgraded), then go to Step 2.
   - **If it fails:** show the relevant output, suggest they run `sonar self-update` manually (e.g. offline or network issues), then **still continue** to Step 2 if `sonar` remains usable — do not block the rest of the flow unless the binary is missing or broken.

**If not found:** show the user the platform-appropriate install command and ask them to run it
(this cannot be automated — it requires an interactive shell session).

| Platform      | Install command                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| macOS / Linux | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
| Windows (PS)  | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`      |

Wait for the user to confirm, then re-run `which sonar` yourself to verify before continuing.

---

### Step 2 — Check authentication status

Run `sonar auth status` yourself using the Bash tool.

**If already authenticated:** note the connected server and organisation from the output,
then skip directly to Step 4.

**If not authenticated:** proceed to Step 3.

---

### Step 3 — Authenticate (`sonar auth login`)

This step requires user interaction — do **not** run it yourself.

First determine the connection type. Ask:

> "Are you connecting to **SonarQube Cloud** (sonarcloud.io / sonarqube.us) or a
> **self-hosted SonarQube Server**?"

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

### Step 4 — Integrate with OpenAI Codex (`sonar integrate codex`)

This step runs **`sonar integrate codex`**, which configures the **SonarQube MCP Server**, **secrets-scanning hooks**, and any other supported integration the CLI applies.

It wires **MCP** (for commands like `/sonarqube:quality-gate`, `/sonarqube:analyze`, `/sonarqube:coverage`, `/sonarqube:duplication`, `/sonarqube:dependency-risks`) and **secrets-scanning hooks** into the user’s Codex config.
Ask the user:

> "Should this integration apply to the **current project only** (default) or
> **globally** to all projects?"

Then run the appropriate command yourself using the Bash tool, using the server/org
from Step 2 or Step 3 and adding `--non-interactive`:

| Scenario                      | Command                                              |
| ----------------------------- | ---------------------------------------------------- |
| Project-only                  | `sonar integrate codex --non-interactive`            |
| Global                        | `sonar integrate codex --global --non-interactive`   |

If the CLI reports that **`integrate codex`** is unknown, tell the user to install or upgrade to a current **sonarqube-cli** (e.g. run **`sonar self-update`**) and retry.

---

### Summary message

After all steps complete, print a summary:

```
✅ SonarQube integration is ready.

  sonarqube-cli:     updated via sonar self-update (when Step 1 ran successfully)
  MCP + hooks:       registered via sonar integrate codex (restart Codex if tools do not appear; ensure codex_hooks / lifecycle hooks are enabled if your Codex version requires it)
  Secrets scanning:  hooks installed via sonar integrate codex
  Authentication:    token stored in system keychain

You can verify at any time with:  sonar auth status
To refresh CLI + wiring later:     run /sonarqube:integrate again (self-update + integrate)
```

If **`sonar self-update`** failed in Step 1, adjust the summary: omit the `sonarqube-cli` line or state that the CLI was not updated and suggest `sonar self-update` in a terminal.

If any other step failed, note it clearly and suggest the corrective action.
