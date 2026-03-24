---
name: dependency-risks
description: Search for software composition analysis (SCA) dependency risks in a SonarQube project
---

# SonarQube — Dependency Risks

Search for dependency risks (software composition analysis issues) in a SonarQube project, paired with the releases that appear in the analysed project, application, or portfolio.

> **Availability:** Requires SonarQube Advanced Security — available on SonarQube Cloud Enterprise edition, or SonarQube Server 2025.4 Enterprise or higher.

## Usage

```
/sonarqube:dependency-risks                    # risks in the current project
/sonarqube:dependency-risks my-project        # risks in a specific project
/sonarqube:dependency-risks my-project --branch feature/auth
/sonarqube:dependency-risks my-project --pr 42
```

## Instructions

### Step 1: Resolve the project key

- If `$ARGUMENTS` contains a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, ask: *"Which SonarQube project would you like to check for dependency risks?"*

### Step 2: Parse optional flags from `$ARGUMENTS`

| Flag | Maps to parameter |
|------|-------------------|
| `--branch <name>` | `branchKey` |
| `--pr <id>` | `pullRequestKey` |

### Step 3: Call `mcp__sonarqube__search_dependency_risks`

```json
{
  "projectKey": "<project-key>",
  "branchKey": "<name>",       // if --branch was given
  "pullRequestKey": "<id>"     // if --pr was given
}
```

### Step 4: Format the results

**If risks are found**, group by severity and present as a table:

```markdown
## Dependency Risks — `my-project` (branch: `main`)

Found **5 dependency risk(s)**:

### Critical
| Dependency | Version | Risk | CVE |
|------------|---------|------|-----|
| log4j-core | 2.14.1 | Remote code execution | CVE-2021-44228 |

### High
| Dependency | Version | Risk | CVE |
|------------|---------|------|-----|
| jackson-databind | 2.12.3 | Deserialization vulnerability | CVE-2021-46877 |
| commons-text | 1.9 | Remote code execution | CVE-2022-42889 |

### Medium
| Dependency | Version | Risk | CVE |
|------------|---------|------|-----|
| spring-web | 5.3.18 | DoS vulnerability | CVE-2022-22965 |
| netty-handler | 4.1.68 | SSL/TLS issue | CVE-2021-43797 |
```

Omit columns that are not present in the response. Omit severity sections that have no risks.

**If no risks are found**:

```markdown
## Dependency Risks — `my-project`

✅ No dependency risks found.
```

### Step 5: Next steps

- To fix a vulnerable dependency: *"Ask me to update `<dependency>` to a safe version."*
- To see overall project health: *"Run `/sonarqube:project-health <project-key>`."*
- To check code-level security issues: *"Run `/sonarqube:list-issues <project-key> --severity HIGH`."*

## Error Handling

If the tool is unavailable or returns an error:

```markdown
Unable to fetch dependency risks.

**Possible causes:**
- This feature requires SonarQube Advanced Security — available on SonarQube Cloud Enterprise edition, or SonarQube Server 2025.4 Enterprise or higher
- MCP server not registered — run `/sonarqube:configuring-sonarqube` so `sonar integrate claude` can wire the SonarQube MCP server, then restart Claude Code
- Credentials not configured — run `/sonarqube:configuring-sonarqube`
- Project key is wrong — verify `sonar-project.properties`
```
