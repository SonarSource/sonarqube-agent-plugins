# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0]

### Added
- `/sonarqube:configure` skill — guided setup wizard that installs `sonarqube-cli`, authenticates via `sonar auth login` (credentials stored in system keychain), installs the secrets scanning binary, and runs `sonar integrate claude` to register hooks and the MCP server
- `/sonarqube:analyze` command — analyzes a single file for quality and security issues via the SonarQube MCP server
- `/sonarqube:fix-issue` command — fixes a specific rule violation by rule key and file location
- `/sonarqube:explain-rule` command — explains a SonarQube rule with rationale, examples, and remediation guidance
- `/sonarqube:list-issues` command — searches and filters issues for a project, branch, or pull request
- `/sonarqube:project-health` command — displays key quality and security metrics (bugs, vulnerabilities, coverage, technical debt)
- `SessionStart` hook — checks on startup whether `sonarqube-cli` is installed and `sonar integrate claude` has been run, and reports status to the user
