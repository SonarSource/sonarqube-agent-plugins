---
name: project-health
description: Show a health overview of a SonarQube project — bugs, vulnerabilities, coverage, complexity, and technical debt
argument-hint: [project-key] [--branch name] [--pr id]
allowed-tools: Read, Grep
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
- If still not found, omit `projectKey` — when the MCP server is configured per-project it already has the project context.

### Step 2: Parse optional filters from `$ARGUMENTS`

| Flag | Maps to parameter |
|------|-------------------|
| `--branch <name>` | `branch` |
| `--pr <id>` | `pullRequest` |

### Step 3: Fetch metrics and quality gate

Make both calls in parallel:

**`mcp__sonarqube__get_component_measures`** — fetch all metric keys in a single call:

```json
{
  "projectKey": "<project-key>",
  "metricKeys": [
    "ncloc",
    "bugs",
    "vulnerabilities",
    "code_smells",
    "sqale_index",
    "sqale_rating",
    "security_rating",
    "reliability_rating",
    "coverage",
    "line_coverage",
    "branch_coverage",
    "uncovered_lines",
    "complexity",
    "cognitive_complexity",
    "duplicated_lines_density"
  ],
  "branch": "<name>",      // if --branch was given
  "pullRequest": "<id>"    // if --pr was given
}
```

**`mcp__sonarqube__get_project_quality_gate_status`** — fetch the quality gate result:

```json
{
  "projectKey": "<project-key>",
  "pullRequest": "<id>"    // if --pr was given; omit for branch queries
}
```

### Step 4: Format the results

Present the metrics as a structured health card:

```markdown
## Project Health — `my-project` (branch: `main`)

**Quality Gate: ✅ PASSED** <!-- or ❌ FAILED -->

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

### Coverage
| Metric | Value |
|--------|-------|
| Overall coverage | 74.2% |
| Line coverage | 76.1% |
| Branch coverage | 68.4% |
| Uncovered lines | 312 |

### Complexity
| Metric | Value |
|--------|-------|
| Cyclomatic complexity | 847 |
| Cognitive complexity | 612 |
| Duplication | 3.1% |

### Size
| Metric | Value |
|--------|-------|
| Lines of code | 12 450 |
```

If the quality gate status is unavailable (e.g. no analysis has run yet), omit the line rather than showing an error.

If the quality gate **FAILED**, list the failing conditions beneath the status line, for example:

```markdown
**Quality Gate: ❌ FAILED**
Failing conditions:
- Coverage on new code: 41.2% (required ≥ 80%)
- New blocker issues: 2 (required = 0)
```

**Rating scale** (A–E, where A = best):
- A: 0 vulnerabilities / 0 bugs / debt ratio ≤ 5 %
- B–E: increasing levels of risk

Omit a metric row if the value was not returned by the API (e.g. branch/line coverage may be absent for some project configurations).

Add a one-sentence overall assessment, for example:
- *"The project is in good shape — one vulnerability to address and coverage could be improved."*
- *"High cognitive complexity and low branch coverage suggest the core logic needs tests and simplification."*

### Step 5: Next steps

- To see the full issue list: *"Run `/sonarqube:list-issues <project-key>`."*
- If coverage is low: *"Run `/sonarqube:coverage <project-key>` to find the worst-covered files and uncovered lines."*
- To drill into a specific file: *"Run `/sonarqube:analyze <file>`."*

## Error Handling

If the MCP server is unavailable or the project key is not found:

```markdown
Unable to reach the SonarQube MCP server, or project key not found.

**Possible causes:**
- MCP server not registered — run `/sonarqube:integrate` so `sonar integrate claude` can wire the SonarQube MCP server, then restart Claude Code
- Credentials not configured — run `/sonarqube:integrate`
- Project key is wrong — verify `sonar-project.properties`
```
