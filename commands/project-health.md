---
name: project-health
description: Show a health overview of a SonarQube project — bugs, vulnerabilities, coverage, and technical debt
---

# SonarQube — Project Health

Fetch and display key quality and security metrics for a SonarQube project.

## Usage

```
/sonarqube:project-health                  # health of the current project
/sonarqube:project-health my-project       # health of a specific project key
/sonarqube:project-health my-project --branch release/2.0
```

## Instructions

### Step 1: Resolve the project key

- If `$ARGUMENTS` contains a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, ask: *"Which SonarQube project would you like a health overview for?"*

### Step 2: Parse optional filters from `$ARGUMENTS`

| Flag | Maps to parameter |
|------|-------------------|
| `--branch <name>` | `branch` |
| `--pr <id>` | `pullRequest` |

### Step 3: Call `mcp__sonarqube__get_component_measures`

Fetch all of the following metric keys in a single call:

```json
{
  "projectKey": "<project-key>",
  "metricKeys": [
    "bugs",
    "vulnerabilities",
    "code_smells",
    "sqale_index",
    "sqale_rating",
    "security_rating",
    "reliability_rating",
    "coverage",
    "duplicated_lines_density",
    "ncloc"
  ],
  "branch": "<name>",      // if --branch was given
  "pullRequest": "<id>"    // if --pr was given
}
```

### Step 4: Format the results

Present the metrics as a structured health card:

```markdown
## Project Health — `my-project` (branch: `main`)

### Reliability
| Metric | Value |
|--------|-------|
| Bugs | 3 |
| Reliability rating | B |

### Security
| Metric | Value |
|--------|-------|
| Vulnerabilities | 1 |
| Security rating | A |

### Maintainability
| Metric | Value |
|--------|-------|
| Code smells | 42 |
| Technical debt | 3h 20min |
| Maintainability rating | A |

### Coverage & Duplication
| Metric | Value |
|--------|-------|
| Coverage | 74.2% |
| Duplicated lines | 3.1% |

### Size
| Metric | Value |
|--------|-------|
| Lines of code | 12 450 |
```

**Rating scale** (A–E, where A = best):
- A: 0 vulnerabilities / 0 bugs / debt ratio ≤ 5 %
- B–E: increasing levels of risk

Add a one-sentence overall assessment, for example:
- *"The project is in good shape — one vulnerability to address and coverage could be improved."*
- *"High technical debt and a B reliability rating suggest refactoring is overdue."*

### Step 5: Next steps

- To see the full issue list: *"Run `/sonarqube:list-issues <project-key>`."*
- To drill into uncovered code: *"Ask me to analyze a specific file with `/sonarqube:analyze <file>`."*

## Error Handling

If the MCP server is unavailable or the project key is not found:

```markdown
Unable to reach the SonarQube MCP server, or project key not found.

**Possible causes:**
- MCP server is not running — check `.mcp.json` and restart Claude Code
- Credentials not configured — run `/sonarqube:configure`
- Project key is wrong — verify `sonar-project.properties`
```
