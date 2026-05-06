# SonarQube agent integrations

**Made by [Sonar](https://www.sonarsource.com/)**

Automatically enforce SonarQube code quality and security in the agent coding loop — 7,000+ rules, secrets scanning, agentic analysis, and quality gates across 40+ languages.

SonarQube combines deterministic checks with AI-assisted workflows so quality rules apply consistently to code from both developers and agents. Where your stack supports it, analysis and secrets scanning can run inside the agent loop instead of only in CI.

## What do the plugins include

The Plugin helps agents connect to [SonarQube CLI](https://cli.sonarqube.com/) and [SonarQube MCP Server](https://docs.sonarsource.com/sonarqube-mcp-server) for issue detection, checking project metrics such as test coverage & duplications, fetch dependency risks, etc. Claude Code & Copilot integrations (through SonarQube CLI) install agent hooks. This is coming soon for other agents too.

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
sonar integrate claude    # Claude Code: MCP, hooks, secrets scanning, etc.
sonar integrate copilot   # GitHub Copilot CLI: MCP setup
```

Run these **after** `sonar auth login`. Use the **`/sonarqube:sonar-integrate`** skill in Claude Code if you prefer a guided flow (install/update CLI, login, then integrate).

### Other agents (Cursor, Gemini CLI, Codex, Kiro)

Each layout includes **MCP configuration** (for example **`mcp.json`**, **`gemini-extension.json`**, or **`kiro-power/mcp.json`**) that runs the **`mcp/sonarqube`** image and **relies on SonarQube CLI** for authentication—the same **`sonar auth login`** session.

---

## Repository layout

| Agent | Location |
| ----- | -------- |
| **Claude Code** | `.claude-plugin/`, `skills/`, `claude-hooks/`, `scripts/` |
| **Cursor** | `.cursor-plugin/` (+ shared `mcp.json`) |
| **GitHub Copilot CLI** | `.github/plugin/` (+ shared `mcp.json`) |
| **Codex** | `.codex-plugin/` |
| **Gemini CLI** | `gemini-extension.json`, `GEMINI.md` |
| **Kiro** | `kiro-power/` |

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
/sonarqube:sonar-list-issues my-project --severity CRITICAL
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

| Scenario | Command |
| -------- | ------- |
| SonarQube Cloud (EU) | `sonar auth login -o <org-key>` |
| SonarQube Cloud (US) | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| SonarQube Server | `sonar auth login -s <server-url>` |

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

## Gemini CLI

**`gemini-extension.json`** and **`GEMINI.md`**. **`sonar auth login`** and **[Usage](#usage)**.

---

## Codex CLI

Plugin bundle: **`.codex-plugin/`** — catalog **`sonar`**, plugin **`sonarqube`** (see **[`.codex-plugin/plugin.json`](.codex-plugin/plugin.json)**).

1. Add **SonarSource/sonarqube-agent-plugins** as a plugin marketplace in Codex CLI:

   ```shell
   codex plugin marketplace add SonarSource/sonarqube-agent-plugins
   ```

2. Run **`sonar auth login`**.

3. Start a Codex session and install **sonarqube** from that catalog using the `/plugins` command

Same workflows as **[Usage](#usage)** once MCP is connected.

---

## Kiro

**`kiro-power/`** (`POWER.md`, MCP config). **`sonar auth login`**, then enable the power per Kiro’s documentation.

---

## License

Copyright (C) 2025-2026 SonarSource Sàrl. Licensed under [SSAL-1.0](LICENSE).

## Support

- Community: https://community.sonarsource.com/
