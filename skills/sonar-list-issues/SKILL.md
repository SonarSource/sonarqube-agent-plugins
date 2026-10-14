---
name: sonar-list-issues
description: Search and filter SonarQube issues for a project, branch, or pull request via sonarqube-cli (`-p` is always required on the CLI; resolve the key from user arguments or sonar-project.properties)
argument-hint: "[project-key?] [--severities values] [--statuses values] [--branch name]"
allowed-tools: Read, Grep, Bash(sonar:*)
---

# SonarQube — List Issues

Search for issues in a SonarQube project using the `sonarqube-cli`.

Unlike SonarQube MCP tools (which may use a default project from integration), **`sonar list issues` always requires `-p <project-key>`**. Resolve the key from the user-provided arguments or `sonar-project.properties` before running the CLI.

## Usage

```
sonar-list-issues                                          # issues in the current project
sonar-list-issues my-project                               # issues in a specific project key
sonar-list-issues my-project --severities CRITICAL,BLOCKER # filter by severities
sonar-list-issues my-project --statuses OPEN,CONFIRMED     # filter by status
sonar-list-issues my-project --branch main                 # on a specific branch
sonar-list-issues my-project --pr 42                       # on a pull request
```

## Prerequisites

This skill uses the `sonarqube-cli` command. The CLI must be installed and authenticated before proceeding.

**Before proceeding**, verify that `sonar` is available on your PATH and authenticated. If it is not, do not attempt to call any alternative commands or invent alternatives, and show the user:

> Unable to list issues.
>
> **Possible causes:**
> - `sonarqube-cli` not installed or not authenticated — invoke the sonar-integrate skill
> - Project key is wrong or missing — `-p` is mandatory for `sonar list issues`; invoke the sonar-list-projects skill or set `sonar.projectKey` in `sonar-project.properties`

Then ask the user (yes/no) whether to run the sonar-integrate skill now. Briefly explain what it does: it checks the SonarQube setup on their machine — installing or updating `sonarqube-cli` and verifying authentication — and re-configures the integration for this agent, including the SonarQube MCP server and secrets-scanning hooks. If they confirm, invoke the sonar-integrate skill yourself and follow it end-to-end in this session, then re-check and continue; if they decline, stop.

## Instructions

### Step 1: Resolve the project key

This flow uses **`sonar list issues`** (CLI), not MCP. The CLI **always** needs **`-p <project-key>`** — do not invoke it without a resolved key.

- If the user provided a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, **do not run** `sonar list issues`. Tell the user: *"Invoke the sonar-list-projects skill to find your project key, then re-run with that key,"* or add `sonar.projectKey` to `sonar-project.properties`. (MCP integration defaults do **not** apply to this CLI command.)

### Step 2: Parse optional flags from the user-provided arguments

| Flag                     | Maps to CLI option |
| ------------------------ | ------------------ |
| `--severities <values>`  | `--severities`     |
| `--statuses <values>`    | `--statuses`       |
| `--branch <name>`        | `--branch`         |
| `--pr <id>`              | `--pull-request`   |

> `sonar list issues` does **not** support filtering by issue type, rule, tag, or component, nor a `--resolved` flag. Only the options above (plus `--format`, `--page`, and `--page-size`) exist. To filter by rule/type/tag/component or to drill into a single file, use the MCP-based skills (e.g. sonar-analyze for a file, or `mcp__sonarqube__search_sonar_issues_in_projects`).

### Step 3: Validate arguments

Before building the command, validate each user-supplied value against the following rules. If any value fails validation, stop and tell the user what was rejected and why — do not run the command. Validate the resolved project key (from args or `sonar-project.properties`) against the project-key pattern before running the CLI.

| Argument       | Allowed pattern                                                                       |
| -------------- | ------------------------------------------------------------------------------------- |
| project key    | `^[a-zA-Z0-9_\-\.:]+$`                                                                |
| `--severities` | comma-separated subset of: `INFO`, `MINOR`, `MAJOR`, `CRITICAL`, `BLOCKER`, `HIGH`, `MEDIUM`, `LOW` |
| `--statuses`   | comma-separated subset of: `OPEN`, `CONFIRMED`, `FALSE_POSITIVE`, `ACCEPTED`, `FIXED` |
| `--branch`     | `^[a-zA-Z0-9_\-\./]+$`                                                                |
| `--pr`         | digits only                                                                           |

### Step 4: Run `sonar list issues`

Build and run the command using a shell command. **Always** pass **`-p`** with the key resolved in Step 1.

```bash
sonar list issues -p <project-key> --format toon [--severities <values>] [--statuses <values>] [--branch <name>] [--pull-request <id>]
```

Only include optional flags that were provided.

### Step 5: Format the results

**If issues are found**, present a summary line then a table sorted by severity then line number. Write one row per issue with exactly the five columns below. Show severity as plain text, without emoji or other icons in table cells.

Before writing each row, normalize every value from the issue data, including file paths and messages:

1. Replace line breaks with a single space and collapse repeated whitespace.
2. Escape each backslash first. Then escape each backtick, asterisk, underscore, angle bracket, square bracket, exclamation mark, tilde, ampersand, and pipe with a preceding backslash. Do this before joining cells with `|` so a value cannot create another column or use those characters as Markdown syntax.
3. Use `—` only when a field has no value. Preserve values that are present; do not leave their cells empty.

Keep each issue on one physical line. Pad columns if needed for terminal display, but keep the same five cells in every row.

```markdown
## SonarQube Issues — `my-project` (branch: `main`)

Found **3 issue(s)**:

| File                 | Line | Severity | Rule         | Message                       |
| -------------------- | ---- | -------- | ------------ | ----------------------------- |
| src/auth/login.py    | 12   | Blocker  | python:S2077 | SQL injection risk            |
| src/utils/helpers.py | 34   | High     | python:S2259 | Null dereference              |
| src/api/routes.py    | 67   | Medium   | python:S3776 | Cognitive complexity too high |
```

If a visual severity cue helps, put it outside the table. Severity labels depend on the server version:
- 🔴 Blocker
- 🟠 Critical / High
- 🟡 Major / Medium
- 🔵 Minor / Low
- ⚪ Info

**If no issues are found**:

```markdown
## SonarQube Issues — `my-project`

✅ No issues found.
```

### Step 6: Next steps

- To fix a specific issue: *"Ask me to fix `<rule>` at `<file>:<line>`."*
- To check the quality gate: *"Invoke the sonar-quality-gate skill."*
