---
name: sonar-integrate
description: "Use when setting up or repairing SonarQube integration, including a configured MCP server whose analysis tools are unavailable in the current agent session."
allowed-tools: Bash(which:*), Bash(Get-Command:*), Bash(sonar:*), Bash(agy:*), Bash(curl:*), Bash(irm:*), Bash(iex:*), Bash(brew:*), Bash(mise:*), Bash(docker ps:*), Bash(podman ps:*), Bash(nerdctl ps:*)
---

# Integrate SonarQube

First identify whether the agent uses an existing remote MCP server or a local `sonarqube-cli` server. Repair the existing route before installing a different one. This skill wires the assistant; it does not administer SonarQube projects or grant permission to create tokens.

## Instructions

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

### Existing remote MCP — check before Step 1

Inspect the agent's active MCP configuration and available tools. For Codex, `codex mcp get sonarqube --json` reveals whether the transport is remote HTTPS and which environment variable supplies its bearer token; never print the token itself. If the repository provides a tracked MCP client, launcher, or analysis hook, inspect that route before choosing the CLI installation below. A remote HTTP MCP does not require local `sonar`, Docker, Podman, or Nerdctl.

If native Sonar tools are missing from a running session, do not conclude that a restart is required. Check whether the configured credential is available to the current process. If the environment uses a trusted launcher or OS credential store, use its existing scoped process or agent control interface when available; keep the credential in that process, never in chat, logs, repository files, or tool arguments. A project-approved direct MCP client may restore working analysis for the current session even if native tools cannot be hot-loaded. Do not create or rotate an account or token merely to repair a client-side session.

Prove the route with an actual analysis call on a scanned, non-secret diagnostic file or an approved source file. Check `tools/list` only to discover the analysis tool and its schema; a successful list or token-presence check alone is insufficient. Record the project key, tool, result, current analyzed base, and quality gate separately. If a repository requires analysis after edits, verify its hook on a harmless test edit or run the approved analysis client after every coherent patch. State whether the analysis works manually, through a native tool, or automatically through the hook; these are distinct states. If the remote route works, stop this skill here. If no approved route works, report the specific failure and only then consider a new session or the local CLI route below.

The steps below apply when the selected route actually uses `sonarqube-cli`.

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

> **Local CLI container requirement:** When `sonar run mcp` is the selected transport, its MCP server runs inside Docker, Podman, or Nerdctl. Verify the selected runtime with `docker ps` (or `podman ps` / `nerdctl ps`). If none works, report that the local CLI route cannot start yet. This requirement does not apply to an already configured remote HTTP MCP. After repairing the runtime, test an actual analysis; request a session restart only when the agent cannot load or reach any verified analysis route in the running session.

Pick exactly one branch below based on which agent you are. Do not run the other branches.

- Claude Code -> **4.a**
- Copilot CLI -> **4.b**
- Codex -> **4.c**
- Cursor -> **4.d**
- Antigravity -> **4.e**
- Gemini CLI -> **4.f**

#### 4.a — Claude Code (`sonar integrate claude`)

Run **`sonar integrate claude`**, which configures the **SonarQube MCP Server**, **secrets-scanning hooks**, and any other supported integration the CLI applies.

It wires **MCP** (for skills like sonar-quality-gate, sonar-analyze, sonar-coverage, sonar-duplication, sonar-dependency-risks) and **secrets-scanning hooks** into the user’s Claude Code config, applying to all Claude Code sessions on this machine. When available, SonarQube Vortex analysis hooks are also installed.

Run this command yourself using a shell command:

```bash
sonar integrate claude --non-interactive
```

#### 4.b — Copilot CLI (`sonar integrate copilot`)

Run **`sonar integrate copilot`**, which configures the **SonarQube MCP Server**, **secrets-scanning hooks**, and any other supported integration the CLI applies.

It wires **MCP** (for skills like sonar-quality-gate, sonar-analyze, sonar-coverage, sonar-duplication, sonar-dependency-risks) and **secrets-scanning hooks** into the user’s Copilot CLI config, applying to all Copilot CLI sessions on this machine.

Run this command yourself using a shell command:

```bash
sonar integrate copilot --non-interactive
```

#### 4.c — Codex (`sonar integrate codex`)

Run **`sonar integrate codex`**, which configures the **SonarQube MCP Server**, **secrets-scanning hooks**, and—when your SonarQube Cloud org has Vortex analysis—a **PostToolUse** hook on **`apply_patch`** that surfaces findings inline after edits, applying to all Codex sessions on this machine.

Run this command yourself using a shell command:

```bash
sonar integrate codex --non-interactive
```

#### 4.d — Cursor (`sonar integrate cursor`)

Run **`sonar integrate cursor`**, which configures **secrets-scanning hooks** (`beforeSubmitPrompt`, `beforeReadFile`, and `preToolUse`), **MCP**, **Context Augmentation** (when entitled), and **Vortex analysis instructions** (when entitled), applying to all Cursor sessions on this machine. Note: Cursor's cloud/background agents only pick up hooks installed in the project itself, not machine-wide ones, so those agents won't see the installed hooks.

Run this command yourself using a shell command:

```bash
sonar integrate cursor --non-interactive
```

After integrate completes, tell the user to enable the MCP server manually in Cursor: open **Settings → MCP**, find the `sonarqube` entry, and toggle it on. Also tell the user to ensure a container runtime (Docker, Podman, or Nerdctl) is running. A Cursor session restart may be needed for the tools to appear.

#### 4.e — Antigravity (`sonar integrate antigravity`)

Run **`sonar integrate antigravity`**, which configures **secrets-scanning hooks**, **prompt-secrets and Vortex analysis instructions**, **Context Augmentation** (when entitled), and **MCP** in the Antigravity harness, applying to all Antigravity sessions on this machine.

Run this command yourself using a shell command:

```bash
sonar integrate antigravity --non-interactive
```

Tell the user to ensure a container runtime (Docker, Podman, or Nerdctl) is running, and to restart the Antigravity session if MCP tools do not appear after integrate completes.

#### 4.f — Gemini CLI *(legacy)*

Gemini CLI starts the SonarQube MCP Server via `sonar run mcp`, which handles container runtime detection (Docker, Podman, Nerdctl) and authentication automatically. Authentication was handled in Steps 2–3.

Confirm that integration is ready — the MCP server will start automatically when Gemini CLI reads **`gemini-extension.json`**.

Recommend migrating to **Antigravity** (**4.e**): run **`agy plugin import gemini`**, then **`sonar integrate antigravity`**. Gemini CLI did not support SonarQube hooks or Vortex analysis wiring.

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
