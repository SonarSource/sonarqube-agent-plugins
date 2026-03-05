---
name: list-issues
description: Search and filter SonarQube issues for a project, branch, or pull request
---

# SonarQube — List Issues

Search for issues in a SonarQube project using the MCP server.

## Usage

```
/sonarqube:list-issues                              # issues in the current project
/sonarqube:list-issues my-project                   # issues in a specific project key
/sonarqube:list-issues my-project --severity HIGH   # filter by severity
/sonarqube:list-issues my-project --pr 42           # issues on pull request #42
/sonarqube:list-issues my-project --branch main     # issues on a specific branch
```

## Instructions

### Step 1: Resolve the project key

- If `$ARGUMENTS` contains a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, ask: *"Which SonarQube project would you like to list issues for?"*

### Step 2: Parse optional filters from `$ARGUMENTS`

| Flag | Maps to parameter |
|------|-------------------|
| `--severity HIGH\|MEDIUM\|LOW\|INFO\|BLOCKER` | `severities` |
| `--pr <id>` | `pullRequestId` |
| `--branch <name>` | `branch` |
| `--status OPEN\|CONFIRMED\|FALSE_POSITIVE\|ACCEPTED\|FIXED` | `issueStatuses` |
| `--file <path>` | `files` (use the SonarQube component key format `project:src/path`) |

### Step 3: Call `mcp__sonarqube__search_sonar_issues_in_projects`

```json
{
  "projects": ["<project-key>"],
  "severities": ["<severity>"],        // if --severity was given
  "pullRequestId": "<id>",             // if --pr was given
  "branch": "<name>",                  // if --branch was given
  "issueStatuses": ["<status>"],       // if --status was given
  "files": ["<component-key>"],        // if --file was given
  "ps": 50
}
```

### Step 4: Format the results

**If issues are found**, present a summary line then a table sorted by severity then line number:

```markdown
## SonarQube Issues — `my-project` (branch: `main`)

Found **12 issue(s)**:

| File | Line | Severity | Type | Message |
|------|------|----------|------|---------|
| src/auth/login.py | 12 | 🔴 Blocker | Vulnerability | SQL injection risk |
| src/utils/helpers.py | 34 | 🟠 High | Bug | Null dereference |
| src/api/routes.py | 67 | 🟡 Medium | Code Smell | Cognitive complexity too high |
```

Severity icons:
- 🔴 Blocker / Critical
- 🟠 High
- 🟡 Medium
- 🔵 Low / Info

**If no issues are found**:

```markdown
## SonarQube Issues — `my-project`

✅ No issues found.
```

**If the result is paginated** (total > 50), note: *"Showing first 50 of N issues. Add `--severity` or `--file` to narrow results."*

### Step 5: Next steps

- To fix a specific issue: *"Ask me to fix `<rule>` at `<file>:<line>`."*
- To check overall project health and key quality metrics: *"Run `/sonarqube:project-health`."*
- To triage (accept / mark false positive): *"Ask me to accept or mark as false positive any issue by its key."*

## Error Handling

If the MCP server is unavailable or the project key is not found:

```markdown
Unable to reach the SonarQube MCP server, or project key not found.

**Possible causes:**
- MCP server is not running — check `.mcp.json` and restart Claude Code
- Credentials not configured — run `/sonarqube:configure`
- Project key is wrong — verify `sonar-project.properties`
```
