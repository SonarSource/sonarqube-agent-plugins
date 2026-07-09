---
name: sonar-dependency-risks
description: Search for software composition analysis (SCA) dependency risks in a SonarQube project (project key optional when MCP integration already defines the default project)
argument-hint: "[project-key?] [--branch name] [--pr id]"
allowed-tools: Read, Grep, Bash(docker ps:*), Bash(podman ps:*), Bash(nerdctl ps:*)
---

# SonarQube — Dependency Risks

Search for dependency risks (software composition analysis issues) in a SonarQube project, paired with the releases that appear in the analysed project, application, or portfolio.

## Usage

```
sonar-dependency-risks                    # risks in the current project
sonar-dependency-risks my-project         # risks in a specific project
sonar-dependency-risks my-project --branch feature/auth
sonar-dependency-risks my-project --pr 42
```

## Prerequisites

This skill requires SonarQube Advanced Security (available on SonarQube Cloud Enterprise plan, or SonarQube Server 2025.4 Enterprise edition or higher), the SonarQube MCP Server to be configured, and the tool `mcp__sonarqube__search_dependency_risks` to be available in your session.

**Before proceeding**, verify the tool is accessible. If it is not, do not attempt to call any CLI commands or invent alternatives (e.g. `sonar mcp call` or `sonar dependency-risks` do not exist).

**First, narrow down the cause** — check whether the `sonarqube` MCP server is enabled in this agent's configuration. (This only explains missing tools, not the Advanced Security entitlement — see the first cause below.)

- **Not enabled / not registered** → recommend running the sonar-integrate skill.
- **Enabled but its tools are still unavailable** → configuration is correct but the server failed to start. The most common cause is that the container runtime is not running — the MCP server launches inside Docker/Podman/Nerdctl. Run `docker ps` yourself (falling back to `podman ps` / `nerdctl ps`) to confirm which cause applies: if it errors, the runtime is down.

Either way, show the user:

> Unable to fetch dependency risks.
>
> **Possible causes:**
> - This feature requires SonarQube Advanced Security — available on SonarQube Cloud Enterprise edition, or SonarQube Server 2025.4 Enterprise or higher
> - MCP server not registered — invoke the sonar-integrate skill to configure the SonarQube MCP Server, then restart the agent session
> - Container runtime not running — the SonarQube MCP Server starts inside Docker/Podman/Nerdctl via `sonar run mcp`, so a correctly configured server still produces no tools if the daemon is stopped (i.e. `docker ps` errors). Ask the user to start their container runtime, confirm `docker ps` (or `podman ps` / `nerdctl ps`) succeeds, then restart the agent session
> - Credentials not configured — invoke the sonar-integrate skill
> - Project key is wrong or no default project in MCP config — pass an explicit key, or verify `sonar-project.properties` / re-run the sonar-integrate skill for this project

Then ask the user (yes/no) whether to run the sonar-integrate skill now. Briefly explain what it does: it checks the SonarQube setup on their machine — installing or updating `sonarqube-cli` and verifying authentication — and re-configures the integration for this agent, including the SonarQube MCP server and secrets-scanning hooks. If they confirm, invoke the sonar-integrate skill yourself and follow it end-to-end in this session, then ask the user to ensure a container runtime (Docker, Podman, or Nerdctl) is running and to restart the agent session so the new MCP tools become available; if they decline, stop.

## Instructions

### Step 1: Resolve the project key (only when needed)

MCP tools sometimes **do not require** `projectKey` after the sonar-integrate skill has stored the default project for this workspace. Resolve a key only when you must pass it (tool schema requires it, or the user targets another project):

- If the user provided a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, **omit `projectKey`** in MCP calls and rely on the integration default.

### Step 2: Parse optional flags from the user-provided arguments

| Flag              | Maps to parameter |
| ----------------- | ----------------- |
| `--branch <name>` | `branchKey`       |
| `--pr <id>`       | `pullRequestKey`  |

### Step 3: Call `mcp__sonarqube__search_dependency_risks`

Include **`projectKey` only if** you resolved one in Step 1 **and** the tool requires it; otherwise omit it.

```json
{
  "projectKey": "<only-if-required>",
  "branchKey": "<name>",       // if --branch was given
  "pullRequestKey": "<id>"     // if --pr was given
}
```

Omit `projectKey` from the payload when the integration default applies. Omit unused optional fields.

### Step 4: Format the results

**If risks are found**, group by severity and present as a table:

```markdown
## Dependency Risks — `my-project` (branch: `main`)

Found **5 dependency risk(s)**:

### Critical
| Dependency | Version | Risk                  | CVE            |
| ---------- | ------- | --------------------- | -------------- |
| log4j-core | 2.14.1  | Remote code execution | CVE-2021-44228 |

### High
| Dependency       | Version | Risk                          | CVE            |
| ---------------- | ------- | ----------------------------- | -------------- |
| jackson-databind | 2.12.3  | Deserialization vulnerability | CVE-2021-46877 |
| commons-text     | 1.9     | Remote code execution         | CVE-2022-42889 |

### Medium
| Dependency    | Version | Risk              | CVE            |
| ------------- | ------- | ----------------- | -------------- |
| spring-web    | 5.3.18  | DoS vulnerability | CVE-2022-22965 |
| netty-handler | 4.1.68  | SSL/TLS issue     | CVE-2021-43797 |
```

Omit columns that are not present in the response. Omit severity sections that have no risks.

**If no risks are found**:

```markdown
## Dependency Risks — `my-project`

✅ No dependency risks found.
```

### Step 5: Next steps

- To fix a vulnerable dependency: *"Ask me to update `<dependency>` to a safe version."*
- To check the quality gate: *"Invoke the sonar-quality-gate skill (add a project key only if you are not using the integration default)."*
- To check code-level security issues: *"Invoke the sonar-list-issues skill with the project key (or use `sonar.projectKey` in the repo) with filters as needed — `sonar list issues` always requires `-p`."*
