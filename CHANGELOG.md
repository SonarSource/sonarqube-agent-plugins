# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- `/sonarqube:configure` skill — guided setup wizard that installs `sonarqube-cli`, authenticates via `sonar auth login` (credentials stored in system keychain), installs the secrets scanning binary, and runs `sonar integrate claude` to register secrets hooks and the MCP server
- `/sonarqube:analyze` command — analyzes a single file for quality and security issues via the SonarQube MCP server
- `/sonarqube:list-projects` command — lists accessible SonarQube projects, with optional name/key search, via `sonar list projects`
- `/sonarqube:list-issues` command — searches and filters issues for a project, branch, or pull request via `sonar list issues --format toon`
- `/sonarqube:fix-issue` command — fixes a specific rule violation by rule key and file location
- `/sonarqube:project-health` command — displays key quality and security metrics (bugs, vulnerabilities, line/branch coverage, uncovered lines, cyclomatic and cognitive complexity, technical debt)
- `/sonarqube:coverage` command — find files with low test coverage and inspect uncovered lines and branches via `search_files_by_coverage` and `get_file_coverage_details`
- `/sonarqube:dependency-risks` command — search for SCA dependency risks via `search_dependency_risks` (requires SonarQube Advanced Security — Cloud Enterprise edition or Server 2025.4 Enterprise+)
- `SessionStart` hook — checks on startup whether `sonarqube-cli` is installed and `sonar integrate claude` has been run, reports status to the user; invokes `scripts/setup.py` directly via `python3` (no POSIX shell required, works on Windows)
