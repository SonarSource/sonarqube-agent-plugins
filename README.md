# SonarQube agent integrations

**Made by [Sonar](https://www.sonarsource.com/)**

SonarQube is the AI code quality and security verification platform used by millions of developers to catch bugs, vulnerabilities, and leaked secrets. This plugin enforces those standards in the agent coding loop: 7,500+ distinct issue types, secrets scanning, agentic analysis, and quality gates across 40+ languages.

SonarQube combines deterministic checks with AI-assisted workflows so quality rules apply consistently to code from both developers and agents. Where your stack supports it, analysis and secrets scanning can run inside the agent loop instead of only in CI.

## What do the plugins include

The Plugin helps agents connect to [SonarQube CLI](https://cli.sonarqube.com/) and [SonarQube MCP Server](https://docs.sonarsource.com/sonarqube-mcp-server) for issue detection, checking project metrics such as test coverage and duplications, fetch dependency risks, etc. Claude Code, Copilot CLI, Codex, and Antigravity (through SonarQube CLI) install agent hooks for secrets scanning and, when entitled, Agentic Analysis.

How to use: Run `/sonarqube:sonar-integrate` after installation to walk through setup — CLI installation, authentication, and wiring up the MCP Server and hooks. From there, use slash commands like `/sonarqube:sonar-quality-gate` to check quality gates or interact naturally with prompts like "analyze my code for issues," "show open SonarQube findings," or "check my coverage." With Agentic Analysis enabled, verification happens automatically after each edit with no manual invocation required.

## Prerequisites

- A SonarQube account (**SonarQube Cloud**, **Server**, or **Community Build**). Some features (for example Agentic Analysis) depend on your SonarQube Cloud organization settings.
- **[SonarQube CLI](https://cli.sonarqube.com/)** (`sonar`) on your machine.
- A **container runtime** (Docker, Podman, or Nerdctl) for the MCP server image.

Authenticate once with **`sonar auth login`** (browser flow; credentials stay in your OS keychain). The MCP server uses that login.

Check auth anytime:

```bash
sonar auth status
```

---

## How plugins connect to SonarQube

### Claude Code and GitHub Copilot CLI

**SonarQube CLI** can wire everything for you:

```bash
sonar integrate claude        # Claude Code: MCP, hooks, secrets scanning, etc.
sonar integrate copilot       # GitHub Copilot CLI: MCP, hooks, secrets scanning, etc.
sonar integrate codex         # Codex: MCP, hooks, secrets scanning, Agentic Analysis hook
sonar integrate antigravity   # Antigravity: hooks, instructions, CAG, MCP patch (after plugin install)
```

Run these **after** `sonar auth login`. Use the **`/sonarqube:sonar-integrate`** skill if you prefer a guided flow (install/update CLI, login, then integrate).

### Other agents (Cursor, Kiro)

Each layout includes **MCP configuration** (for example **`mcp.json`** or **`kiro-power/mcp.json`**) that runs the **`mcp/sonarqube`** image and **relies on SonarQube CLI** for authentication—the same **`sonar auth login`** session.

### Antigravity (two-step setup)

Antigravity uses **two independent install surfaces**. For full parity with Claude/Copilot you need both:

| Step                 | Command                              | What it installs                                                              |
|----------------------|--------------------------------------|-------------------------------------------------------------------------------|
| **1. Plugin bundle** | `agy plugin install <git-url\|path>` | Skills, agent rules (`rules/sonarqube.md`), MCP (`mcp_config.json`)           |
| **2. CLI integrate** | `sonar integrate antigravity`        | Secrets hooks, Agentic Analysis instructions, Context Augmentation, MCP patch |

There is **no** `@vendor` marketplace install (for example `sonarqube@sonar` is not supported). Use a Git URL, archive, or local path.

---

## Repository layout

| Agent                     | Location                                                     |
|---------------------------|--------------------------------------------------------------|
| **Claude Code**           | `.claude-plugin/`, `skills/`, `claude-hooks/`, `scripts/`    |
| **Cursor**                | `.cursor-plugin/` (+ shared `mcp.json`)                      |
| **GitHub Copilot CLI**    | `.github/plugin/` (+ shared `mcp.json`)                      |
| **Codex**                 | `.codex-plugin/`                                             |
| **Antigravity**           | `plugin.json`, `mcp_config.json`, `rules/`, shared `skills/` |
| **Gemini CLI** *(legacy)* | `gemini-extension.json`, `GEMINI.md`                         |
| **Kiro**                  | `kiro-power/`                                                |

---

## Usage

Skills are the same across agents. Ask in natural language, invoke skills explicitly, or use the **SonarQube MCP** tools your client shows after MCP starts.

MCP reference: [SonarQube MCP Server docs](https://docs.sonarsource.com/sonarqube-mcp-server/).

### Skills

#### Set up

```
/sonarqube:sonar-integrate
```

#### List projects

```
/sonarqube:sonar-list-projects
/sonarqube:sonar-list-projects my-project
```

#### List issues

```
/sonarqube:sonar-list-issues
/sonarqube:sonar-list-issues my-project --severities CRITICAL
```

#### Fix an issue

```
/sonarqube:sonar-fix-issue java:S1481 src/main/java/MyClass.java
/sonarqube:sonar-fix-issue python:S2077 src/auth/login.py:34
```

#### Quality gate / analyze / coverage / duplication / dependency risks

```
/sonarqube:sonar-quality-gate
/sonarqube:sonar-quality-gate my-project --branch main

/sonarqube:sonar-analyze
/sonarqube:sonar-analyze src/auth/login.py

/sonarqube:sonar-coverage
/sonarqube:sonar-coverage my-project --max 50
/sonarqube:sonar-coverage my-project --file src/auth/login.py

/sonarqube:sonar-duplication
/sonarqube:sonar-duplication my-project --pr 42

/sonarqube:sonar-dependency-risks
/sonarqube:sonar-dependency-risks my-project --pr 42
```

---

## Claude Code plugin

Install from Anthropic's marketplace **`claude-plugins-official`**:

```shell
/plugin install sonarqube@claude-plugins-official
```

```shell
claude plugin install sonarqube@claude-plugins-official
```

### One-time setup

- **Node.js** — for the SessionStart hook (`scripts/setup.js`).
- Install **SonarQube CLI** if needed, then **`/sonarqube:sonar-integrate`** or **`sonar auth login`** + **`sonar integrate claude`**.

`sonar auth login` by scenario:

| Scenario             | Command                                                 |
|----------------------|---------------------------------------------------------|
| SonarQube Cloud (EU) | `sonar auth login -o <org-key>`                         |
| SonarQube Cloud (US) | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| SonarQube Server     | `sonar auth login -s <server-url>`                      |

Optional: add **`sonar-project.properties`** in the project root with `sonar.projectKey`, sources, etc.

---

## GitHub Copilot CLI

Plugin bundle: **`.github/plugin/`** — catalog **`sonar`**, plugin **`sonarqube`** (see **[`.github/plugin/marketplace.json`](.github/plugin/marketplace.json)**).

1. Add **SonarSource/sonarqube-agent-plugins** as a plugin marketplace in GitHub Copilot CLI / AgentHQ, then install **sonarqube** from that catalog (some builds expose the same flow as slash commands):

   ```shell
   /plugin marketplace add SonarSource/sonarqube-agent-plugins
   /plugin install sonarqube@sonar
   ```

2. Run **`sonar auth login`**, then **`sonar integrate copilot`**, or invoke the `/sonarqube:sonar-integrate` skill.

Same workflows as **[Usage](#usage)** once MCP is connected.

---

## Cursor

**`.cursor-plugin/`** with MCP via **`mcp.json`**. Use **`sonar auth login`** so the MCP server picks up CLI credentials.

---

## Antigravity

Repo-root plugin: **`plugin.json`**, **`mcp_config.json`**, **`rules/sonarqube.md`**, and shared **`skills/`**. Hooks and managed instructions are **not** in the plugin bundle—they are installed by **`sonar integrate antigravity`**.

### Recommended flow (full integration)

```bash
# 1. Plugin bundle — skills, rules, MCP
agy plugin install https://github.com/SonarSource/sonarqube-agent-plugins

# 2. Auth + hooks / instructions / CAG / MCP patch
sonar auth login
sonar integrate antigravity              # project-scoped (default)
# sonar integrate antigravity -g         # global (all projects; Agentic Analysis skipped)
```

Or use **`/sonarqube:sonar-integrate`** inside Antigravity for a guided flow. Restart the agent session if MCP tools do not appear.

### Install options

| Option            | Command / path                                | What you get                                            |
|-------------------|-----------------------------------------------|---------------------------------------------------------|
| **CLI global**    | `agy plugin install <git-url\|path\|archive>` | Plugin copied to `~/.gemini/config/plugins/sonarqube/`  |
| **IDE workspace** | `<project>/.agents/plugins/sonarqube/`        | Plugin for that workspace only                          |
| **Monorepo dev**  | Open `sonarqube-agent-plugins` as workspace   | Auto-discovery from repo root — no `agy plugin install` |

Installing the **whole repo** is acceptable — other agents' dot-folders are inert in Antigravity.

### Migrating from Gemini CLI

Gemini CLI is being replaced by Antigravity. Migrate platform config first (layout, skills paths, and cleanup), then update SonarQube as below.

If you already had the **SonarQube Gemini extension** installed:

```bash
agy plugin import gemini          # converts legacy extensions → native plugins
sonar integrate antigravity       # add hooks, instructions, CAG (new vs Gemini)
```

`agy plugin import gemini` scans legacy Gemini directories and migrates inline `mcpServers` into `mcp_config.json`. Expect output like `✔ mcpServers : 1 server definition migrated to mcp_config.json` for SonarQube.

If you had custom skills under `.gemini/skills/`, move them to `.agents/skills/`.

After verifying Antigravity works, remove any duplicate legacy Gemini extension install if import created a copy.

For a fresh install, use the [recommended flow](#recommended-flow-full-integration) above.

Same workflows as **[Usage](#usage)** once MCP is connected.

---

## Gemini CLI *(legacy)*

**`gemini-extension.json`** and **`GEMINI.md`**. **`sonar auth login`** and **[Usage](#usage)**.

Migrate to **[Antigravity](#antigravity)** with **`agy plugin import gemini`** and **`sonar integrate antigravity`** as described above.

---

## Codex CLI

Plugin bundle: **`.codex-plugin/`** — catalog **`sonar`**, plugin **`sonarqube`** (see **[`.codex-plugin/plugin.json`](.codex-plugin/plugin.json)**).

1. Add **SonarSource/sonarqube-agent-plugins** as a plugin marketplace in Codex CLI:

   ```shell
   codex plugin marketplace add SonarSource/sonarqube-agent-plugins
   ```

2. Run **`sonar auth login`**.

3. Start a Codex session and install **sonarqube** from that catalog using the `/plugins` command

4. From your project directory, run **`sonar integrate codex`** (add **`--project <key>`** if needed). This wires MCP in **`.codex/config.toml`**, secrets hooks, and—when your SonarQube Cloud org has Agentic Analysis—a **PostToolUse** hook on **`apply_patch`** that runs analysis on the git change set after each edit.

Same workflows as **[Usage](#usage)** once MCP is connected.

---

## Kiro

**`kiro-power/`** (`POWER.md`, MCP config). **`sonar auth login`**, then enable the power per Kiro’s documentation.

---

## License

Copyright (C) 2025-2026 SonarSource Sàrl. Licensed under [SSAL-1.0](LICENSE).

## Support

- Community: https://community.sonarsource.com/
