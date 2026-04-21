---
name: sonar-list-issues
description: Search and filter SonarQube issues for a project, branch, or pull request via sonarqube-cli (`-p` is always required on the CLI; resolve the key from user arguments or sonar-project.properties)
argument-hint: "[project-key?] [--severity value] [--types values] [--branch name]"
allowed-tools: Read, Grep, Bash(sonar:*)
---

# SonarQube — List Issues

Search for issues in a SonarQube project using the `sonarqube-cli`.

Unlike SonarQube MCP tools (which may use a default project from integration), **`sonar list issues` always requires `-p <project-key>`**. Resolve the key from the user-provided arguments or `sonar-project.properties` before running the CLI.

## Usage

```
sonar-list-issues                                          # issues in the current project
sonar-list-issues my-project                               # issues in a specific project key
sonar-list-issues my-project --severity CRITICAL           # filter by severity
sonar-list-issues my-project --types BUG,VULNERABILITY     # filter by type
sonar-list-issues my-project --statuses OPEN,CONFIRMED     # filter by status
sonar-list-issues my-project --rules python:S2077          # filter by rule key
sonar-list-issues my-project --tags security               # filter by tag
sonar-list-issues my-project --component src/auth/login.py # issues in a specific file
sonar-list-issues my-project --resolved                    # only resolved issues
sonar-list-issues my-project --branch main                 # on a specific branch
sonar-list-issues my-project --pr 42                       # on a pull request
```

## Prerequisites

This skill uses the `sonarqube-cli` command. The CLI must be installed and authenticated before proceeding.

**Before proceeding**, verify that `sonar` is available on your PATH and authenticated. If it is not, stop immediately — do not attempt to call any alternative commands or invent alternatives — and tell the user:

> Unable to list issues.
>
> **Possible causes:**
> - `sonarqube-cli` not installed or not authenticated — invoke the sonar-integrate skill
> - Project key is wrong or missing — `-p` is mandatory for `sonar list issues`; invoke the sonar-list-projects skill or set `sonar.projectKey` in `sonar-project.properties`

## Instructions

### Step 1: Resolve the project key

This flow uses **`sonar list issues`** (CLI), not MCP. The CLI **always** needs **`-p <project-key>`** — do not invoke it without a resolved key.

- If the user provided a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, **do not run** `sonar list issues`. Tell the user: *"Invoke the sonar-list-projects skill to find your project key, then re-run with that key,"* or add `sonar.projectKey` to `sonar-project.properties`. (MCP integration defaults do **not** apply to this CLI command.)

### Step 2: Parse optional flags from the user-provided arguments

| Flag                  | Maps to CLI option                                           |
| --------------------- | ------------------------------------------------------------ |
| `--severity <value>`  | `--severity`                                                 |
| `--types <values>`    | `--types`                                                    |
| `--statuses <values>` | `--statuses`                                                 |
| `--rules <values>`    | `--rules`                                                    |
| `--tags <values>`     | `--tags`                                                     |
| `--component <path>`  | `--component-keys` (file key format: `project-key:src/path`) |
| `--resolved`          | `--resolved`                                                 |
| `--branch <name>`     | `--branch`                                                   |
| `--pr <id>`           | `--pull-request`                                             |

When `--component` is given as a plain path, prepend the resolved project key to form the component key (e.g. `my-project:src/auth/login.py`).

### Step 3: Validate arguments

Before building the command, validate each user-supplied value against the following rules. If any value fails validation, stop and tell the user what was rejected and why — do not run the command. Validate the resolved project key (from args or `sonar-project.properties`) against the project-key pattern before running the CLI.

| Argument      | Allowed pattern                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| project key   | `^[a-zA-Z0-9_\-\.:]+$`                                                                                         |
| `--severity`  | one of: `BLOCKER`, `CRITICAL`, `MAJOR`, `MINOR`, `INFO`, `HIGH`, `MEDIUM`, `LOW`                               |
| `--types`     | comma-separated subset of: `BUG`, `VULNERABILITY`, `CODE_SMELL`, `SECURITY_HOTSPOT`                            |
| `--statuses`  | comma-separated subset of: `OPEN`, `CONFIRMED`, `REOPENED`, `RESOLVED`, `CLOSED`, `ACCEPTED`, `FALSE_POSITIVE` |
| `--rules`     | comma-separated values matching `^[a-zA-Z0-9_\-:]+$`                                                           |
| `--tags`      | comma-separated values matching `^[a-zA-Z0-9_\-]+$`                                                            |
| `--component` | file path matching `^[a-zA-Z0-9_\-\./:,]+$`                                                                    |
| `--branch`    | `^[a-zA-Z0-9_\-\./]+$`                                                                                         |
| `--pr`        | digits only                                                                                                    |

### Step 4: Run `sonar list issues`

Build and run the command using a shell command. **Always** pass **`-p`** with the key resolved in Step 1.

```bash
sonar list issues -p <project-key> --format toon [--severity <value>] [--types <values>] [--statuses <values>] [--rules <values>] [--tags <values>] [--component-keys <key>] [--resolved] [--branch <name>] [--pull-request <id>]
```

Only include optional flags that were provided.

### Step 5: Format the results

**If issues are found**, present a summary line then a table sorted by severity then line number:

```markdown
## SonarQube Issues — `my-project` (branch: `main`)

Found **12 issue(s)**:

| File                 | Line | Severity  | Rule         | Message                       |
| -------------------- | ---- | --------- | ------------ | ----------------------------- |
| src/auth/login.py    | 12   | 🔴 Blocker | python:S2077 | SQL injection risk            |
| src/utils/helpers.py | 34   | 🟠 High    | python:S2259 | Null dereference              |
| src/api/routes.py    | 67   | 🟡 Medium  | python:S3776 | Cognitive complexity too high |
```

Severity icons (the label depends on the server version):
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
