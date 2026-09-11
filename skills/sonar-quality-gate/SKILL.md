---
name: sonar-quality-gate
description: Show SonarQube quality gate status for a project — pass/fail and each condition (metric key, threshold, actual value), plus worst-offender breakdowns. Project key optional — resolved from `sonar-project.properties` or the MCP integration default.
argument-hint: "[project-key?] [--branch name] [--pr id]"
allowed-tools: Read, Grep, Bash(docker ps:*), Bash(podman ps:*), Bash(nerdctl ps:*), Bash(sonar:*)
---

# SonarQube — Quality gate

Report **only** the quality gate evaluation for a SonarQube project: overall status, every **condition** returned by the API, and worst-offender breakdowns for failing conditions. Do not pull a broad measures dashboard here — for numeric metrics beyond the gate (coverage %, issue counts, ratings as measures, and so on), use **`mcp__sonarqube__get_component_measures`** afterward with the `metricKeys` you care about.

## Usage

```
sonar-quality-gate                       # quality gate for the current project
sonar-quality-gate my-project            # quality gate for a specific project key
sonar-quality-gate my-project --branch release/2.0
sonar-quality-gate my-project --pr 42
```

## Prerequisites

This skill uses the `sonarqube-cli` command **`sonar quality-gate status`** (alias `sonar qg status`) as the primary path — don't invent other ones (e.g. `sonar mcp call` does not exist). Prefer it over the MCP tool: the CLI returns worst-offender breakdowns per failing condition in the same call — see Step 5 — while the MCP tool needs separate follow-up calls (measures, issues) for that detail.

**Before proceeding**, verify `sonar` is available on your PATH and authenticated. If it is **not installed or not authenticated**, the MCP fallback cannot help either — the SonarQube MCP Server is itself started via `sonar run mcp` and shares the CLI's stored credentials (true whenever it was set up through the sonar-integrate skill; doesn't apply if the `sonarqube` MCP server was configured independently, e.g. via a standalone Docker container with its own token) — so skip straight to the message below and recommend the sonar-integrate skill. Only when `sonar` works but `quality-gate status` itself is unavailable (unknown subcommand on an older CLI, or the command errors for another reason) fall back to the MCP tool `mcp__sonarqube__get_project_quality_gate_status` in Step 3.

**If the MCP fallback also fails (for example the tool is unavailable, or no project key can be resolved), narrow down the cause** — check whether the `sonarqube` MCP server is enabled in this agent's configuration.

- **Not enabled / not registered** → recommend running the sonar-integrate skill.
- **Enabled but its tools are still unavailable** → configuration is correct but the server failed to start. The most common cause is that the container runtime is not running — the MCP server launches inside Docker/Podman/Nerdctl via `sonar run mcp`, so a correctly configured server still produces no tools if the daemon is stopped. Run `docker ps` yourself (falling back to `podman ps` / `nerdctl ps`) to confirm which cause applies: if it errors, the runtime is down; after the user starts it, confirm the same command succeeds before asking them to restart the agent session.

Either way, show the user:

> Unable to run `sonar quality-gate status`, reach the SonarQube MCP Server, or resolve a project key.
>
> **Possible causes:**
> - `sonarqube-cli` not installed or not authenticated — invoke the sonar-integrate skill
> - MCP server not registered — invoke the sonar-integrate skill to configure the SonarQube MCP Server, then restart the agent session
> - Container runtime not running — the SonarQube MCP Server runs inside a container (Docker, Podman, or Nerdctl); start your container runtime, then restart the agent session
> - Credentials not configured — invoke the sonar-integrate skill
> - Project key is wrong or no default project in MCP config — pass an explicit key, or verify `sonar-project.properties` / re-run the sonar-integrate skill for this project

Then ask the user (yes/no) whether to run the sonar-integrate skill now. Briefly explain what it does: it checks the SonarQube setup on their machine — installing or updating `sonarqube-cli` and verifying authentication — and re-configures the integration for this agent, including the SonarQube MCP server and secrets-scanning hooks. If they confirm, invoke the sonar-integrate skill yourself and follow it end-to-end in this session, then ask the user to ensure a container runtime (Docker, Podman, or Nerdctl) is running and to restart the agent session so the new MCP tools become available; if they decline, stop.

## Instructions

### Step 1: Resolve the project key (only when needed)

`sonar quality-gate status` does **not require** `-p` — unlike `sonar list issues` (where it's mandatory), it resolves the project from `sonar.projectKey` in `sonar-project.properties` when `-p` is absent. Resolve a key only when you must pass it (the user targets another project, or you fall back to the MCP tool in Step 3 and its schema requires it):

- If the user provided a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, **omit `-p`** on the CLI and let it auto-resolve. For the MCP fallback, **omit `projectKey`** and rely on the integration default instead.

### Step 2: Parse optional filters from the user-provided arguments

| Flag              | CLI option       | MCP parameter (fallback) |
| ----------------- | ---------------- | ------------------------- |
| `--branch <name>` | `--branch`       | `branchKey`                |
| `--pr <id>`        | `--pull-request` | `pullRequestKey`            |

`--branch` and `--pr` are mutually exclusive — if the user passes both, stop and ask which one they mean. Omit flags/keys not provided. If the MCP tool uses different parameter names, follow the schema exposed by your SonarQube MCP server.

### Step 3: Run `sonar quality-gate status`

Before running the command, validate the values you are about to interpolate — project key against `^[a-zA-Z0-9_\-\.:]+$`, `--branch` against `^[a-zA-Z0-9_\-\./]+$`, `--pull-request` digits only (same rules as the sonar-list-issues skill). If any value fails, stop and tell the user what was rejected instead of running the command.

```bash
sonar quality-gate status [-p <project-key>] [--branch <name> | --pull-request <id>] --format json
```

Always use `--format json` and parse it — don't relay the CLI's default `table` output straight to the user; route the parsed result through Step 4's formatting.

The command returns a top-level **`status`** (`OK`, `ERROR`, or other values your server uses) and a **`conditions`** array. Each condition typically includes:

| Field            | Meaning                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `metricKey`      | SonarQube metric identifier for the gate condition                      |
| `status`         | Per-condition result (`OK`, `ERROR`, …)                                 |
| `errorThreshold` | Required bound when the gate defines one (may be absent for some types) |
| `actualValue`    | Value SonarQube compared against the threshold                          |

On a CLI new enough to support it, the same call also returns a **`breakdown`** on each failing condition — see Step 5, don't fetch it separately; if `breakdown` is absent, treat that as "not available", not an error.

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

**If `sonar quality-gate status` itself is unavailable (unknown subcommand on an older CLI, or the command fails for a reason other than a missing/unauthenticated CLI), fall back to `mcp__sonarqube__get_project_quality_gate_status`.** If `sonar` is not installed or not authenticated, don't try the MCP tool — the MCP server runs via `sonar run mcp` and shares the CLI's credentials, so it will be unavailable too — unless the `sonarqube` MCP server was configured independently (e.g. via a standalone Docker container with its own token), in which case the MCP tool may still work, so try it; show the message in Prerequisites and recommend sonar-integrate instead. Include **`projectKey` only if** you resolved one in Step 1 **and** the tool requires it; otherwise omit it and rely on the integration default. Example payload:

```json
{
  "projectKey": "<only-if-required>",
  "branchKey": "<name, if --branch was given>",
  "pullRequestKey": "<id, if --pr was given instead>"
}
```

Include `branchKey` only when `--branch` was given, and `pullRequestKey` only when `--pr` was given — never both (see Step 2). Omit `projectKey` from the payload when the integration default applies. Omit unused keys.

The tool returns the same `status`/`conditions` shape as above, but with **no `breakdown`** — see Step 5.

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
5. **Breakdown (CLI path only)** — When a condition carries a `breakdown` (Step 3's primary CLI path, new enough CLI version), render it as a short indented list under that condition's row using the fields relevant to its category (see Step 5 for the shape per category). Skip this entirely when `breakdown` is absent or you're on the MCP fallback.

If the quality gate payload is missing or analysis has not run, say so clearly instead of inventing values.

### Step 5: Treat failing conditions by category

A failing gate is rarely one flat list — treat each failing condition according to the kind of metric it is. On the **primary CLI path**, this is close to free: `sonar quality-gate status` already groups every failing condition's worst offenders into a `breakdown` (or, on an older CLI without this enrichment yet, no `breakdown` field at all — treat that the same as "not available", not an error). On the **MCP fallback**, the tool gives you `conditions` only, with no breakdown — use the metric key to categorize below, then hand off to the matching skill for detail.

Example `breakdown` on a failing coverage condition (CLI path):

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

If you're on the **primary CLI path** and need to focus on just one category (for example the user asks specifically "why did coverage fail?"), re-run `sonar quality-gate status` with `--category <coverage|duplications|issues|dependency-risks>` (values match the metric groups above; support depends on your CLI version); `--top <n>` controls how many entries each breakdown includes. Leaving `--category` off, as in Step 3, already returns breakdowns for every category at once — only narrow it down on request. On the **MCP fallback** there is no CLI call to re-run: hand off to the matching skill above instead.

### Step 6: Deeper metrics (`get_component_measures`)

To investigate **beyond** the gate (e.g. overall coverage, line coverage, bug counts, detailed ratings), call **`mcp__sonarqube__get_component_measures`** with the same branch/PR context if applicable, and pass `metricKeys` for the measures you need. Add **`projectKey` only when** the tool requires it and you have a resolved key; otherwise rely on the integration default (you can start from the `metricKey` values that failed or from the [SonarQube metric keys](https://docs.sonarsource.com/) documentation).

**If the tool is unavailable, fall back to `sonar api`** (this one *does* require a resolved project key — unlike `sonar quality-gate status` in Step 3, which auto-resolves from `sonar-project.properties` — if none was resolved in Step 1, ask the user or invoke sonar-list-projects, then stop):

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
