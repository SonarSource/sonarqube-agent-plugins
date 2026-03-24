# SonarQube agent integrations

This repository bundles SonarQube integrations for more than one assistant product. **The rest of this README documents the Claude Code plugin** (where most iterative fixes land right now). Other surfaces live alongside it:

| Surface | Location | Notes |
|--------|----------|--------|
| **Claude Code** | `.claude-plugin/`, `commands/`, `skills/integrate/`, `hooks/`, `scripts/` | Slash commands, `/sonarqube:integrate` skill, SessionStart check; MCP and secrets-scanning hooks are registered by **sonarqube-cli** (`sonar integrate claude`) |
| **Gemini** | `gemini-extension.json`, `GEMINI.md` | Gemini extension + MCP user context |
| **Kiro** | `kiro-power/` | Power definition and `mcp.json` for Kiro |

Integrate SonarQube code quality and security analysis into your **Claude Code** workflow using the sections below.

**MCP server registration and secrets-scanning hooks** for Claude Code are installed on your machine by **sonarqube-cli** when you run `sonar integrate claude` during setup.

## Features

- **Issue fixing**: Fix specific code quality issues by rule key and location (CLI)
- **Issue listing**: Search and filter issues in your SonarQube project (CLI)
- **Project discovery**: List accessible SonarQube projects to find project keys (CLI)
- **Project health, coverage, snippet analysis, dependency risks**: Slash commands that call the SonarQube MCP server (available after `sonar integrate claude`)
- **Secrets scanning**: Pre-tool **secrets-scanning hooks** registered by the CLI via `sonar integrate claude` to limit secret exposure to the agent
- **Session check**: On startup, reports whether sonarqube-cli is present and integration is configured

## Installation

### Add Plugin to Claude Code

```bash
# Local development
claude --plugin-dir ./path/to/sonarqube-claude-code-plugin
```

### Prerequisites

- **Node.js** — required to run the `SessionStart` hook (`scripts/setup.js`).
- **sonarqube-cli** (`sonar`) — install it yourself before running `/sonarqube:integrate`:

  | Platform              | Command                                                                                                                    |
  |---------------------- |----------------------------------------------------------------------------------------------------------------------------|
  | macOS / Linux         | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash`   |
  | Windows (PowerShell)  | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`        |

### Set Up

Once `sonarqube-cli` is installed, run the guided setup skill:

```
/sonarqube:integrate
```

This will:
1. Verify `sonarqube-cli` is available (and run `sonar self-update` when the CLI is present)
2. Authenticate with SonarQube Cloud or a self-hosted SonarQube Server via `sonar auth login` (opens browser — token stored in your system keychain, never pasted in chat)
3. Run `sonar integrate claude` to register the SonarQube MCP server, secrets-scanning hooks, and other Claude Code integration on your machine (the plugin bundle in this repo does not ship an `.mcp.json`; the SonarQube CLI writes the config Claude Code loads)

## Usage

### Set Up

```
/sonarqube:integrate
```

### List Projects (CLI)

```
/sonarqube:list-projects             # all accessible projects
/sonarqube:list-projects my-team     # search by name or key
```

### List Issues (CLI)

```
/sonarqube:list-issues                              # issues in the current project
/sonarqube:list-issues my-project --severity CRITICAL
```

### Fix an Issue

```
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java
/sonarqube:fix-issue python:S2077 src/auth/login.py:34
```

### Project Health (MCP)

```
/sonarqube:project-health
/sonarqube:project-health my-project --branch main
```

### Analyze a File (MCP)

```
/sonarqube:analyze
/sonarqube:analyze src/auth/login.py
```

### Coverage (MCP)

```
/sonarqube:coverage
/sonarqube:coverage my-project --max 50
/sonarqube:coverage my-project --file src/auth/login.py
```

### Dependency Risks (MCP, Advanced Security)

```
/sonarqube:dependency-risks
/sonarqube:dependency-risks my-project --pr 42
```

## Configuration

Run `/sonarqube:integrate` — it handles everything interactively.

For reference, the connection scenarios and corresponding `sonar auth login` commands are:

| Scenario                        | Command                                                   |
|---------------------------------|-----------------------------------------------------------|
| SonarQube Cloud — EU (default)  | `sonar auth login -o <org-key>`                           |
| SonarQube Cloud — US            | `sonar auth login -o <org-key> -s https://sonarqube.us`   |
| SonarQube Server                | `sonar auth login -s <server-url>`                        |

Credentials are stored in your system keychain. You can verify the current auth status with:

```bash
sonar auth status
```

### Optional: sonar-project.properties

Create a `sonar-project.properties` file in your project root to set a project key for analysis:

```properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0
sonar.sources=src
sonar.sourceEncoding=UTF-8
```

## Development

### Testing Locally

```bash
claude --plugin-dir .
```

## License

Copyright (C) 2025-2026 SonarSource Sàrl. Licensed under [SSAL-1.0](LICENSE).

## Support

- Issues: https://community.sonarsource.com/
