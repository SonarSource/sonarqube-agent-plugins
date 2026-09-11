---
name: sonar-quality-gate
description: Show SonarQube quality gate status for a project — pass/fail and each condition (metric key, threshold, actual value). Project key optional when MCP integration already defines the default project.
argument-hint: "[project-key?] [--branch name] [--pr id]"
allowed-tools: Read, Grep, Bash(docker ps:*), Bash(podman ps:*), Bash(nerdctl ps:*), Bash(sonar:*)
---

# SonarQube — Quality gate

Report **only** the quality gate evaluation for a SonarQube project: overall status and every **condition** returned by the API. Do not pull a broad measures dashboard here — for numeric metrics beyond the gate (coverage %, issue counts, ratings as measures, and so on), use **`mcp__sonarqube__get_component_measures`** afterward with the `metricKeys` you care about.

## Usage

```
sonar-quality-gate                       # quality gate for the current project
sonar-quality-gate my-project            # quality gate for a specific project key
sonar-quality-gate my-project --branch release/2.0
sonar-quality-gate my-project --pr 42
```

## Prerequisites

This skill requires the SonarQube MCP Server to be configured and the tool `mcp__sonarqube__get_project_quality_gate_status` to be available in your session.

**Before proceeding**, verify the tool is accessible. If it is not, try the `sonar quality-gate status` CLI fallback in Step 3 before giving up. It is a real command (alias `sonar qg status`) — don't invent other ones (e.g. `sonar mcp call` does not exist). Unlike the MCP tool, the CLI command also returns worst-offender breakdowns per failing condition in the same call — see Step 5.

**If the CLI fallback also fails (for example `sonar` not installed/authenticated, or no project key can be resolved), narrow down the cause** — check whether the `sonarqube` MCP server is enabled in this agent's configuration.

- **Not enabled / not registered** → recommend running the sonar-integrate skill.
- **Enabled but its tools are still unavailable** → configuration is correct but the server failed to start. The most common cause is that the container runtime is not running — the MCP server launches inside Docker/Podman/Nerdctl via `sonar run mcp`, so a correctly configured server still produces no tools if the daemon is stopped. Run `docker ps` yourself (falling back to `podman ps` / `nerdctl ps`) to confirm which cause applies: if it errors, the runtime is down; after the user starts it, confirm the same command succeeds before asking them to restart the agent session.

Either way, show the user:

> Unable to reach the SonarQube MCP Server, or project key not found.
>
> **Possible causes:**
> - MCP server not registered — invoke the sonar-integrate skill to configure the SonarQube MCP Server, then restart the agent session
> - Container runtime not running — the SonarQube MCP Server runs inside a container (Docker, Podman, or Nerdctl); start your container runtime, then restart the agent session
> - Credentials not configured — invoke the sonar-integrate skill
> - Project key is wrong or no default project in MCP config — pass an explicit key, or verify `sonar-project.properties` / re-run the sonar-integrate skill for this project

Then ask the user (yes/no) whether to run the sonar-integrate skill now. Briefly explain what it does: it checks the SonarQube setup on their machine — installing or updating `sonarqube-cli` and verifying authentication — and re-configures the integration for this agent, including the SonarQube MCP server and secrets-scanning hooks. If they confirm, invoke the sonar-integrate skill yourself and follow it end-to-end in this session, then ask the user to ensure a container runtime (Docker, Podman, or Nerdctl) is running and to restart the agent session so the new MCP tools become available; if they decline, stop.

## Instructions

### Step 1: Resolve the project key (only when needed)

MCP tools often **do not require** `projectKey` after the sonar-integrate skill has stored the default project for this workspace. Resolve a key only when you must pass it (tool schema requires it, or the user targets another project):

- If the user provided a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, **omit `projectKey`** in MCP calls and rely on the integration default. Unlike `sonar list issues` (where `-p` is mandatory), `sonar quality-gate status` resolves the project from `sonar.projectKey` in `sonar-project.properties` when `-p` is absent, so a missing key doesn't block the Step 3 fallback either — pass `-p` only when targeting a project other than the current one.

### Step 2: Parse optional filters from the user-provided arguments

| Flag              | Maps to parameter |
| ----------------- | ----------------- |
| `--branch <name>` | `branchKey`       |
| `--pr <id>`       | `pullRequestKey`  |

`--branch` and `--pr` are mutually exclusive — if the user passes both, stop and ask which one they mean. Omit keys the MCP tool does not accept. If the tool uses different parameter names, follow the schema exposed by your SonarQube MCP server.

### Step 3: Call `mcp__sonarqube__get_project_quality_gate_status`

Use a single call. Include **`projectKey` only if** you resolved one in Step 1 **and** the tool requires it; otherwise omit it. Example payload:

```json
{
  "projectKey": "<only-if-required>",
  "branchKey": "<name, if --branch was given>",
  "pullRequestKey": "<id, if --pr was given instead>"
}
```

Include `branchKey` only when `--branch` was given, and `pullRequestKey` only when `--pr` was given — never both (see Step 2). Omit `projectKey` from the payload when the integration default applies. Omit unused keys.

The tool returns a top-level **`status`** (`OK`, `ERROR`, or other values your server uses) and a **`conditions`** array. Each condition typically includes:

| Field            | Meaning                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `metricKey`      | SonarQube metric identifier for the gate condition                      |
| `status`         | Per-condition result (`OK`, `ERROR`, …)                                 |
| `errorThreshold` | Required bound when the gate defines one (may be absent for some types) |
| `actualValue`    | Value SonarQube compared against the threshold                          |

**Example (all conditions OK)** — response shape:

```json
{
  "status": "OK",
  "conditions": [
    {
      "metricKey": "reliability_rating",
      "status": "OK",
      "errorThreshold": "2",
      "actualValue": "1"
    },
    {
      "metricKey": "security_rating",
      "status": "OK",
      "errorThreshold": "1",
      "actualValue": "1"
    },
    {
      "metricKey": "new_duplicated_lines_density",
      "status": "OK",
      "errorThreshold": "3",
      "actualValue": "0.0"
    }
  ]
}
```

**Example (failing gate)** — note missing `errorThreshold` on some conditions is normal:

```json
{
  "status": "ERROR",
  "conditions": [
    {
      "metricKey": "new_coverage",
      "status": "ERROR",
      "errorThreshold": "85",
      "actualValue": "82.50562381034781"
    },
    {
      "metricKey": "new_blocker_violations",
      "status": "ERROR",
      "errorThreshold": "0",
      "actualValue": "14"
    },
    {
      "metricKey": "new_sqale_debt_ratio",
      "status": "OK",
      "errorThreshold": "5",
      "actualValue": "0.6562109862671661"
    },
    {
      "metricKey": "reopened_issues",
      "status": "OK",
      "actualValue": "0"
    },
    {
      "metricKey": "open_issues",
      "status": "ERROR",
      "actualValue": "17"
    }
  ]
}
```

**If `mcp__sonarqube__get_project_quality_gate_status` is unavailable, fall back to the CLI.** Pass `-p <project-key>` only if you resolved one in Step 1 — otherwise omit it and let the CLI resolve the project from `sonar.projectKey` in `sonar-project.properties`; if that also fails to resolve a project, ask the user or invoke sonar-list-projects, then stop.

Before running the fallback, validate the values you are about to interpolate — project key against `^[a-zA-Z0-9_\-\.:]+$`, `--branch` against `^[a-zA-Z0-9_\-\./]+$`, `--pull-request` digits only (same rules as the sonar-list-issues skill). If any value fails, stop and tell the user what was rejected instead of running the command.

```bash
sonar quality-gate status [-p <project-key>] [--branch <name> | --pull-request <id>] --format json
```

`--branch` and `--pull-request` are mutually exclusive, same as `--branch`/`--pr` in Step 2. Always use `--format json` and parse it — don't relay the CLI's default `table` output straight to the user; route the parsed result through Step 4's formatting so the report is identical on both the MCP and CLI paths. On a CLI new enough to support it, this single call already returns the same `status`/`conditions` shape as above **plus** a `breakdown` on each failing condition — see Step 5, don't fetch it separately; if `breakdown` is absent, treat that as "not available", not an error.

### Step 4: Format the results

Present a concise report:

1. **Headline** — Map top-level `status` to plain language (e.g. `OK` → passed, `ERROR` → failed). Include project key and branch/PR context if known.
2. **Conditions table** — One row per element of `conditions`, columns at minimum:
   - **Metric** — `metricKey` (humanize lightly if you know the name; otherwise keep the key).
   - **Condition status** — `status`.
   - **Threshold** — `errorThreshold` when present; use `—` when absent.
   - **Actual** — `actualValue` when present; use `—` when absent.

Sort so failing conditions (`ERROR` or non-OK, per server rules) appear **before** passing ones.

3. **Ratings** — For keys like `reliability_rating` / `security_rating`, SonarQube often encodes ratings as numeric grades in the API (for example 1 = A, 5 = E). Mention that interpretation when it helps the user.

4. **No extra measures** — Do not call `get_component_measures` inside this skill unless the user explicitly asks for deeper metrics in the same turn. When they need more detail, tell them the next step (see Step 6).
5. **Breakdown (CLI fallback only)** — When a condition carries a `breakdown` (Step 3's CLI fallback, new enough CLI version), render it as a short indented list under that condition's row using the fields relevant to its category (see Step 5 for the shape per category). Skip this entirely when `breakdown` is absent or you're on the MCP path.

If the quality gate payload is missing or analysis has not run, say so clearly instead of inventing values.

### Step 5: Treat failing conditions by category

A failing gate is rarely one flat list — treat each failing condition according to the kind of metric it is. If you used the **CLI fallback**, this is close to free: `sonar quality-gate status` already groups every failing condition's worst offenders into a `breakdown` (or, on an older CLI without this enrichment yet, no `breakdown` field at all — treat that the same as "not available", not an error). If you're on the **MCP path**, the tool gives you `conditions` only, with no breakdown — use the metric key to categorize below, then hand off to the matching skill for detail.

Example `breakdown` on a failing coverage condition (CLI fallback):

```json
{
  "metricKey": "new_coverage",
  "status": "ERROR",
  "errorThreshold": "85",
  "actualValue": "82.5",
  "breakdown": [
    { "file": "src/auth/login.py", "coverage": "42.0" },
    { "file": "src/utils/helpers.py", "coverage": "58.3" }
  ]
}
```

Group by metric key:

- **Coverage** (`coverage`, `new_coverage`, `branch_coverage`, `line_coverage`, …) — the breakdown lists the worst files by coverage %. Tell the user which files most need tests. For line-level detail on a specific file, hand off to **sonar-coverage**.
- **Duplications** (`duplicated_lines_density`, `new_duplicated_lines_density`, `duplicated_blocks`, …) — the breakdown lists the worst files, each with its duplicate block count and the peer files it duplicates. Suggest extracting a shared helper. For the full duplication blocks, hand off to **sonar-duplication**.
- **Issues & Security** (`violations`, `bugs`, `code_smells`, `reliability_rating`, `sqale_rating`/`new_maintainability_rating`, and — on a CLI new enough to support it — `vulnerabilities`/`security_rating`) — the breakdown is already the actual failing issues (file, line, key, rule, message), usually enough to act on directly. For broader filtering (severities, statuses, other files), hand off to **sonar-list-issues**.
- **Dependency risks** (metric keys starting with `sca_`, e.g. `sca_count_*`, `sca_rating_*`, `sca_severity_*`) — the breakdown is a flat package/version/severity/type list with **no file location**: SCA risks are project-level, not tied to a specific file or line. It reflects unresolved risks already known to the server. For a fresh re-scan of manifests or CVE-level detail, hand off to **sonar-dependency-risks**.

If you used the **CLI fallback** and need to focus on just one category (for example the user asks specifically "why did coverage fail?"), re-run `sonar quality-gate status` with `--category <coverage|duplications|issues|dependency-risks>` (values match the metric groups above; support depends on your CLI version); `--top <n>` controls how many entries each breakdown includes. Leaving `--category` off, as in Step 3, already returns breakdowns for every category at once — only narrow it down on request. On the **MCP path** there is no CLI call to re-run: hand off to the matching skill above instead.

### Step 6: Deeper metrics (`get_component_measures`)

To investigate **beyond** the gate (e.g. overall coverage, line coverage, bug counts, detailed ratings), call **`mcp__sonarqube__get_component_measures`** with the same branch/PR context if applicable, and pass `metricKeys` for the measures you need. Add **`projectKey` only when** the tool requires it and you have a resolved key; otherwise rely on the integration default (you can start from the `metricKey` values that failed or from the [SonarQube metric keys](https://docs.sonarsource.com/) documentation).

**If the tool is unavailable, fall back to `sonar api`** (this one *does* require a resolved project key, unlike Step 3's `sonar quality-gate status` fallback — if none was resolved in Step 1, ask the user or invoke sonar-list-projects, then stop):

```bash
sonar api get "/api/measures/component?component=<project-key>&metricKeys=<comma-separated-keys>[&branch=<name>][&pullRequest=<id>]"
```

If this also fails, show the standard message above — don't guess further commands.

### Step 7: Related skills

Only needed for detail beyond what Step 5's breakdown already gave you:

- **sonar-list-issues** — filter issues/security findings by severity, status, or beyond the top entries already shown.
- **sonar-coverage** — line-by-line coverage detail for a specific file.
- **sonar-duplication** — full duplication blocks for a specific file.
- **sonar-dependency-risks** — a fresh dependency-risk scan or deeper CVE detail.
