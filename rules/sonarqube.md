# SonarQube Antigravity Plugin — Agent Context

## What This Plugin Provides

This Antigravity plugin gives the agent SonarQube's code quality and security capabilities through a set of skills backed by the SonarQube MCP server and `sonarqube-cli`. With it, you can analyze code, check project quality, manage issues, and get detailed insights without leaving the chat.

## Integration and Recovery

The `sonar-integrate` skill is a preliminary initialization and recovery skill for the plugin itself. It:

- installs `sonarqube-cli` if missing and updates it to the latest version,
- authenticates the CLI via `sonar auth login` (token stored in system keychain),
- runs `sonar integrate antigravity` to wire secrets scanning hooks, Agentic Analysis instructions, Context Augmentation, and MCP configuration.

Migrating from the SonarQube Gemini extension? Run `agy plugin import gemini`, then `sonar integrate antigravity`.

`sonar run mcp` handles container runtime detection (Docker, Podman, Nerdctl) and auth automatically — no environment variables are needed.

Invoke the `sonar-integrate` skill when another skill surfaces a failure that points to one of the conditions above (missing CLI, failed auth, or incomplete integrate wiring).

## How Users Typically Interact

### Finding Projects
**Example user requests:**
- "Show me my SonarQube projects"
- "List all projects in my organization"

**What to do:** Invoke the `sonar-list-projects` skill end-to-end. It runs the `sonarqube-cli` to return project keys needed for other operations.

### Analyzing Code Quality
**Example user requests:**
- "What's the quality gate status of my project?"
- "Check if my project passes quality gates"
- "How is the code quality for project X?"

**What to do:** Invoke the `sonar-quality-gate` skill end-to-end. If the user doesn't know the project key, first invoke the `sonar-list-projects` skill.

### Code Issues and Violations
**Example user requests:**
- "Show me the issues in my project"
- "Find security issues in project X"
- "List all bugs in my codebase"
- "Find all blocker issues in my codebase"

**What to do:** Invoke the `sonar-list-issues` skill end-to-end. It supports filtering by severity, type, status, rule, tag, component, branch, and pull request, and always passes `-p <project-key>` to the CLI.

### Code Snippet Analysis
**Example user requests:**
- "Analyze this code snippet for issues"
- "Check this code for quality problems"
- "Generate a method that does X and analyze it for issues"

**What to do:** Invoke the `sonar-analyze` skill end-to-end. It prefers `mcp__sonarqube__run_advanced_code_analysis` (Agentic Analysis) and falls back to `mcp__sonarqube__analyze_code_snippet`, handling file reading, language detection, and scope selection.

### Coverage
**Example user requests:**
- "Which files have the worst test coverage?"
- "Show uncovered lines in `src/auth/login.py`"

**What to do:** Invoke the `sonar-coverage` skill end-to-end for both the file list (lowest coverage first) and line-level detail.

### Duplications
**Example user requests:**
- "Which files have duplicated code?"
- "Show duplication blocks in `src/auth/login.py`"

**What to do:** Invoke the `sonar-duplication` skill end-to-end for the duplicated-files list and per-file duplication blocks.

### Dependency Risks (SCA)
**Example user requests:**
- "Are there any vulnerable dependencies?"
- "Show dependency risks for this project"

**What to do:** Invoke the `sonar-dependency-risks` skill end-to-end (requires SonarQube Advanced Security).

### Fixing a Specific Issue
**Example user requests:**
- "Fix `python:S2077` in `src/auth/login.py:12`"
- "Remove the unused variable flagged by Sonar"

**What to do:** Invoke the `sonar-fix-issue` skill end-to-end. It looks up the rule, reads the file, and applies a minimal fix.

### Understanding Rules and Metrics
**Example user requests:**
- "What does this rule mean?"
- "Explain rule javascript:S1234"
- "What metrics are available?"
- "Show me code complexity metrics"

**What to do:** No dedicated skill exists for this — call the MCP tools directly: `mcp__sonarqube__show_rule` for rule explanations, `mcp__sonarqube__search_metrics` for available metrics, and `mcp__sonarqube__get_component_measures` for specific metric values.

## Important Parameter Guidelines

### Project Keys

After `sonar integrate antigravity`, MCP tools often **do not require** an explicit project key — the integration stores a default project for the workspace. Resolve a key only when a tool schema requires it, the user targets another project, or a CLI command always needs `-p`:

- If the user provided a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root (or in `pom.xml`, `build.gradle`, `build.gradle.kts`, or `package.json`).
- For CLI commands such as `sonar list issues`, `-p` is always required — invoke the `sonar-list-projects` skill if no key is known.
- When no key is found and the tool allows it, omit `projectKey` and rely on the integration default.

### Branch and Pull Request Context
- Many operations support branch-specific analysis
- If user mentions working on a feature branch, include the branch parameter
- Pull request analysis is available for PR-specific insights

## Common Troubleshooting

### Authentication or MCP Issues
- For setup, re-authentication, missing MCP tools, or incomplete wiring, invoke the `sonar-integrate` skill
- Restart the Antigravity session after integrate if MCP tools do not appear

### Project Not Found
- Invoke the `sonar-list-projects` skill to confirm available projects
- Check if user has access to the specific project
- Verify project key spelling and format
