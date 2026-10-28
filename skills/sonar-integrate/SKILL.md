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

Check if the CLI is available by running `sonar --version` (macOS/Linux) or `sonar.exe --version` (Windows) yourself; a zero exit code (version printed) means found. If found, also run `which sonar` (macOS/Linux) or `(Get-Command sonar.exe).Source` (Windows) to find the installation location.

**If found:** first determine how it was installed, because the upgrade path differs:

- **Managed by a package or version manager** (e.g. installed via Homebrew or mise — the binary lives under the manager's prefix rather than `~/.local/share/sonarqube-cli/bin`): do **not** run `sonar update`, as it conflicts with the manager. Run the manager's upgrade command yourself instead (Homebrew: `brew upgrade --cask sonarqube-cli`; mise: `mise upgrade aqua:SonarSource/sonarqube-cli`), then go to Step 2. If the upgrade fails, show the output but **still continue** to Step 2 as long as `sonar` remains usable.
- **Installed via the shell/PowerShell script, or unsure:** run **`sonar update`** yourself and wait for it to finish.
  - **If it succeeds:** briefly tell the user the CLI is up to date (or was upgraded), then go to Step 2.
  - **If it fails:** show the relevant output, suggest they run `sonar update` manually (e.g. offline or network issues), then **still continue** to Step 2 if `sonar` remains usable — do not block the rest of the flow unless the binary is missing or broken.

**If not found:** pick an install command from the table below, show it to the user, and ask for explicit confirmation **before running it**. Do **not** execute the command until the user confirms.

The shell/PowerShell script is the default and works everywhere. If the user already manages CLIs with **Homebrew** or **mise**, prefer that route so future upgrades stay managed by the tool — the Step 1 update above then defers to the manager.

| Platform / method        | Install command                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| macOS / Linux (script)   | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
| macOS / Linux (Homebrew) | `brew install --cask sonarqube-cli`                                                                                      |
| Any OS (mise)            | `mise use -g aqua:SonarSource/sonarqube-cli`                                                                             |
| Windows (PowerShell)     | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`      |

**If the user confirms:** run the command yourself using a shell command. After it finishes, re-run the version check (`sonar --version` or `sonar.exe --version`) yourself to verify before continuing.

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

For the current agent, run this command yourself using a shell command:

```bash
sonar integrate <agent> --non-interactive
```

Use the current agent's name: `claude`, `copilot`, `codex`, `cursor`, `antigravity`, `devin`, `pi`, or `opencode`.

Exceptions:

- **Cursor:** After the command completes, tell the user to open **Settings → MCP** and enable the `sonarqube` entry.
- **Gemini CLI (legacy):** Skip the command; the extension's `gemini-extension.json` already configures the SonarQube MCP Server via `sonar run mcp`. Recommend migrating to Antigravity with `agy plugin import gemini`, then `sonar integrate antigravity --non-interactive`.
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

For **Gemini CLI (legacy)**, add:

Consider migrating to Antigravity. To migrate, run:

```bash
agy plugin import gemini
sonar integrate antigravity --non-interactive
```

If **sonarqube-cli was freshly installed** in Step 1, replace the `sonarqube-cli` summary line with `sonarqube-cli: installed`.

If **`sonar update`** failed in Step 1, adjust the summary: omit the `sonarqube-cli` line or state that the CLI was not updated and suggest `sonar update` in a terminal.

If any other step failed, note it clearly and suggest the corrective action.
