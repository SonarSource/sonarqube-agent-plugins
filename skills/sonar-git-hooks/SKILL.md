---
name: sonar-git-hooks
description: "Install a SonarQube Git pre-commit or pre-push hook that scans for hardcoded secrets (and optionally dependency risks) before commits or pushes, via sonarqube-cli. Use when the user wants commit-time/push-time secrets scanning, git hooks, or to prevent secrets from leaking — including outside an agent session."
argument-hint: "[--hook pre-commit|pre-push] [--global] [--dependency-risks] [-p project-key]"
allowed-tools: Bash(which:*), Bash(Get-Command:*), Bash(sonar:*), Bash(git:*)
---

# SonarQube — Git hooks

Install a **Git hook** that runs SonarQube scanning at the git level — before each commit or push — independently of any AI agent. The hook works in any repository, even when no coding agent is involved.

## Usage

```
sonar-git-hooks                                              # guided: hook type, scope, dependency risks
sonar-git-hooks --hook pre-push                              # push-time secrets scan (current repo)
sonar-git-hooks --global                                     # install for all repositories
sonar-git-hooks --hook pre-commit --dependency-risks -p my-project
```

## Prerequisites

This skill uses the `sonarqube-cli` command. The CLI must be installed **and authenticated** (`sonar integrate git` requires a prior `sonar auth login`). The optional dependency-risks scan additionally needs a project key.

**Before proceeding**, verify that `sonar` is available on your PATH and authenticated:

1. Run `which sonar` (macOS/Linux) or `Get-Command sonar` (Windows) yourself.
2. If present, run `sonar auth status` yourself.

If the CLI is missing or not authenticated, do not invent alternatives, and show the user:

> Unable to install a Git hook.
>
> **Possible causes:**
> - `sonarqube-cli` not installed — invoke the sonar-integrate skill (it installs the CLI), or install it manually.
> - Not authenticated — invoke the sonar-integrate skill, or run `sonar auth login`.

Then ask the user (yes/no) whether to run the sonar-integrate skill now. If they confirm, invoke the sonar-integrate skill yourself and follow it end-to-end, then continue; if they decline, stop.

## Instructions

Interaction rule: for every finite decision, present a predefined single-choice selector instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

### Step 1 — Choose the hook type

If the user passed `--hook`, use that value. Otherwise present a single-choice selector (maps to `--hook`):

1. **pre-commit** — scan **staged** files before each commit (default)
2. **pre-push** — scan files in **unpushed commits** before each push

### Step 2 — Choose the scope

If the user passed `--global`, use global scope. Otherwise present a single-choice selector:

1. **Current repository only** (default)
2. **Global** — all repositories (sets `git config --global core.hooksPath`; maps to `--global`)

For **current repository**, first run `git rev-parse --is-inside-work-tree` yourself to confirm you are inside a git repo. If it does not print `true`, tell the user project-scoped hooks require a git repository and offer either **Global** scope or stopping.

### Step 3 — Dependency-risks scan (pre-commit + current repository only)

Only offer this when the user chose **pre-commit** in Step 1 **and** **current repository** in Step 2. It is **not** supported with pre-push or global scope — skip this step otherwise.

Single-choice selector:

1. **No** — secrets scanning only (default)
2. **Yes** — also scan dependencies for security/license risks on commit

If **Yes**, a project key is required (baked into the hook). Resolve it from `sonar.projectKey` in `sonar-project.properties` at the repo root; otherwise ask the user, or invoke the sonar-list-projects skill to find it. Maps to `--dependency-risks -p <key>`.

### Step 4 — Build and run the command

Assemble the flags from the choices above and **always add `--non-interactive`**:

| Choice                | Flag                                    |
| --------------------- | --------------------------------------- |
| pre-commit / pre-push | `--hook pre-commit` / `--hook pre-push` |
| Global scope          | `--global`                              |
| Dependency risks      | `--dependency-risks -p <key>`           |

Examples:

```bash
sonar integrate git --hook pre-commit --non-interactive
sonar integrate git --hook pre-push --global --non-interactive
sonar integrate git --hook pre-commit --dependency-risks -p my-project --non-interactive
```

Run the assembled command yourself.

**Existing hook:** if the command reports that a hook already exists and was **not** created by `sonar integrate git`, do **not** overwrite silently. Show the message and ask (yes/no selector) whether to overwrite. Only if the user confirms, re-run the same command with `--force` added.

### Step 5 — Summary

After the command completes, print a concise summary:

```
✅ SonarQube Git hook installed.

  Hook:              <pre-commit|pre-push>
  Scope:             <current repository|global (all repositories)>
  Scans:             secrets<, dependency risks (project <key>)>

The hook runs automatically on your next <commit|push>.
```

If the command failed, show the relevant output and suggest the corrective action (for example `--force` for an existing hook, installing the CLI, or `sonar auth login`).

### Step 6 — Related skills

- **sonar-integrate** — full agent wiring (MCP Server, agent secrets/agentic hooks) for Claude Code, Copilot, Codex, Cursor, or Antigravity.
- **sonar-list-projects** — find a project key for the dependency-risks option.
