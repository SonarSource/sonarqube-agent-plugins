<div align="center">
  <img src="./assets/logo.svg" width="120" alt="SonarQube logo" />

  # SonarQube agent plugins

  **Bring SonarQube code quality and security into every AI coding agent — one set of plugins, six agents, zero context switching.**

  [![License: SSAL-1.0](https://img.shields.io/badge/license-SSAL--1.0-blue.svg)](./LICENSE)
  [![Version](https://img.shields.io/badge/version-2.1.0-green.svg)](./.claude-plugin/plugin.json)
  [![Made by Sonar](https://img.shields.io/badge/made%20by-Sonar-orange.svg)](https://www.sonarsource.com/)
</div>

Catch bugs, vulnerabilities, hardcoded secrets, and dependency risks the moment an agent writes the code — not three commits later in CI. These plugins wire SonarQube into **Claude Code, GitHub Copilot CLI, Cursor, Codex, Gemini CLI, and Kiro** through a single MCP backend and a shared set of skills.

- 🔍 **7,000+ rules across 40+ languages** — the full SonarQube ruleset, on demand, from inside the agent.
- 🔒 **Secrets blocked before they reach the LLM** — PrePrompt and PreTool hooks (Claude Code, Copilot CLI today) intercept hardcoded credentials before the agent sends them to its model.
- 🤖 **Agentic Analysis** — automatic post-edit verification against SonarQube Cloud, surfacing only the issues *this* change introduced.
- 📊 **Quality gates, coverage, duplications, dependency risks** — the same data SonarQube serves to your CI, available to the agent during the edit.
- 🔌 **One auth, six agents** — `sonar auth login` once; every plugin reads the same OS-keychain credential.

> 🤖 **For AI agents reading this:** run `/sonarqube:sonar-integrate` to wire SonarQube into the current session. Per-agent operating guides: [`GEMINI.md`](./GEMINI.md), [`kiro-power/POWER.md`](./kiro-power/POWER.md). Each skill is documented at [`skills/<name>/SKILL.md`](./skills/) with explicit parameter resolution and tool routing rules.

## Documentation

- 📘 **SonarQube docs:** [docs.sonarsource.com](https://docs.sonarsource.com/)
- 🛠 **SonarQube CLI (the engine these plugins drive):** [cli.sonarqube.com](https://cli.sonarqube.com/) · [docs.sonarsource.com/sonarqube-cli](https://docs.sonarsource.com/sonarqube-cli/)
- 🌐 **SonarQube MCP Server:** [docs.sonarsource.com/sonarqube-mcp-server](https://docs.sonarsource.com/sonarqube-mcp-server/)

## Table of Contents

- [Who this is for](#who-this-is-for)
- [Supported agents](#supported-agents)
- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
  - [Path A — From the agent's marketplace](#path-a--from-the-agents-marketplace)
  - [Path B — From the SonarQube CLI](#path-b--from-the-sonarqube-cli)
  - [Try it](#try-it)
- [Skills reference](#skills-reference)
- [Example workflows](#example-workflows)
- [Repository layout](#repository-layout)
- [Per-agent details](#per-agent-details)
- [Security and data flow](#security-and-data-flow)
- [Rolling this out across a team](#rolling-this-out-across-a-team)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [Contributing](#contributing)
- [License](#license)

## Who this is for

These plugins target three audiences, in the same package:

1. **Individual developers** who want a quality check that runs inside the agent instead of after the PR is opened. Install one plugin, get slash commands and natural-language access to the SonarQube ruleset, coverage, and quality gates.
2. **Platform / DevEx teams** rolling SonarQube out across many engineers and many editors. Pin one CLI version, distribute one plugin per agent, get consistent rules and consistent auth flow regardless of which AI tool a team picks.
3. **Security and compliance owners** who need credentials, secrets, and source code to stay on the developer's machine — not embedded in prompts sent to LLM providers. The PrePrompt and PreTool secrets hooks are the relevant controls.

## Supported agents

| Agent | Plugin location | Install from | Secrets scanning¹ | Agentic Analysis¹ |
| --- | --- | --- | --- | --- |
| **Claude Code** | [`.claude-plugin/`](./.claude-plugin/) | [claude.com/plugins/sonarqube](https://claude.com/plugins/sonarqube) | ✅ PrePrompt + PreTool | ✅ PostTool |
| **GitHub Copilot CLI** | [`.github/plugin/`](./.github/plugin/) | [`awesome-copilot`](https://awesome-copilot.github.com/plugins/) | ✅ PreTool (PrePrompt via agent instructions) | Via agent instructions |
| **Cursor** | [`.cursor-plugin/`](./.cursor-plugin/) | MCP config; listed at [cursor.directory](https://cursor.directory/plugins/mcp-sonarqube) | — | — |
| **Codex CLI** | [`.codex-plugin/`](./.codex-plugin/) | This repo as a [Codex marketplace](https://developers.openai.com/codex/plugins) source | 🛣 PrePrompt on roadmap | — |
| **Gemini CLI** | [`gemini-extension.json`](./gemini-extension.json), [`GEMINI.md`](./GEMINI.md) | [geminicli.com extensions](https://geminicli.com/extensions/) | 🛣 On roadmap | 🛣 On roadmap |
| **Kiro** | [`kiro-power/`](./kiro-power/) | [kiro.dev/launch/powers/sonarqube](https://kiro.dev/launch/powers/sonarqube) | — | — |

¹ See [Hook types](#hook-types) for what each hook does and why the per-agent breakdown matters. The MCP server, the nine skills, and the Quick Start work in every supported agent — the columns above reflect only the *automated* secrets and Agentic Analysis hooks.

> **GitHub AgentHQ** ships as a separate plugin — [`SonarSource/sonarqube-agenthq-plugin`](https://github.com/SonarSource/sonarqube-agenthq-plugin) — because AgentHQ has different packaging requirements. PrePrompt secrets scanning is wired today; other hooks are tracked there.

## How it works

```
   ┌─────────────────────────────────────────────────────┐
   │  Your AI coding agent                               │
   │  (Claude Code, Cursor, Copilot, Codex, Gemini, ...) │
   └─────────────────────────────┬───────────────────────┘
                                 │  slash commands · natural language · MCP tool calls
                                 ▼
   ┌─────────────────────────────────────────────────────┐
   │  Skills  ──  skills/sonar-*                         │
   │  Nine agent-agnostic playbooks (this repo)          │
   └─────────────────────────────┬───────────────────────┘
                                 │
                                 ▼
   ┌─────────────────────────────────────────────────────┐
   │  SonarQube CLI  ──  `sonar run mcp`, `sonar auth`,  │
   │  secrets + Agentic Analysis hooks                   │
   └─────────────────────────────┬───────────────────────┘
                                 │  HTTPS · token from OS keychain
                                 ▼
   ┌─────────────────────────────────────────────────────┐
   │  SonarQube Cloud / Server / Community Build         │
   │  7,000+ rules, quality gates, project history       │
   └─────────────────────────────────────────────────────┘
```

The **SonarQube CLI** is the central component. It runs the MCP server, manages authentication, and installs the per-agent hooks. The plugins in this repository are thin wrappers — agent-specific manifests on top of one shared backend, which is why a single `sonar auth login` works for every agent and why upgrading the CLI rolls a fix out to all of them at once.

## Prerequisites

- **A SonarQube account.** [SonarQube Cloud](https://sonarcloud.io) (EU or US region), self-hosted **SonarQube Server**, or **SonarQube Community Build**. Some features (Agentic Analysis, Advanced Security / SCA) require Cloud or a specific Server edition.
- **The [SonarQube CLI](https://cli.sonarqube.com/)** (`sonar`) ends up on your `PATH` either way — Path A installs it for you via the bootstrap skill, Path B installs it as the first step. You don't need to install it yourself before getting started.
- **A container runtime** (Docker, Podman, or Nerdctl) for the SonarQube MCP server. The CLI selects an available runtime automatically.
- **Node.js** — only for Claude Code, for the SessionStart hook (`scripts/setup.js`).

## Quick start

There are two genuinely independent installation paths — pick the one that matches where you're sitting right now:

- **Path A — Marketplace-first.** You're already inside the agent (or one click away from it). Install the SonarQube plugin from the agent's plugin catalog, then run `/sonarqube:sonar-integrate` inside the agent. The skill installs the SonarQube CLI for you if it's missing, walks you through `sonar auth login`, and wires the hooks. You never leave the agent.
- **Path B — CLI-first.** You're in a terminal. Install the SonarQube CLI, `sonar auth login`, then `sonar integrate <agent>`. One terminal session, plugin and hooks both wired.

Both paths land at the same place: skills available as `/sonarqube:*` commands, MCP tools, and any hooks the agent supports. Path B is also handy for scripted rollouts across many machines.

### Path A — From the agent's marketplace

**Step 1: Install the plugin in your agent.** Pick the snippet that matches:

#### Claude Code

Anthropic's official plugin marketplace ([`claude-plugins-official`](https://github.com/anthropics/claude-plugins-official)) — plugin listing: **[claude.com/plugins/sonarqube](https://claude.com/plugins/sonarqube)**:

```text
/plugin install sonarqube@claude-plugins-official
```

Background: [Claude Code's plugin docs](https://code.claude.com/docs/en/plugins).

#### GitHub Copilot CLI

SonarQube is published to the default **[`awesome-copilot`](https://awesome-copilot.github.com/plugins/)** marketplace ([source repo](https://github.com/github/awesome-copilot)) — no `marketplace add` step needed:

```text
/plugin install sonarqube@awesome-copilot
```

Alternative: register this repo directly as a [Copilot CLI plugin marketplace](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace):

```text
/plugin marketplace add SonarSource/sonarqube-agent-plugins
/plugin install sonarqube@sonar
```

Background: GitHub's docs on [finding and installing Copilot CLI plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing).

#### Cursor

Cursor reads MCP configuration directly — copy the `mcpServers` block from [`mcp.json`](./mcp.json) into Cursor's MCP settings (or point Cursor at this file). See [Cursor's plugin docs](https://cursor.com/docs/plugins). Also listed in the community [Cursor Directory](https://cursor.directory/plugins/mcp-sonarqube).

#### Codex CLI

Register this repo as a [Codex plugin marketplace](https://developers.openai.com/codex/plugins) (catalog also at [github.com/openai/plugins](https://github.com/openai/plugins)):

```bash
codex plugin marketplace add SonarSource/sonarqube-agent-plugins
```

Inside a Codex session, run `/plugins` and install **sonarqube** from the **sonar** catalog.

#### Gemini CLI

Install [`gemini-extension.json`](./gemini-extension.json) as a [Gemini CLI extension](https://geminicli.com/docs/extensions/) — typically via `gemini extensions install` pointed at this repository. See [`GEMINI.md`](./GEMINI.md) for supported flows, parameter resolution, and the MCP tools Gemini can call.

#### Kiro

One-click install from the SonarQube Power page: **[kiro.dev/launch/powers/sonarqube](https://kiro.dev/launch/powers/sonarqube)** (requires Kiro IDE 0.7+). Also listed in the [Kiro Powers marketplace](https://kiro.dev/powers/) — see [installation docs](https://kiro.dev/docs/powers/installation/) for importing from a GitHub URL.

---

**Step 2: Bootstrap with `/sonarqube:sonar-integrate`.** Inside the agent, run:

```text
/sonarqube:sonar-integrate
```

The skill will:

1. Check whether the SonarQube CLI is on your `PATH`. If not, it prompts you, then installs it (`curl … | bash` on macOS/Linux, `irm … | iex` on Windows). If found, it self-updates.
2. Walk you through `sonar auth login` — browser flow, token stored in the OS keychain.
3. Wire the available hooks for the current agent (`sonar integrate claude` / `sonar integrate copilot` under the hood). For Cursor, Codex, and Gemini CLI, it confirms MCP is ready instead.

That's it — the agent now has skills, MCP tools, and whichever hooks your agent supports. For agents where slash commands aren't exposed (Kiro today, AgentHQ), follow Path B steps B1 and B2 to install the CLI and authenticate manually.

### Path B — From the SonarQube CLI

#### B1. Install the SonarQube CLI

**macOS / Linux:**

```bash
curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 | iex
```

Verify (you may need to restart your terminal so `PATH` reloads):

```bash
sonar --version
```

#### B2. Authenticate

Browser-based login (token stored in the OS keychain — macOS Keychain, Windows Credential Manager, Secret Service on Linux):

| Scenario | Command |
| --- | --- |
| SonarQube Cloud (EU, default) | `sonar auth login -o <org-key>` |
| SonarQube Cloud (US) | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| Self-hosted SonarQube Server | `sonar auth login -s https://sonar.mycompany.com` |

Verify with `sonar auth status`. For unattended use (CI, automation, AI agent containers), pass a token through environment variables instead — see the [SonarQube CLI docs](https://docs.sonarsource.com/sonarqube-cli/).

#### B3. Integrate with your agent

```bash
sonar integrate claude       # Claude Code
sonar integrate copilot      # GitHub Copilot CLI
# sonar integrate codex      # on the roadmap
# sonar integrate gemini     # on the roadmap
```

One command installs the plugin and wires every available hook for that agent (PrePrompt secrets, PreTool secrets, PostTool Agentic Analysis where supported). The command is idempotent — safe to re-run after a Path A install to add hook coverage.

For **Cursor**, **Kiro**, and **GitHub AgentHQ**, `sonar integrate` doesn't apply yet — use Path A for those agents (B1 and B2 still give you the CLI and authentication you'll need).

### Try it

In any supported agent, after the plugin is loaded:

```text
"List my SonarQube projects."
"Show critical issues in my-org_my-app on the main branch."
"What is the test coverage of src/auth/login.py?"
"Fix typescript:S3776 in code/preview.tsx:17."

/sonarqube:sonar-quality-gate my-org_my-app
/sonarqube:sonar-list-issues my-org_my-app --severity CRITICAL
```

With Agentic Analysis enabled, verification runs automatically after each edit — no manual invocation required.

## Skills reference

The nine skills are agent-agnostic playbooks in `skills/<name>/SKILL.md`. Where the agent exposes plugin skills as slash commands (Claude Code today, with Copilot CLI and others on the way as their plugin models mature), they appear as `/sonarqube:*` commands. In agents that don't yet expose skills directly, the same workflows are accessible through natural-language prompts and the SonarQube MCP tools.

| Skill | Purpose | Example |
| --- | --- | --- |
| [`sonar-integrate`](./skills/sonar-integrate/SKILL.md) | Install / update the CLI, authenticate, and wire MCP + hooks for the current agent. | `/sonarqube:sonar-integrate` |
| [`sonar-list-projects`](./skills/sonar-list-projects/SKILL.md) | Discover project keys accessible to your token. | `/sonarqube:sonar-list-projects my-team` |
| [`sonar-list-issues`](./skills/sonar-list-issues/SKILL.md) | Filter issues by severity, type, status, rule, tag, component, branch, or PR. | `/sonarqube:sonar-list-issues my-app --severity CRITICAL` |
| [`sonar-fix-issue`](./skills/sonar-fix-issue/SKILL.md) | Apply a minimal fix for a specific issue, given rule key and location. | `/sonarqube:sonar-fix-issue python:S2077 src/login.py:34` |
| [`sonar-quality-gate`](./skills/sonar-quality-gate/SKILL.md) | Report overall pass/fail and per-condition results (metric, threshold, actual). | `/sonarqube:sonar-quality-gate my-app --branch main` |
| [`sonar-analyze`](./skills/sonar-analyze/SKILL.md) | Analyze a file or snippet via MCP — Agentic Analysis where available, snippet fallback otherwise. | `/sonarqube:sonar-analyze src/auth/login.py` |
| [`sonar-coverage`](./skills/sonar-coverage/SKILL.md) | Find worst-covered files and inspect uncovered or partially-covered lines. | `/sonarqube:sonar-coverage my-app --max 50` |
| [`sonar-duplication`](./skills/sonar-duplication/SKILL.md) | List duplicated files; drill into duplication blocks for a file. | `/sonarqube:sonar-duplication my-app --pr 42` |
| [`sonar-dependency-risks`](./skills/sonar-dependency-risks/SKILL.md) | Search SCA dependency risks (requires Advanced Security). | `/sonarqube:sonar-dependency-risks my-app --branch release-1.0` |

Most skills accept either a positional project key or fall back to one resolved from `sonar-project.properties`, `.sonarlint/connectedMode.json`, or the active MCP session — say "the project" in plain English and it will figure out which one you mean. For questions that don't fit a skill (rule explanations, ad-hoc metric lookups), agents can call the SonarQube MCP tools directly — see [`GEMINI.md`](./GEMINI.md) for the canonical patterns.

## Example workflows

### Fix a quality-gate failure before merging

> *Developer:* "Why is the quality gate failing on PR 42?"
>
> Agent runs `sonar-quality-gate ... --pr 42`, reads the failing conditions, then `sonar-list-issues ... --pr 42 --severity CRITICAL` for the offending issues. For each: `sonar-fix-issue <rule> <file>:<line>`. Re-run the gate once the agent's edits are committed.

### Catch a hardcoded secret before it reaches the LLM

> An agent is about to send a file containing `sk_live_...` to its model. With Claude Code or Copilot CLI integration installed, the **PreTool secrets hook** runs `sonar analyze secrets` locally, exits with code `51`, blocks the tool call, and surfaces the finding. The credential never leaves the machine.

### Tighten coverage on the riskiest files

> *Developer:* "Which files in my-app have the worst coverage?"
>
> `sonar-coverage --max 30` returns the lowest-covered files; the agent then drills into the uncovered lines of `src/billing/chargeCard.ts:87–102` and writes the missing tests.

### Audit dependency risks ahead of a release cut

> *Developer:* "Are there any dependency risks blocking the release branch?"
>
> `sonar-dependency-risks my-app --branch release-1.42` returns CVEs grouped by severity, with affected releases. The agent proposes upgrades and opens a follow-up issue for ones requiring manual review.

## Repository layout

| Path | Purpose |
| --- | --- |
| [`.claude-plugin/`](./.claude-plugin/) | Claude Code plugin manifest and marketplace declaration |
| [`.codex-plugin/`](./.codex-plugin/) | Codex CLI plugin manifest |
| [`.cursor-plugin/`](./.cursor-plugin/) | Cursor plugin manifest |
| [`.github/plugin/`](./.github/plugin/) | GitHub Copilot CLI plugin + marketplace |
| [`.agents/plugins/`](./.agents/plugins/) | Cross-agent marketplace catalog |
| [`gemini-extension.json`](./gemini-extension.json), [`GEMINI.md`](./GEMINI.md) | Gemini CLI extension and operating guide |
| [`kiro-power/`](./kiro-power/) | Kiro Power (`POWER.md` + MCP config) |
| [`skills/`](./skills/) | The nine agent-agnostic skill playbooks |
| [`claude-hooks/`](./claude-hooks/) | Claude Code SessionStart hook |
| [`scripts/setup.js`](./scripts/setup.js) | Status check executed by the SessionStart hook |
| [`mcp.json`](./mcp.json) | Shared MCP config — runs `sonar run mcp` |
| [`assets/`](./assets/) | Logos (PNG / SVG) |
| [`SECURITY.md`](./SECURITY.md) | Responsible disclosure policy |
| [`LICENSE`](./LICENSE) | SSAL-1.0 license text |

## Per-agent details

### Claude Code

Plugin: [`.claude-plugin/`](./.claude-plugin/). Marketplace: **[`claude-plugins-official`](https://github.com/anthropics/claude-plugins-official)** — Anthropic's official catalog. Plugin listing: **[claude.com/plugins/sonarqube](https://claude.com/plugins/sonarqube)**.

Beyond the skills, the Claude Code plugin installs a **SessionStart hook** ([`claude-hooks/hooks.json`](./claude-hooks/hooks.json) → [`scripts/setup.js`](./scripts/setup.js)) that reports CLI presence, authentication status, and any registered hooks (Secrets Detection, Agentic Analysis) when a session starts. The hook reports state; it does not install anything itself — run `sonar integrate claude` or `/sonarqube:sonar-integrate` for that.

Optional: place a [`sonar-project.properties`](https://docs.sonarsource.com/sonarqube-server/latest/analyzing-source-code/analysis-parameters/) at the repo root with `sonar.projectKey` so every skill can pick the key up automatically.

### GitHub Copilot CLI

Plugin: [`.github/plugin/`](./.github/plugin/) (catalog `sonar`, plugin `sonarqube`; see [`marketplace.json`](./.github/plugin/marketplace.json)). The plugin is published to the default **[`awesome-copilot`](https://awesome-copilot.github.com/plugins/)** marketplace (so it installs without an extra `marketplace add` step), and this repository also acts as a self-contained [Copilot CLI plugin marketplace](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace) if you prefer pulling directly from source — see the snippets in [§ Quick start](#quick-start). After install, run `sonar integrate copilot` to wire MCP + secrets / Agentic Analysis hooks. Reference: [About Copilot CLI plugins](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-cli-plugins).

### Cursor

Plugin: [`.cursor-plugin/`](./.cursor-plugin/) with MCP config in the shared [`mcp.json`](./mcp.json). Today, Cursor reads MCP servers directly from its settings ([Cursor plugin docs](https://cursor.com/docs/plugins)) — no marketplace install step is required. The plugin is also discoverable in the community [Cursor Directory at cursor.directory/plugins/mcp-sonarqube](https://cursor.directory/plugins/mcp-sonarqube). Distribution through the official [Cursor Marketplace](https://cursor.com/marketplace) is on the roadmap as the plugin model stabilizes. Credentials come from the CLI's `sonar auth login` session.

### Codex CLI

Plugin: [`.codex-plugin/`](./.codex-plugin/), exposed through the cross-agent marketplace catalog at [`.agents/plugins/marketplace.json`](./.agents/plugins/marketplace.json) (catalog `sonar`, plugin `sonarqube`). Install via the marketplace command in [§ Quick start](#quick-start), then use `/plugins` inside a Codex session to enable it. Reference: [Codex plugin docs](https://developers.openai.com/codex/plugins).

### Gemini CLI

Extension: [`gemini-extension.json`](./gemini-extension.json), plus the operational guide in [`GEMINI.md`](./GEMINI.md). Install it with `gemini extensions install` pointed at this repository — see the [Gemini CLI extensions docs](https://geminicli.com/docs/extensions/) and the [extension reference](https://geminicli.com/docs/extensions/reference/). [`GEMINI.md`](./GEMINI.md) is the canonical reference for parameter resolution (how a project key flows from IDE context → `.sonarlint/connectedMode.json` → `sonar-project.properties` → CI variables → user prompt → `sonar-list-projects`) and for the MCP tools Gemini can call when no skill applies.

### Kiro

Power: [`kiro-power/`](./kiro-power/) — the Power manifest is at [`POWER.md`](./kiro-power/POWER.md) with MCP config in [`kiro-power/mcp.json`](./kiro-power/mcp.json). One-click install: **[kiro.dev/launch/powers/sonarqube](https://kiro.dev/launch/powers/sonarqube)** (requires Kiro IDE 0.7+). The power is also listed in the [Kiro Powers marketplace](https://kiro.dev/powers/); see [installation docs](https://kiro.dev/docs/powers/installation/) for importing from a public GitHub URL as an alternative. The Power doc covers Kiro-specific advanced controls (selective toolset enablement via `sonar run mcp --toolsets ...`, read-only mode) and reference workflows.

## Security and data flow

This repository ships **configuration**, not analyzers. Where work happens:

1. **Locally**, through the SonarQube CLI binary — `sonar run mcp`, the secrets scanner (`sonar analyze secrets`), and `sonar verify` against your working tree. Source code stays on your machine.
2. **Against your SonarQube instance**, when an agent queries project state (issues, coverage, quality gates, dependency risks). The platform returns metadata about previously-analyzed code; it does not ingest your local working directory.

**Authentication.** `sonar auth login` writes a user token to the OS keychain. The MCP server and skills read from the keychain at runtime — no token is written into config files in this repository, and no token is passed on the command line (where it would be visible to `ps`). For unattended environments, set `SONARQUBE_CLI_TOKEN` plus `SONARQUBE_CLI_ORG` (Cloud) or `SONARQUBE_CLI_SERVER` (self-hosted); see the [SonarQube CLI docs](https://docs.sonarsource.com/sonarqube-cli/).

### Hook types

The agent integrations can install up to three hook points; which ones are wired natively depends on the agent (see [Supported agents](#supported-agents) for the matrix).

- **PrePrompt secrets hook** — scans content *before* the agent assembles and sends the prompt to the model. The earliest intercept point: catches credentials in pasted snippets, file contents being summarized, or anything the user types into the chat.
- **PreTool secrets hook** — scans *before* a tool call would send source code to the model (file reads, edit previews, MCP tool inputs). Either secrets hook runs `sonar analyze secrets` and rejects the call with exit code `51` if anything matches — the LLM never sees the payload.
- **PostTool Agentic Analysis hook** — *after* an agent edits a file, automatically runs SonarQube Cloud's Agentic Analysis on the diff. Only new issues introduced by *this* change are reported back, so the agent gets change-scoped feedback without re-running CI.

Where an agent doesn't expose the hook surface natively, the same protections can be approximated by adding the equivalent instructions to the agent's system prompt — useful as a stopgap, but lower assurance than a hook that the runtime enforces.

**Telemetry.** The CLI ships anonymous usage telemetry, on by default with a single opt-out toggle — run `sonar config telemetry --disabled` to turn it off, and see the [SonarQube CLI docs](https://docs.sonarsource.com/sonarqube-cli/) for details. This repository contains no runtime code that phones home; it is only configuration consumed by the agent and the CLI.

**Vulnerabilities** in any Sonar product, including these plugins, should be reported privately to **security@sonarsource.com** — see [SECURITY.md](./SECURITY.md).

## Rolling this out across a team

A few things worth knowing if you're pushing this out beyond your own laptop:

- **The CLI and the plugins move together.** Plugin `2.1.0` is built against a specific [SonarQube CLI](https://cli.sonarqube.com/) release. Pick the CLI version your team has validated; the matching plugin version goes with it. Treat them as one unit when you upgrade.
- **Pick a rollout pattern that matches your scale.** A solo developer installs the CLI and one plugin and is done. A repo commits `sonar-project.properties` so every contributor's agent picks up the project key automatically. Org-wide, ship the CLI binary and the agent plugin through whatever distribution channel you already trust — managed install, internal package registry, MDM — and let Renovate keep this repo's dependencies fresh on the way through.
- **Self-hosted and air-gapped work the same way.** `sonar auth login -s https://sonar.mycompany.com` and you're done. The MCP server only talks to the SonarQube instance you point it at — no SonarSource SaaS dependency, no surprise outbound calls. Tokens stay in the OS keychain.

Anything more lawyerly — what the SSAL-1.0 license actually says, who to contact for vulnerabilities — lives in [License](#license) and [SECURITY.md](./SECURITY.md). We tried to keep this section free of it.

## Troubleshooting

### `sonar: command not found` after installation

Restart your terminal so `PATH` reloads. On Linux/macOS, ensure your shell rc includes `export PATH="$HOME/.local/share/sonarqube-cli/bin:$PATH"`. Full guidance: [SonarQube CLI installation docs](https://docs.sonarsource.com/sonarqube-cli/).

### MCP doesn't start, or the agent shows no SonarQube tools

1. Run `sonar auth status` — confirm `[✓ Connected]`.
2. Re-run `/sonarqube:sonar-integrate` (Claude Code, Copilot CLI) or `sonar integrate <agent>` to re-wire MCP and hooks.
3. Confirm the agent is configured to load the relevant MCP file ([`mcp.json`](./mcp.json), [`gemini-extension.json`](./gemini-extension.json), or [`kiro-power/mcp.json`](./kiro-power/mcp.json)).
4. Container runtime missing? Install Docker, Podman, or Nerdctl — the MCP server image needs one of them.

### A skill says it can't find the project key

Pass it explicitly: `/sonarqube:sonar-list-issues my-org_my-app`. The skill can also pick the key up from `sonar-project.properties` or `.sonarlint/connectedMode.json` in the working directory — see [`GEMINI.md`](./GEMINI.md) for the full resolution order.

### PreTool secrets hook blocked a legitimate file

Treat it as a real finding first — re-run `sonar analyze secrets <file>` and read what matched. If the value is genuinely fixture/test data, swap it for an obviously fake pattern (e.g. `dummy-token-12345`); secrets scanning is intentionally tuned for recall.

### Hooks not installed for Claude Code

The SessionStart hook only *reports* what is installed; it does not install anything. Run `sonar integrate claude` (or `/sonarqube:sonar-integrate`) to install the secrets and Agentic Analysis hooks.

For deeper CLI-side troubleshooting (install, auth, git hook permissions): see the [SonarQube CLI docs](https://docs.sonarsource.com/sonarqube-cli/).

## Support

- **Community forum:** [community.sonarsource.com](https://community.sonarsource.com/) — peer support, feature ideas, public Q&A.
- **Customers with a support contract:** use your standard Sonar support channel.
- **Security:** [security@sonarsource.com](mailto:security@sonarsource.com) — see [SECURITY.md](./SECURITY.md).
- **Bug reports for this repository:** [GitHub issues](https://github.com/SonarSource/sonarqube-agent-plugins/issues).

## Contributing

We are not actively soliciting feature contributions — the plugin surface tracks Sonar's product roadmap and our quality bar is tight. Cosmetic fixes (typos, broken links, README polish) are welcome via PR. For anything larger, open an issue first so we can confirm the direction before you invest time.

## License

Copyright © 2025–2026 SonarSource Sàrl. Released under the [Sonar Source-Available License v1.0 (SSAL-1.0)](./LICENSE).

The plugins in this repository are **source-available**, not OSI open-source. Read the [LICENSE](./LICENSE) before redistribution, vendoring, or commercial integration.
