---
name: list-issues
description: Search and filter SonarQube issues for a project, branch, or pull request via sonarqube-cli (`-p` is always required on the CLI; resolve the key from slash args or sonar-project.properties)
argument-hint: [project-key?] [--severity value] [--types values] [--branch name]
allowed-tools: Read, Grep, Bash(sonar:*)
---

# SonarQube — List Issues

Search for issues in a SonarQube project using the `sonarqube-cli`.

Unlike SonarQube MCP tools (which may use a default project from integration), **`sonar list issues` always requires `-p <project-key>`**. Resolve the key from slash arguments or `sonar-project.properties` before running the CLI.

## Usage

```
/sonarqube:list-issues                                          # issues in the current project
/sonarqube:list-issues my-project                               # issues in a specific project key
/sonarqube:list-issues my-project --severity CRITICAL           # filter by severity
/sonarqube:list-issues my-project --types BUG,VULNERABILITY     # filter by type
/sonarqube:list-issues my-project --statuses OPEN,CONFIRMED     # filter by status
/sonarqube:list-issues my-project --rules python:S2077          # filter by rule key
/sonarqube:list-issues my-project --tags security               # filter by tag
/sonarqube:list-issues my-project --component src/auth/login.py # issues in a specific file
/sonarqube:list-issues my-project --resolved                    # only resolved issues
/sonarqube:list-issues my-project --branch main                 # on a specific branch
/sonarqube:list-issues my-project --pr 42                       # on a pull request
```

## Instructions

### Step 1: Resolve the project key

This flow uses **`sonar list issues`** (CLI), not MCP. The CLI **always** needs **`-p <project-key>`** — do not invoke it without a resolved key.

- If `$ARGUMENTS` contains a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, **do not run** `sonar list issues`. Tell the user: *"Run `/sonarqube:list-projects` to find your project key, then re-run with that key,"* or add `sonar.projectKey` to `sonar-project.properties`. (MCP integration defaults do **not** apply to this CLI command.)

### Step 2: Parse optional flags from `$ARGUMENTS`

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

Build and run the command using the Bash tool. **Always** pass **`-p`** with the key resolved in Step 1.

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
- To check the quality gate: *"Run `/sonarqube:quality-gate`."*

## Error Handling

If the command fails:

```markdown
Unable to list issues.

**Possible causes:**
- `sonarqube-cli` not installed or not authenticated — run `/sonarqube:integrate`
- Project key is wrong or missing — `-p` is mandatory for `sonar list issues`; run `/sonarqube:list-projects` or set `sonar.projectKey` in `sonar-project.properties`
```
