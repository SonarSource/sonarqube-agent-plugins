---
name: coverage
description: Find files with low test coverage and inspect uncovered lines in a SonarQube project (project key optional when MCP integration already defines the default project)
argument-hint: "[project-key?] [--max n] [--file key] [--pr id]"
allowed-tools: Read, Grep
---

# SonarQube — Coverage

Identify files with insufficient test coverage and pinpoint the exact lines that need tests.

## Usage

```
coverage                              # worst-covered files in the current project
coverage my-project                   # worst-covered files in a specific project
coverage my-project --max 50          # only files with coverage <= 50%
coverage my-project --file src/auth/login.py  # line-by-line detail for one file
```

## Prerequisites

This skill requires the SonarQube MCP Server to be configured and the tools `mcp__sonarqube__search_files_by_coverage` and `mcp__sonarqube__get_file_coverage_details` to be available in your session.

**Before proceeding**, verify the tools are accessible. If they are not, stop immediately — do not attempt to call any CLI commands or invent alternatives — and tell the user:

> Unable to reach the SonarQube MCP Server, or project key not found.
>
> **Possible causes:**
> - MCP server not registered — invoke the SonarQube integrate skill to configure the SonarQube MCP Server, then restart the agent session
> - Credentials not configured — invoke the SonarQube integrate skill
> - Project key is wrong or no default project in MCP config — pass an explicit key, or verify `sonar-project.properties` / re-run the SonarQube integrate skill for this project

## Instructions

### Step 1: Resolve the project key (only when needed)

MCP tools sometimes **do not require** `projectKey` after the SonarQube integrate skill has stored the default project for this workspace. Resolve a key only when you must pass it (tool schema requires it, or the user targets another project):

- If the user provided a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, **omit `projectKey`** in MCP calls and rely on the integration default.

### Step 2: Parse optional flags from the user-provided arguments

| Flag           | Meaning                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `--max <n>`    | Only return files with coverage ≤ n% (maps to `maxCoverage`)                |
| `--pr <id>`    | Analyse a pull request instead of the main branch                           |
| `--file <key>` | Skip the file list and go straight to line-by-line detail for this file key |

### Step 3: Run the appropriate flow

#### Flow A — File list (default, no `--file`)

Call `mcp__sonarqube__search_files_by_coverage`. Include **`projectKey` only if** you resolved one in Step 1 **and** the tool requires it; otherwise omit it.

```json
{
  "projectKey": "<only-if-required>",
  "maxCoverage": <n>,       // if --max was given
  "pullRequest": "<id>",    // if --pr was given
  "pageSize": 20
}
```

Omit `projectKey` from the payload entirely when the default project from integration applies. Omit unused optional fields.

Present results as a table sorted by coverage ascending:

```markdown
## Coverage — `my-project`

Files with lowest coverage (worst first):

| File                | Coverage |
| ------------------- | -------- |
| src/auth/login.py   | 12.5%    |
| src/utils/crypto.py | 23.0%    |
| src/api/routes.py   | 41.8%    |
```

If no files are returned (all files exceed the threshold), say: *"All files meet the coverage threshold."*

Then offer to drill in:
*"Ask me to inspect any of these files for uncovered lines, or invoke the SonarQube coverage skill with `--file <file-key>` (add a project key only if needed)."*

#### Flow B — Line detail (`--file <key>` given, or user asks to inspect a file)

Call `mcp__sonarqube__get_file_coverage_details`:

```json
{
  "key": "<file-key>",
  "pullRequest": "<id>"   // if --pr was given
}
```

The file key format is `<projectKey>:<path>`, e.g. `my-project:src/auth/login.py`.
If the user provides just a path, prepend the resolved project key when you have one; if the integration supplies the default project, the detail tool may accept the path or key format your MCP schema documents — follow the tool schema.

Present uncovered and partially covered lines:

```markdown
## Coverage Detail — `src/auth/login.py`

Overall coverage: **12.5%**

### Uncovered lines
Lines with no test coverage: 14, 15, 23, 45–52, 67

### Partially covered branches
| Line | Covered branches | Total branches |
| ---- | ---------------- | -------------- |
| 30   | 1                | 2              |
| 61   | 0                | 2              |
```

If the file is fully covered, say: *"All lines in this file are covered."*

### Step 4: Next steps

- To write tests for uncovered lines: *"Ask me to add tests for the uncovered lines above."*
- To check for quality issues in the same file: *"Invoke the SonarQube analyze skill with `<file>`."*
- To check the quality gate: *"Invoke the SonarQube quality-gate skill (add a project key only if you are not using the integration default)."*
