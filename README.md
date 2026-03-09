# SonarQube Plugin for Claude Code

Integrate SonarQube code quality and security analysis directly into your Claude Code workflow.

## Features

- **Code Analysis**: Analyze files for quality and security issues using the SonarQube MCP server
- **Issue Fixing**: Fix specific code quality issues by rule key and location
- **Issue Listing**: Search and filter issues in your SonarQube project
- **Project Discovery**: List accessible SonarQube projects to find project keys
- **Project Health**: View key metrics (coverage, duplication ...)
- **Coverage Inspection**: Find files with low coverage and pinpoint uncovered lines
- **Dependency Risks**: Search for SCA issues in project dependencies (requires SonarQube Advanced Security — Cloud Enterprise edition or Server 2025.4 Enterprise+)
- **Secrets Scanning**: Prevent secrets from being propagated to AI agents via pre-tool hooks
- **Session Check**: On startup, reports whether prerequisites are installed and configured

## Installation

### Add Plugin to Claude Code

```bash
# Local development
claude --plugin-dir ./path/to/sonarqube-claude-code-plugin
```

### Prerequisites

- **Python 3** — `python3` must be in `PATH` for the `SessionStart` hook. On Windows, the easiest way is [Python from the Microsoft Store](https://apps.microsoft.com/detail/9PJPW5LDXLZ5), which adds `python3.exe` automatically. The official python.org installer adds `python`/`py` but not `python3` by default — if that's your setup, add a `python3` alias or use the Microsoft Store version.
- **sonarqube-cli** (`sonar`) — install it yourself before running `/sonarqube:configure`:

  | Platform | Command |
  |---|---|
  | macOS / Linux | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
  | Windows (PowerShell) | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex` |

### Set Up

Once `sonarqube-cli` is installed, run the guided setup skill:

```
/sonarqube:configure
```

This will:
1. Verify `sonarqube-cli` is available
2. Authenticate with SonarQube Cloud or a self-hosted SonarQube Server via `sonar auth login` (opens browser — token stored in your system keychain, never pasted in chat)
3. Install the secrets scanning binary
4. Run `sonar integrate claude` to register hooks and the MCP server with Claude Code

## Usage

### Set Up

```
/sonarqube:configure
```

### Analyze a File

```
/sonarqube:analyze                      # analyze the file currently in context
/sonarqube:analyze src/auth/login.py   # analyze a specific file
```

### List Projects

```
/sonarqube:list-projects             # all accessible projects
/sonarqube:list-projects my-team     # search by name or key
```

### List Issues

```
/sonarqube:list-issues                              # issues in the current project
/sonarqube:list-issues my-project --severity CRITICAL --all
```

### View Project Health

```
/sonarqube:project-health
```

### Inspect Coverage

```
/sonarqube:coverage                        # worst-covered files in the current project
/sonarqube:coverage my-project --max 50   # files with coverage <= 50%
/sonarqube:coverage my-project --file src/auth/login.py  # line-by-line detail
```

### Check Dependency Risks

```
/sonarqube:dependency-risks                    # risks in the current project
/sonarqube:dependency-risks my-project --branch feature/auth
```

> Requires SonarQube Advanced Security (Cloud Enterprise edition or Server 2025.4 Enterprise+).

### Fix an Issue

```
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java:42
```

## Configuration

Run `/sonarqube:configure` — it handles everything interactively.

For reference, the connection scenarios and corresponding `sonar auth login` commands are:

| Scenario | Command |
|---|---|
| SonarQube Cloud — EU (default) | `sonar auth login -o <org-key>` |
| SonarQube Cloud — US | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| SonarQube Server | `sonar auth login -s <server-url>` |

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

## Project Structure

```
sonarqube-claude-code-plugin/
├── .claude-plugin/
│   ├── plugin.json           # Plugin manifest
│   └── marketplace.json      # Marketplace metadata
├── skills/
│   └── configure/
│       └── SKILL.md          # /sonarqube:configure guided setup wizard
├── commands/
│   ├── analyze.md            # /sonarqube:analyze
│   ├── list-projects.md      # /sonarqube:list-projects
│   ├── list-issues.md        # /sonarqube:list-issues
│   ├── project-health.md     # /sonarqube:project-health
│   ├── coverage.md           # /sonarqube:coverage
│   ├── dependency-risks.md   # /sonarqube:dependency-risks
│   └── fix-issue.md          # /sonarqube:fix-issue
├── hooks/
│   └── hooks.json            # SessionStart hook
├── scripts/
│   └── setup.py              # SessionStart: prerequisite status check
├── CHANGELOG.md
├── SECURITY.md
└── README.md
```

## Development

### Testing Locally

```bash
claude --plugin-dir .
```

## License

LGPL-3.0

## Support

- Issues: https://github.com/SonarSource/sonar-claude-code-plugin/issues
