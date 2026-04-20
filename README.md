# SonarQube agent integrations

This repository bundles SonarQube-related plugins and configuration for AI agents:

| Surface         | Location                                                    | Notes                                                                                                                                                           |
| --------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code** | `.claude-plugin/`, `skills/`, `claude-hooks/`, `scripts/`          | Skills, SessionStart check; MCP and secrets-scanning hooks are registered by **sonarqube-cli** (`sonar integrate claude`) |
| **Gemini**      | `gemini-extension.json`, `GEMINI.md`                        | Gemini extension + MCP user context                                                                                                                             |
| **Kiro**        | `kiro-power/`                                               | Power definition and `mcp.json` for Kiro                                                                                                                        |

- **Claude Code** — full setup, skills, and configuration: [Claude Code plugin](#claude-code-plugin).
- **Gemini** and **Kiro** — see the paths in the table above;

---

## Claude Code plugin

Integrate SonarQube code quality and security analysis into **Claude Code**: skills (in `skills/`), and a startup check for the CLI and wiring.

**MCP server registration and secrets-scanning hooks** are installed on your machine by **sonarqube-cli** when you run `sonar integrate claude` during setup (the plugin bundle does not ship an `.mcp.json`; the CLI writes the config Claude Code loads).

### Features

- **Issue fixing**: Fix specific code quality issues by rule key and location (CLI)
- **Issue listing**: Search and filter issues in your SonarQube project (CLI)
- **Project discovery**: List accessible SonarQube projects to find project keys (CLI)
- **Quality gate, coverage, duplication, snippet analysis, dependency risks**: Skills that call the SonarQube MCP Server (available after `sonar integrate claude`)
- **Secrets scanning**: Pre-tool **secrets-scanning hooks** registered by the CLI via `sonar integrate claude` to limit secret exposure to the agent
- **Session check**: On startup, reports whether sonarqube-cli is present and integration is configured

### Installation

#### Add the marketplace and install the plugin

In Claude Code, register this repository as a plugin marketplace, install the **sonarqube** plugin, then reload:

```shell
/plugin marketplace add SonarSource/sonarqube-agent-plugins
/plugin install sonarqube@sonar
```

Then start a new Claude Code session (or otherwise reload the session) so the plugin loads.

The catalog name `sonar` comes from `.claude-plugin/marketplace.json`; the plugin id `sonarqube` comes from `.claude-plugin/plugin.json`. Alternatively, run `/plugin`, open the **Discover** tab, and install **sonarqube** from the Sonar marketplace interactively (pick user, project, or local [scope](https://code.claude.com/en/settings#configuration-scopes) as needed).

From a system terminal you can use the same ids (optional `--scope`):

```shell
claude plugin install sonarqube@sonar
```

#### Prerequisites

- **Node.js** — required to run the `SessionStart` hook (`scripts/setup.js`).
- **sonarqube-cli** (`sonar`) — install it yourself before running `/sonarqube:integrate`. Agent will also guide you through the installation process:

  | Platform             | Command                                                                                                                  |
  | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
  | macOS / Linux        | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
  | Windows (PowerShell) | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`      |

#### Finish setup with `/sonarqube:integrate`

Once `sonarqube-cli` is installed, run the guided setup skill:

```
/sonarqube:integrate
```

This will:

1. Verify `sonarqube-cli` is available (and run `sonar self-update` when the CLI is present)
2. Authenticate with SonarQube Cloud or a self-hosted SonarQube Server via `sonar auth login` (opens browser — token stored in your system keychain, never pasted in chat)
3. Run `sonar integrate claude` to register the SonarQube MCP Server, secrets-scanning hooks, and other Claude Code integration on your machine

### Usage

#### Set Up

```
/sonarqube:integrate
```

#### List Projects (CLI)

```
/sonarqube:list-projects             # all accessible projects
/sonarqube:list-projects my-team     # search by name or key
```

#### List Issues (CLI)

```
/sonarqube:list-issues                              # issues in the current project
/sonarqube:list-issues my-project --severity CRITICAL
```

#### Fix an Issue

```
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java
/sonarqube:fix-issue python:S2077 src/auth/login.py:34
```

#### Quality gate (MCP)

```
/sonarqube:quality-gate
/sonarqube:quality-gate my-project --branch main
```

#### Analyze a File (MCP)

```
/sonarqube:analyze
/sonarqube:analyze src/auth/login.py
```

#### Coverage (MCP)

```
/sonarqube:coverage
/sonarqube:coverage my-project --max 50
/sonarqube:coverage my-project --file src/auth/login.py
```

#### Duplication (MCP)

```
/sonarqube:duplication
/sonarqube:duplication my-project --pr 42
/sonarqube:duplication my-project --file src/auth/login.py
```

#### Dependency Risks (MCP, Advanced Security)

```
/sonarqube:dependency-risks
/sonarqube:dependency-risks my-project --pr 42
```

### Configuration

Run `/sonarqube:integrate` — it handles everything interactively.

For reference, the connection scenarios and corresponding `sonar auth login` commands are:

| Scenario                       | Command                                                 |
| ------------------------------ | ------------------------------------------------------- |
| SonarQube Cloud — EU (default) | `sonar auth login -o <org-key>`                         |
| SonarQube Cloud — US           | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| SonarQube Server               | `sonar auth login -s <server-url>`                      |

Credentials are stored in your system keychain. You can verify the current auth status with:

```bash
sonar auth status
```

#### Optional: sonar-project.properties

Create a `sonar-project.properties` file in your project root to set a project key for analysis:

```properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0
sonar.sources=src
sonar.sourceEncoding=UTF-8
```

#### Local development (`--plugin-dir`)

```bash
# From a clone of this repository
claude --plugin-dir .

# Or pass the path explicitly
claude --plugin-dir ./path/to/sonarqube-agent-plugins
```

---

## License

Copyright (C) 2025-2026 SonarSource Sàrl. Licensed under [SSAL-1.0](LICENSE).

## Support

- Issues: https://community.sonarsource.com/
