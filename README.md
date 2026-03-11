# SonarQube Plugin for Claude Code

Integrate SonarQube code quality and security analysis directly into your Claude Code workflow.

## Features

- **Issue Fixing**: Fix specific code quality issues by rule key and location
- **Issue Listing**: Search and filter issues in your SonarQube project
- **Project Discovery**: List accessible SonarQube projects to find project keys
- **Secrets Scanning**: Prevent secrets from being propagated to AI agents via pre-tool hooks
- **Session Check**: On startup, reports whether prerequisites are installed and configured

## Installation

### Add Plugin to Claude Code

```bash
# Local development
claude --plugin-dir ./path/to/sonarqube-claude-code-plugin
```

### Prerequisites

- **Node.js** — required to run the `SessionStart` hook (`scripts/setup.js`).
- **sonarqube-cli** (`sonar`) — install it yourself before running `/sonarqube:configure`:

  | Platform              | Command                                                                                                                    |
  |---------------------- |----------------------------------------------------------------------------------------------------------------------------|
  | macOS / Linux         | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash`   |
  | Windows (PowerShell)  | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex`        |

### Set Up

Once `sonarqube-cli` is installed, run the guided setup skill:

```
/sonarqube:configure
```

This will:
1. Verify `sonarqube-cli` is available
2. Authenticate with SonarQube Cloud or a self-hosted SonarQube Server via `sonar auth login` (opens browser — token stored in your system keychain, never pasted in chat)
3. Install the secrets scanning binary
4. Run `sonar integrate claude` to register secrets hooks with Claude Code

## Usage

### Set Up

```
/sonarqube:configure
```

### List Projects

```
/sonarqube:list-projects             # all accessible projects
/sonarqube:list-projects my-team     # search by name or key
```

### List Issues

```
/sonarqube:list-issues                              # issues in the current project
/sonarqube:list-issues my-project --severity CRITICAL
```

### Fix an Issue

```
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java
/sonarqube:fix-issue python:S2077 src/auth/login.py:34
```

## Configuration

Run `/sonarqube:configure` — it handles everything interactively.

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

## Support

- Issues: https://community.sonarsource.com/
