---
name: sonar-integrate
description: "Installs sonarqube-cli if not already installed, authenticates, and integrates SonarQube with the current agent (installs analysis hooks & SonarQube MCP Server). Use when the user wants to set up SonarQube integration or asks to configure SonarQube."
allowed-tools: Bash(which:*), Bash(Get-Command:*), Bash(sonar:*), Bash(agy:*), Bash(curl:*), Bash(irm:*), Bash(iex:*), Bash(brew:*), Bash(mise:*), Bash(docker ps:*), Bash(podman ps:*), Bash(nerdctl ps:*)
---

# Integrate SonarQube

Guide the user through installing **sonarqube-cli** (if needed), **updating it to the latest version** when already installed, authenticating, and completing agent-specific integration. Assume SonarQube itself is already set up; this skill only wires the assistant.

## Instructions

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

### Step 1 — Check for sonarqube-cli and update it

Check if `sonar` is available on the PATH by running `which sonar` (macOS/Linux) or `Get-Command sonar` (Windows) yourself.

**If found:** first determine how it was installed, because the upgrade path differs:

- **Managed by a package or version manager** (e.g. installed via Homebrew or mise — the binary lives under the manager's prefix rather than `~/.local/share/sonarqube-cli/bin`): do **not** run `sonar self-update`, as it conflicts with the manager. Run the manager's upgrade command yourself instead (Homebrew: `brew upgrade --cask sonarqube-cli`; mise: `mise upgrade aqua:SonarSource/sonarqube-cli`), then go to Step 2. If the upgrade fails, show the output but **still continue** to Step 2 as long as `sonar` remains usable.
- **Installed via the shell/PowerShell script, or unsure:** run **`sonar self-update`** yourself and wait for it to finish.
  - **If it succeeds:** briefly tell the user the CLI is up to date (or was upgraded), then go to Step 2.
  - **If it fails:** show the relevant output, suggest they run `sonar self-update` manually (e.g. offline or network issues), then **still continue** to Step 2 if `sonar` remains usable — do not block the rest of the flow unless the binary is missing or broken.

**If not found:** pick an install command from the table below, show it to the user, and ask for explicit confirmation **before running it**. Do **not** execute the command until the user confirms.

The shell/PowerShell script is the default and works everywhere. If the user already manages CLIs with **Homebrew** or **mise**, prefer that route so future upgrades stay managed by the tool — the Step 1 update above then defers to the manager.

| Platform / method        | Install command                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| macOS / Linux (script)   | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
| macOS / Linux (Homebrew) | `brew install --cask sonarqube-cli`                                                                                      |
| Any OS (mise)            | `mise use -g aqua:SonarSource/sonarqube-cli`                                                                             |
| Windows (PowerShell)     | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`      |

**If the user confirms:** run the command yourself using a shell command. After it finishes, re-run the PATH check (`which sonar` or `Get-Command sonar`) yourself to verify before continuing.

**If the user declines:** stop the skill and ask the user to install `sonarqube-cli` manually and then re-invoke the sonar-integrate skill.

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

> **Container runtime requirement:** The SonarQube MCP Server runs inside a container, started via `sonar run mcp` (which detects Docker, Podman, or Nerdctl). A container runtime must be **installed and running** for the MCP tools to load — otherwise integration can complete successfully yet no `mcp__sonarqube__*` tools appear in the session. **Verify this yourself:** run `docker ps` (falling back to `podman ps` / `nerdctl ps`). If one succeeds, the runtime is up — proceed. If none do, tell the user their container runtime is not running and ask them to start it, then note they must restart the agent session afterward for the tools to load (starting the daemon and restarting the session are the only parts you cannot do for them).

Pick exactly one branch below based on which agent you are. Do not run the other branches.

- Claude Code -> **4.a**
- Copilot CLI -> **4.b**
- Codex -> **4.c**
- Cursor -> **4.d**
- Antigravity -> **4.e**
- Gemini CLI -> **4.f**

#### 4.a — Claude Code (`sonar integrate claude`)

Run **`sonar integrate claude`**, which configures the **SonarQube MCP Server**, **secrets-scanning hooks**, and any other supported integration the CLI applies.

It wires **MCP** (for skills like sonar-quality-gate, sonar-analyze, sonar-coverage, sonar-duplication, sonar-dependency-risks) and **secrets-scanning hooks** into the user’s Claude Code config. When available, SonarQube Agentic Analysis hooks are also installed.

Ask the user using a single-choice selector with these options:

1. Current project only (default)
2. Global (all projects)

Do not ask an open-ended text question for this decision.

Then run the appropriate command yourself using a shell command, and adding `--non-interactive`:

| Scenario     | Command                                             |
| ------------ | --------------------------------------------------- |
| Project-only | `sonar integrate claude --non-interactive`          |
| Global       | `sonar integrate claude --global --non-interactive` |

#### 4.b — Copilot CLI (`sonar integrate copilot`)

Run **`sonar integrate copilot`**, which configures the **SonarQube MCP Server**, **secrets-scanning hooks**, and any other supported integration the CLI applies.

It wires **MCP** (for skills like sonar-quality-gate, sonar-analyze, sonar-coverage, sonar-duplication, sonar-dependency-risks) and **secrets-scanning hooks** into the user’s Copilot CLI config.

Ask the user using a single-choice selector with these options:

1. Current project only (default)
2. Global (all projects)

Do not ask an open-ended text question for this decision.

Then run the appropriate command yourself using a shell command, and adding `--non-interactive`:

| Scenario     | Command                                             |
| ------------ | --------------------------------------------------- |
| Project-only | `sonar integrate copilot --non-interactive`          |
| Global       | `sonar integrate copilot --global --non-interactive` |

#### 4.c — Codex (`sonar integrate codex`)

Run **`sonar integrate codex`**, which configures the **SonarQube MCP Server**, **secrets-scanning hooks**, and—when your SonarQube Cloud org has Agentic Analysis—a **PostToolUse** hook on **`apply_patch`** that surfaces findings inline after edits.

Ask the user using a single-choice selector with these options:

1. Current project only (default)
2. Global (all projects)

Do not ask an open-ended text question for this decision.

Then run the appropriate command yourself using a shell command, and adding `--non-interactive`:

| Scenario     | Command                                            |
| ------------ | -------------------------------------------------- |
| Project-only | `sonar integrate codex --non-interactive`          |
| Global       | `sonar integrate codex --global --non-interactive` |

If the project key is not already known from `sonar-project.properties` or prior context, add **`--project <key>`** to the project-only command.

#### 4.d — Cursor (`sonar integrate cursor`)

Run **`sonar integrate cursor`**, which configures **secrets-scanning hooks** (`beforeSubmitPrompt`, `beforeReadFile`, and `preToolUse`), **MCP**, **Context Augmentation** (when entitled), and **Agentic Analysis instructions** (when entitled, project scope only).

Ask the user using a single-choice selector with these options:

1. Current project only (default)
2. Global (all projects)

Do not ask an open-ended text question for this decision.

Then run the appropriate command yourself using a shell command, adding **`--non-interactive`**:

| Scenario     | Command                                                |
| ------------ | ------------------------------------------------------ |
| Project-only | `sonar integrate cursor --non-interactive`             |
| Global       | `sonar integrate cursor --global --non-interactive`    |

If the project key is not already known from `sonar-project.properties` or prior context, add **`--project <key>`** to the project-only command.

After integrate completes, tell the user to enable the MCP server manually in Cursor: open **Settings → MCP**, find the `sonarqube` entry, and toggle it on. Also tell the user to ensure a container runtime (Docker, Podman, or Nerdctl) is running. A Cursor session restart may be needed for the tools to appear.

#### 4.e — Antigravity (`sonar integrate antigravity`)

Run **`sonar integrate antigravity`**, which configures **secrets-scanning hooks**, **prompt-secrets and Agentic Analysis instructions**, **Context Augmentation** (when entitled), and **MCP** in the Antigravity harness.

Ask the user using a single-choice selector with these options:

1. Current project only (default)
2. Global (all projects)

Do not ask an open-ended text question for this decision.

Then run the appropriate command yourself using a shell command, adding **`--non-interactive`**:

| Scenario     | Command                                                |
| ------------ | ------------------------------------------------------ |
| Project-only | `sonar integrate antigravity --non-interactive`        |
| Global       | `sonar integrate antigravity --global --non-interactive` |

If the project key is not already known from `sonar-project.properties` or prior context, add **`--project <key>`** to the project-only command.

Tell the user to ensure a container runtime (Docker, Podman, or Nerdctl) is running, and to restart the Antigravity session if MCP tools do not appear after integrate completes.

#### 4.f — Gemini CLI *(legacy)*

Gemini CLI starts the SonarQube MCP Server via `sonar run mcp`, which handles container runtime detection (Docker, Podman, Nerdctl) and authentication automatically. Authentication was handled in Steps 2–3.

Confirm that integration is ready — the MCP server will start automatically when Gemini CLI reads **`gemini-extension.json`**.

Recommend migrating to **Antigravity** (**4.e**): run **`agy plugin import gemini`**, then **`sonar integrate antigravity`**. Gemini CLI did not support SonarQube hooks or Agentic Analysis wiring.

---

### Summary message

After all steps complete, print a summary:

```
✅ SonarQube integration is ready.

  sonarqube-cli:     up to date
  Authentication:    token stored in system keychain
  MCP Server:        configured (ensure a container runtime (Docker, Podman, or Nerdctl) is running, then restart the agent session if tools do not appear)

You can verify at any time with:  sonar auth status
To refresh CLI + wiring later:    invoke the sonar-integrate skill again
```

If path **4.a** (Claude Code) was taken, add this line to the summary:

```
  Secrets scanning:  hooks registered via sonar integrate claude
```

If path **4.b** (Copilot CLI) was taken, add this line to the summary:

```
  Secrets scanning:  hooks registered via sonar integrate copilot
```

If path **4.c** (Codex) was taken, add this line to the summary:

```
  Hooks & MCP:       wired via sonar integrate codex
```

If path **4.d** (Cursor) was taken, add these lines to the summary:

```
  CLI integrate:     wired via sonar integrate cursor
  MCP Server:        enable manually in Cursor Settings → MCP (ensure a container runtime (Docker, Podman, or Nerdctl) is running; restart may be needed)
```

And **omit** the default `MCP Server` line (it is replaced by the Cursor-specific one above).

If path **4.e** (Antigravity) was taken, add these lines to the summary:

```
  CLI integrate:     wired via sonar integrate antigravity
```

If path **4.f** (Gemini CLI) was taken, no extra line is required beyond the default MCP summary.

If **sonarqube-cli was freshly installed** in Step 1, replace the `sonarqube-cli` summary line with `sonarqube-cli: installed`.

If **`sonar self-update`** failed in Step 1, adjust the summary: omit the `sonarqube-cli` line or state that the CLI was not updated and suggest `sonar self-update` in a terminal.

If any other step failed, note it clearly and suggest the corrective action.
