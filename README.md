# SonarQube Plugin for Claude Code

Integrate SonarQube code quality and security analysis directly into your Claude Code workflow.

## Features

- **Code Analysis**: Analyze files for quality and security issues using the SonarQube MCP server
- **Issue Fixing**: Fix specific code quality issues by rule key and location
- **Rule Explanation**: Get detailed explanations of SonarQube rules
- **Issue Listing**: Search and filter issues in your SonarQube project
- **Project Health**: View key metrics (coverage, duplication ...)
- **Secrets Scanning**: Prevent secrets from being propagated to AI agents via pre-tool hooks
- **Session Check**: On startup, reports whether prerequisites are installed and configured

## Installation

### Add Plugin to Claude Code

```bash
# Local development
claude --plugin-dir ./path/to/sonarqube-claude-code-plugin
```

### Prerequisites

- **Python 3** — required for the `SessionStart` hook (`python3` or `py` must be in `PATH`)
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

### List Issues

```
/sonarqube:list-issues
```

### View Project Health

```
/sonarqube:project-health
```

### Fix an Issue

```
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java:42
```

### Explain a Rule

```
/sonarqube:explain-rule java:S1481
/sonarqube:explain-rule unused local variables
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
│   ├── list-issues.md        # /sonarqube:list-issues
│   ├── project-health.md     # /sonarqube:project-health
│   ├── fix-issue.md          # /sonarqube:fix-issue
│   └── explain-rule.md       # /sonarqube:explain-rule
├── hooks/
│   └── hooks.json            # SessionStart hook
├── scripts/
│   ├── run-hook              # Hook launcher
│   ├── setup.py              # SessionStart: prerequisite status check
│   └── _common.py            # Shared utilities
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
