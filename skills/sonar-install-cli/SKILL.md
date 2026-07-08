---
name: sonar-install-cli
description: "Install the SonarQube CLI (the `sonar` binary) if missing, or update it to the latest version if already present, on macOS, Linux, or Windows. Use when `sonar` is not found on PATH, when a SonarQube skill reports the CLI is missing or not installed, or when the user asks to install / update / set up the SonarQube CLI (sonarqube-cli)."
allowed-tools: Bash(which:*), Bash(Get-Command:*), Bash(sonar:*), Bash(curl:*), Bash(irm:*), Bash(iex:*)
---

# Install SonarQube CLI

Install or update **sonarqube-cli** (the `sonar` binary). This skill manages **only the CLI binary** — it does not authenticate or wire any agent. For login and agent integration (MCP Server, hooks), use the **sonar-integrate** skill afterward.

## Usage

```
sonar-install-cli        # install if missing, or update to the latest version
```

## Instructions

Interaction rule: confirm with the user before running any install command. Do not run an install command until the user explicitly confirms.

### Step 1 — Check whether the CLI is present

Check if `sonar` is on the PATH by running `which sonar` (macOS/Linux) or `Get-Command sonar` (Windows) yourself.

### Step 2a — Already installed → update

If `sonar` is found, run **`sonar self-update`** yourself and wait for it to finish.

- **Success:** briefly tell the user the CLI is up to date (or was upgraded). Go to Step 3.
- **Failure:** show the relevant output and suggest running `sonar self-update` manually (e.g. offline or network issues). Treat the CLI as usable if the binary still works — do not fail the skill unless the binary is missing or broken. Go to Step 3.

### Step 2b — Not installed → install

If `sonar` is not found, pick the platform-appropriate command from the table below, show it to the user, and ask for explicit confirmation **before running it**. Do **not** execute the command until the user confirms.

| Platform      | Install command                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| macOS / Linux | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
| Windows (PS)  | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`      |

- **If the user confirms:** run the command yourself, then re-run the PATH check (`which sonar` / `Get-Command sonar`) to verify.
- **If the user declines:** stop and ask the user to install `sonarqube-cli` manually, then re-invoke this skill (or the skill that needs it).

### Step 3 — Verify and report

Re-run the PATH check. Print a short summary:

```
✅ SonarQube CLI ready — <installed | updated | already current>.

Next: authenticate and wire your agent with the sonar-integrate skill
(`sonar auth login`, then agent-specific integration).
```

If the CLI is still not available (install declined or failed), say so clearly and stop.

### Related skills

- **sonar-integrate** — authenticate (`sonar auth login`) and wire the current agent (MCP Server, secrets/agentic hooks). It chains to this skill for the install/update step.
- **sonar-git-hooks** — install commit/push-time secrets scanning (needs the CLI).
