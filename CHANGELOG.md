# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0]

### Added
- `/sonarqube:integrate` skill (`skills/integrate/`) — guided flow to connect an existing SonarQube account to Claude Code: `sonarqube-cli`, `sonar auth login` (credentials in system keychain), secrets binary, and `sonar integrate claude` for MCP and secrets hooks
- `/sonarqube:list-projects` command — lists accessible SonarQube projects, with optional name/key search, via `sonar list projects`
- `/sonarqube:list-issues` command — searches and filters issues for a project, branch, or pull request via `sonar list issues --format toon`
- `/sonarqube:fix-issue` command — fetches issue details via `sonar list issues` and applies the minimal fix; no MCP dependency
- `SessionStart` hook — checks on startup whether `sonarqube-cli` is installed and `sonar integrate claude` has been run, reports status to the user; implemented in Node.js (`scripts/setup.js`) so no additional runtime is required beyond Claude Code itself
