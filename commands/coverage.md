---
name: coverage
description: Find files with low test coverage and inspect uncovered lines in a SonarQube project
---

# SonarQube — Coverage

Identify files with insufficient test coverage and pinpoint the exact lines that need tests.

## Usage

```
/sonarqube:coverage                              # worst-covered files in the current project
/sonarqube:coverage my-project                  # worst-covered files in a specific project
/sonarqube:coverage my-project --max 50         # only files with coverage <= 50%
/sonarqube:coverage my-project --file src/auth/login.py  # line-by-line detail for one file
```

## Instructions

### Step 1: Resolve the project key

- If `$ARGUMENTS` contains a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, ask: *"Which SonarQube project would you like to check coverage for?"*

### Step 2: Parse optional flags from `$ARGUMENTS`

| Flag | Meaning |
|------|---------|
| `--max <n>` | Only return files with coverage ≤ n% (maps to `maxCoverage`) |
| `--pr <id>` | Analyse a pull request instead of the main branch |
| `--file <key>` | Skip the file list and go straight to line-by-line detail for this file key |

### Step 3: Run the appropriate flow

#### Flow A — File list (default, no `--file`)

Call `mcp__sonarqube__search_files_by_coverage`:

```json
{
  "projectKey": "<project-key>",
  "maxCoverage": <n>,       // if --max was given
  "pullRequest": "<id>",    // if --pr was given
  "pageSize": 20
}
```

Present results as a table sorted by coverage ascending:

```markdown
## Coverage — `my-project`

Files with lowest coverage (worst first):

| File | Coverage |
|------|----------|
| src/auth/login.py | 12.5% |
| src/utils/crypto.py | 23.0% |
| src/api/routes.py | 41.8% |
```

If no files are returned (all files exceed the threshold), say: *"All files meet the coverage threshold."*

Then offer to drill in:
*"Ask me to inspect any of these files for uncovered lines, or run `/sonarqube:coverage <project> --file <file-key>` directly."*

#### Flow B — Line detail (`--file <key>` given, or user asks to inspect a file)

Call `mcp__sonarqube__get_file_coverage_details`:

```json
{
  "key": "<file-key>",
  "pullRequest": "<id>"   // if --pr was given
}
```

The file key format is `<projectKey>:<path>`, e.g. `my-project:src/auth/login.py`.
If the user provides just a path, prepend the resolved project key.

Present uncovered and partially covered lines:

```markdown
## Coverage Detail — `src/auth/login.py`

Overall coverage: **12.5%**

### Uncovered lines
Lines with no test coverage: 14, 15, 23, 45–52, 67

### Partially covered branches
| Line | Covered branches | Total branches |
|------|-----------------|----------------|
| 30 | 1 | 2 |
| 61 | 0 | 2 |
```

If the file is fully covered, say: *"All lines in this file are covered."*

### Step 4: Next steps

- To write tests for uncovered lines: *"Ask me to add tests for the uncovered lines above."*
- To check for quality issues in the same file: *"Run `/sonarqube:analyze <file>`."*
- To see overall project health: *"Run `/sonarqube:project-health <project-key>`."*

## Error Handling

If the MCP server is unavailable or the project key is not found:

```markdown
Unable to reach the SonarQube MCP server, or project key not found.

**Possible causes:**
- MCP server is not running — restart Claude Code and run `/sonarqube:configure`
- Credentials not configured — run `/sonarqube:configure`
- Project key is wrong — verify `sonar-project.properties`
```
