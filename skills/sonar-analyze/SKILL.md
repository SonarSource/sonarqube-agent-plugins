---
name: sonar-analyze
description: Analyze a file or the current git changes for quality and security issues using SonarQube
argument-hint: "[file-path | current changes]"
allowed-tools: Read, Glob, Bash(git branch:*), Bash(docker ps:*), Bash(podman ps:*), Bash(nerdctl ps:*), Bash(sonar:*)
---

# SonarQube — Code Analysis

Analyze code for quality and security issues. Keep the user's original file or change scope when sign-in interrupts a check.

## Usage

```
sonar-analyze                        # analyze the file currently in context
sonar-analyze src/auth/login.py      # analyze a specific file
sonar-analyze current changes       # analyze the current git change set
```

## Current git changes

For an explicit request to check the current changes, run `sonar analyze agentic --format json` from the repository. Use `--staged` when the user specifically asks for staged changes. Apply any supplied project or branch to the same check. If the CLI is missing or requires sign-in, use **Resume after setup** below before retrying. If no project is resolved, offer the existing project-linking flow. Report zero analyzed files, skipped analysis, and failures separately from an analysis with no findings.

## Single-file prerequisites

For a single file, prefer one of `mcp__sonarqube__run_advanced_code_analysis`, `mcp__sonarqube__analyze_file_list`, or `mcp__sonarqube__analyze_code_snippet` when available.

**Before proceeding**, verify at least one of these tools is accessible. If none are, try the CLI fallback in Step 3 before giving up — don't invent other CLI commands (e.g. `sonar mcp call` does not exist).

**If the CLI fallback also fails or doesn't apply, narrow down the cause** — check whether the `sonarqube` MCP server is enabled in this agent's configuration.

- **Not enabled / not registered** → recommend running the sonar-integrate skill.
- **Enabled but its tools are still unavailable** → configuration is correct but the server failed to start. The most common cause is that the container runtime is not running — the MCP server launches inside Docker/Podman/Nerdctl via `sonar run mcp`, so a correctly configured server still produces no tools if the daemon is stopped. Run `docker ps` yourself (falling back to `podman ps` / `nerdctl ps`) to confirm which cause applies: if it errors, the runtime is down; after the user starts it, confirm the same command succeeds before asking them to restart the agent session.

Either way, show the user:

> Unable to reach the SonarQube MCP Server.
>
> **Possible causes:**
> - MCP server not registered — invoke the sonar-integrate skill to configure the SonarQube MCP Server, then restart the agent session
> - Container runtime not running — the SonarQube MCP Server runs inside a container (Docker, Podman, or Nerdctl); start your container runtime, then restart the agent session
> - Credentials not configured — invoke the sonar-integrate skill
> - Project key missing or invalid — pass an explicit key if needed, verify `sonar-project.properties`, or re-run the sonar-integrate skill for this project

## Resume after setup

When the CLI is missing, authentication is required, or the SonarQube integration needs setup, ask the user whether to finish setup and continue the requested check. If they accept, invoke the sonar-integrate skill with the original repository, file or change scope, and project and branch options. Resume that same check once its prerequisites are ready. If setup needs a restart, give the user a short prompt with the same scope to use after restarting. If they decline, stop.

## Instructions

### Step 1: Resolve what to analyze

Analyze **one file at a time**. Resolve a single file path:

- If the user provided a file path, use it.
- If no path was provided, look at the current conversation context for a recently mentioned or edited file.
- If nothing is clear, ask: *"Which file would you like me to analyze?"*

Do not accept a directory as input. If the user provides one, ask them to specify a single file.

### Step 2: Read the file and determine its scope

1. Read the file's full content for analysis tools whose schema requires `fileContent` (see Step 3).
2. Determine the file scope: `"TEST"` or `"MAIN"`. Use the file path to deduce the scope. For example, if the file path contains `test`, `spec`, or `__tests__`, it's likely `"TEST"` scope.

### Step 3: Call the appropriate analysis tool

After running the sonar-integrate skill, the SonarQube MCP Server often has a **default project** for this workspace, so **`projectKey` is sometimes unnecessary** — pass it only when the tool schema requires it or the user targets another project.

**Try `mcp__sonarqube__run_advanced_code_analysis` first if available.** On Cloud stdio, its presence does not prove that the selected organization is entitled to Vortex; entitlement is checked on each call.

Cloud stdio selects one analysis path at startup, so an advanced-analysis session may have no local fallback. `SONARQUBE_FORCE_LOCAL_ANALYSIS=true` selects `analyze_code_snippet` directly, bypassing the IDE bridge; the `analysis` toolset must be enabled.

Use the `vortex` toolset for advanced analysis; keep `analysis` enabled when configuring the local snippet recovery path.

Before calling it, detect the current branch name using `git branch --show-current`. If git is unavailable, use `main` as a fallback.

Use the tool's published schema and call with:

- `organization` — when the Cloud tool exposes it, pass the selected organization if one was chosen; otherwise use the server default
- `projectKey` — **omit unless the tool requires it** (initial MCP configuration usually supplies the default project); if required, use the value from the user's arguments if provided, otherwise `sonar.projectKey` in `sonar-project.properties` at the repo root
- `branch` — detected branch name
- `filePath` — project-relative file path (e.g. `src/auth/login.py`)
- `fileContent` — full file content; **only pass if the tool requires it** (when the MCP server has a mount, it reads the file directly and this parameter will not be required)
- `fileScope` — `"TEST"` or `"MAIN"` as a string

**If the tool is unavailable or returns an error containing `Vortex is not enabled`, continue with the local analysis fallbacks below.** Treat that error as Vortex being unavailable for the selected organization. For an authentication error, confirm the CLI needs sign-in with `sonar auth status` and use **Resume after setup** when applicable. Report other errors and stop.

**Prefer `mcp__sonarqube__analyze_file_list` when available** (requires a running SonarQube for IDE instance bridged to this session):

- `file_absolute_paths` — array containing the absolute path to the file (e.g. `["/home/user/project/src/auth/login.py"]`); resolve it from the file path found in Step 1

This tool uses the IDE's project binding and has no `organization` parameter.

**Otherwise, use `mcp__sonarqube__analyze_code_snippet` when available:**

- `organization` — when exposed, preserve the organization selected for the advanced-analysis call
- `projectKey` — pass only if exposed by the schema and needed for this project
- `filePath` — project-relative path when the schema requires it (mounted workspace)
- `fileContent` — complete file content when the schema requires it (unmounted workspace)
- `language` — the file's language, using a value from the schema
- `scope` — `"TEST"` or `"MAIN"` as a string

`codeSnippet` only filters issues within the analyzed file; it does not replace required file content.

**If no MCP analysis tool is available, fall back to the CLI's Vortex analysis:**

```bash
sonar analyze agentic --file <file-path> [--file <other-file-path> ...] --format json [--branch <branch-name>] [-p <project-key>]
```

This uses the same Vortex backend as `run_advanced_code_analysis` and requires an entitled organization. After a `Vortex is not enabled` error, skip this CLI fallback. If neither local MCP tool is available, explain that the selected organization is not entitled to Vortex. To analyze it locally, restart the MCP server with `SONARQUBE_FORCE_LOCAL_ANALYSIS=true` and the `analysis` toolset enabled; preserve the selected organization when retrying.

If the CLI is missing or authentication is required, use **Resume after setup**. If the fallback reports another failure, show the diagnostic.

### Step 4: Format the results

**If issues are found**, present them as a table sorted by line number:

```markdown
## SonarQube Analysis — `src/auth/login.py`

Found **3 issue(s)**:

| Line | Severity  | Rule         | Message                                               |
| ---- | --------- | ------------ | ----------------------------------------------------- |
| 12   | 🔴 Blocker | python:S2077 | Make sure that executing this SQL query is safe here. |
| 34   | 🟠 Major   | python:S1481 | Remove the unused local variable "token".             |
| 67   | 🟡 Minor   | python:S1135 | Complete the task associated to this "TODO" comment.  |
```

Severity icons (the label depends on the server version):
- 🔴 Blocker
- 🟠 Critical / High
- 🟡 Major / Medium
- 🔵 Minor / Low
- ⚪ Info

**If no issues are found**:

```markdown
## SonarQube Analysis — `src/auth/login.py`

✅ No issues found.
```

### Step 5: Next steps

After the results, always add:

- If issues were found: *"Invoke the sonar-fix-issue skill with `<rule> <file>:<line>` to fix a specific issue, or ask me to fix them all."*
- If the user wants to analyze another file: remind them to invoke the sonar-analyze skill with the file path.
