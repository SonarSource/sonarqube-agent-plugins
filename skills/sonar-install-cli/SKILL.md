---
name: sonar-install-cli
description: "Installs sonarqube-cli when it is missing, or updates it to the latest version through the route it was installed with (install script, Homebrew or mise). Use when the user asks to install or update the SonarQube CLI, when `sonar` is not found, when a `sonar` command is too old for what is needed, or when another skill needs the CLI."
allowed-tools: Bash(which:*), Bash(Get-Command:*), Bash(sonar:*), Bash(curl:*), Bash(irm:*), Bash(iex:*), Bash(brew:*), Bash(mise:*)
---

# SonarQube — Install or update the CLI

Make sure **sonarqube-cli** is installed and up to date, and report which of these happened: **installed**, **up to date** (or upgraded), **not updated** (the update failed but `sonar` still works), or **not installed** (the user declined, or the install failed).

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

When another skill invoked this one, return to it with the result. Only **not installed** should stop the caller.

## Instructions

### Step 1 — Find the CLI

Run `sonar --version` (macOS/Linux) or `sonar.exe --version` (Windows) yourself; a zero exit code (version printed) means found. If found, also run `which sonar` (macOS/Linux) or `(Get-Command sonar.exe).Source` (Windows) to find the installation location, then go to Step 2. If not found, go to Step 3.

### Step 2 — Update it

First determine how it was installed, because the upgrade path differs:

- **Managed by a package or version manager** (e.g. installed via Homebrew or mise — the binary lives under the manager's prefix rather than `~/.local/share/sonarqube-cli/bin`): do **not** run `sonar update`, as it conflicts with the manager. Run the manager's upgrade command yourself instead (Homebrew: `brew upgrade --cask sonarqube-cli`; mise: `mise upgrade aqua:SonarSource/sonarqube-cli`).
- **Installed via the shell/PowerShell script, or unsure:** run **`sonar update`** yourself and wait for it to finish.

**If it succeeds:** briefly tell the user the CLI is up to date (or was upgraded). The result is **up to date**.

**If it fails:** show the relevant output and suggest they run the update manually (e.g. offline or network issues). The result is **not updated**, as long as `sonar` remains usable.

Either way, re-run `sonar --version` (or `sonar.exe --version`) yourself. If it now fails, the upgrade left the CLI missing or broken: show the output and go to Step 3 to reinstall it.

### Step 3 — Install it

Pick an install command from the table below, show it to the user, and ask for explicit confirmation **before running it**. Do **not** execute the command until the user confirms.

The shell/PowerShell script is the default and works everywhere. If the user already manages CLIs with **Homebrew** or **mise**, prefer that route so future upgrades stay managed by the tool — Step 2 then defers to the manager.

| Platform / method        | Install command                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| macOS / Linux (script)   | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
| macOS / Linux (Homebrew) | `brew install --cask sonarqube-cli`                                                                                      |
| Any OS (mise)            | `mise use -g aqua:SonarSource/sonarqube-cli`                                                                             |
| Windows (PowerShell)     | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`      |

**If the user confirms:** run the command yourself. After it finishes, re-run the version check (`sonar --version` or `sonar.exe --version`) yourself. If it succeeds, the result is **installed**. If it fails, show the output; the result is **not installed**.

**If the user declines:** ask them to install `sonarqube-cli` manually and then re-invoke the skill they started from. The result is **not installed**.
