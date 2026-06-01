---
name: sonar-issue-count-history
description: Fetch SonarQube project, branch, or portfolio issue count trend history via sonarqube-cli across organizations issue-count-history endpoints
argument-hint: "(project <project-key>|<project-name> [--branch name]) | (portfolio <portfolio-id>|<portfolio-name>) [--start yyyy-mm-dd] [--end yyyy-mm-dd] [--slice-by field] [--impact value[,value...]] [--type value[,value...]] [--rule value[,value...]] [--severity value[,value...]] [--status value[,value...]]"
allowed-tools: Read, Grep, Bash(sonar:*)
---

# SonarQube - Issue Count History

Use this skill for project, branch, or portfolio issue count trend history when the answer should come from Sonar issue-count-history endpoints.

This skill covers:

- issue count history over time
- project key/name, branchId, and portfolio UUID resolution for history queries
- optional issue-series segmentation and filter mapping
- time-series formatting guidance

## Usage

```
sonar-issue-count-history my-project --start 2026-04-28
sonar-issue-count-history "My Project Name" --start 2026-04-28
sonar-issue-count-history my-project --branch release/2.0 --start 2026-04-28 --end 2026-05-28
sonar-issue-count-history my-project --start 2026-04-28 --slice-by TYPE --type BUG,VULNERABILITY
sonar-issue-count-history --portfolio-id 123e4567-e89b-12d3-a456-426614174000 --start 2026-04-28 --slice-by SEVERITY
sonar-issue-count-history --portfolio-name "Code Orchestration" --start 2026-04-28 --severity BLOCKER,HIGH
```

Representative user requests this skill should handle:

- "Show me issue count over the last month."
- "Graph bug counts for main this quarter."
- "How have critical issues changed over the last 30 days?"
- "Show severity trends for the Finance portfolio."

## Command selection

Use the command that matches the current stage of the workflow:

- Project name input: resolve the exact project key with `sonar list projects --query <PROJECT_NAME>`.
- Project key input: resolve the branch entry with `sonar api GET "/api/project_branches/list?project=<PROJECT_KEY>"` and use its `branchId` as `entityId`.
- Portfolio name input: resolve enterprise and portfolio IDs with `sonar api GET` against the enterprise endpoints.
- History fetch: use `sonar api GET "/organizations/issue-count-history?..."`

Do not stay in "raw API mode" for every step just because the final history call uses `sonar api GET`.
Project-name resolution should use `sonar list projects` first, then switch to `sonar api GET` only for branch/entity resolution and history retrieval.

## Prerequisites

This skill uses the `sonarqube-cli` command. The CLI must be installed and authenticated before proceeding.

This skill also uses endpoints that are exclusive to SonarQube Cloud for the time being.
The CLI must be authenticated with a valid SonarQube Cloud instance:
- `sonarcloud.io`
- `sonarqube.us`

**Before proceeding**, verify that `sonar` is available on your PATH and authenticated.

If a Sonar command fails because of sandbox, keychain, or local-state problems, retry the same Sonar command with elevated execution before concluding that authentication is broken.

If the elevated retry succeeds, treat `sonar` as requiring elevated execution for the rest of the current task. Run subsequent `sonar` commands elevated instead of retrying each one in the sandbox first.

Operational notes:

- In sandboxed applications `sonar` may print valid JSON and still exit nonzero because of local-state or keychain problems. Inspect stdout before discarding a result when the payload looks complete.
- Keychain-backed auth may require elevated execution outside the normal sandbox.
- Typical signals include `Failed to access the system keychain`, credential-manager access failures, and `EPERM` writing under `~/.sonar`.
- When requesting elevated execution for Sonar API reads, prefer a reusable approval prefix such as `["sonar","api","GET"]` to avoid repeated approval churn.

If `sonar` still is not available or authenticated after the retry, do not attempt to call any alternative commands or invent alternatives, and show the user:

> Unable to fetch Sonar issue-count history data.
>
> **Possible causes:**
> - `sonarqube-cli` not installed or not authenticated - invoke the sonar-integrate skill

Then ask the user (yes/no) whether to run the sonar-integrate skill now. If they confirm, invoke the sonar-integrate skill yourself and follow it end-to-end in this session, then re-check and continue; if they decline, stop.

## Instructions

### Step 1: Resolve the target entity and entity ID

- Require exactly one target scope:
  - a project key or project name, optionally with `--branch`, for `PROJECT_BRANCH`
  - or a verified `--portfolio-id` UUID for `PORTFOLIO`
  - or a `--portfolio-name` that must be resolved to a verified portfolio UUID before continuing
- If both a project selector and any portfolio selector (`--portfolio-id` or `--portfolio-name`) are supplied, stop and ask the user to choose one scope.
- If both `--portfolio-id` and `--portfolio-name` are supplied, prefer the verified `--portfolio-id` and use the name only as a consistency check when helpful.
- Use only verified project keys, branchIds, and portfolio UUIDs from the user or Sonar output.

#### Project scope (`PROJECT_BRANCH`)

- If the user provided a project key directly, validate it against `^[a-zA-Z0-9_\\-\\.:]+$`.
- If the user provided a project name instead of a key, resolve the exact project key before calling `project_branches/list`.
- Do not use `sonar api GET "/api/components/search_projects?...` to resolve a project name for this skill.
- Use `sonar list projects --query <PROJECT_NAME>` for project-name lookup, because that is the intended search flow and has clearer name/key filtering semantics.
- To resolve a project name, use the same lookup flow as `sonar-list-projects`:

```bash
sonar list projects --page-size 500 --page <PAGE_NUMBER> --query <PROJECT_NAME>
```

- Continue paging until the full matching result set has been checked.
- If the project-name lookup returns multiple plausible projects, ask the user to choose instead of guessing.
- If the project-name lookup returns no matches, stop and tell the user no project was found rather than falling through to the branch lookup.
- For `PROJECT_BRANCH`, resolve the project branch entry with:

```bash
sonar api GET "/api/project_branches/list?project=<PROJECT_KEY>"
```

- For `PROJECT_BRANCH`, use the branch with `isMain: true` when the user did not specify a branch.
- For `PROJECT_BRANCH`, use the `branchId` field from the selected branch entry as the `entityId` for `/organizations/issue-count-history`.
- `branchId` is the preferred UUID-shaped identifier for organizations history calls.
- Do not use `branchUuidV1`; this skill should use `branchId`.
- For `PROJECT_BRANCH`, if the user specified a branch, pick the matching branch entry and use its `branchId`.

#### Portfolio scope (`PORTFOLIO`)

- If the user provided only a portfolio name, resolve the enterprise UUID first if needed:

```bash
sonar api GET "/enterprises/enterprises"
```

- URL-encode every value interpolated into the request path or query string before issuing the command.
  - Example: `Code Orchestration` -> `Code%20Orchestration`

- Then look up the portfolio by name:

```bash
sonar api GET "/enterprises/portfolios?enterpriseId=<ENTERPRISE_UUID>&q=<PORTFOLIO_NAME>"
```

- Use only a verified portfolio UUID returned by Sonar output.
- If the lookup returns multiple plausible portfolios, ask the user to choose instead of guessing.
- Use `entityType=PORTFOLIO` and `entityId=<PORTFOLIO_UUID>` directly after resolution.

### Step 2: Resolve and validate the time range

- Convert relative windows to concrete UTC dates before building commands.
- Use inclusive UTC calendar semantics for relative windows:
  - `"last N days"` and `"past N days"` mean exactly `N` daily UTC points ending on the current UTC date.
  - Compute `startDate = today_utc - (N - 1) days` and `endDate = today_utc`.
  - `"this month"` means the first day of the current UTC month through the current UTC date.
  - `"last month"` means the first day of the previous UTC month through the last day of the previous UTC month.
  - `"this quarter"` means the first day of the current UTC quarter through the current UTC date.
  - `"last quarter"` means the first day of the previous UTC quarter through the last day of the previous UTC quarter.
- Worked examples assuming today is `2026-05-29` UTC:
  - `"last 30 days"` -> `startDate=2026-04-30`, `endDate=2026-05-29`
  - `"this quarter"` -> `startDate=2026-04-01`, `endDate=2026-05-29`
  - `"last quarter"` -> `startDate=2026-01-01`, `endDate=2026-03-31`
- Validate `--start` and `--end` as `YYYY-MM-DD`.
- `startDate` more than one year in the past is rejected by the organizations history endpoints.
- If `--end` is omitted, let the endpoint use its default latest bound.

### Step 3: Validate and map issue-count filters

- Use `/organizations/issue-count-history`; do not invent an issue-count metric key.
- Default to one aggregate line when the user did not request a breakdown.
- Only pass filters the user explicitly asked for.
- Preserve the user-supplied value order within each comma-separated filter list.
- URL-encode every value interpolated into the request path or query string before issuing the command.
- Accept these user-facing filters and map them to the API params:
  - `--slice-by` -> `sliceBy`
  - `--impact` -> `impacts`
  - `--type` -> `issueTypes`
  - `--rule` -> `ruleKeys`
  - `--severity` -> `severities`
  - `--status` -> `statuses`
- Validate every user-supplied filter before building the request. If any value fails validation, stop and tell the user what was rejected and why - do not run the command.
- Validation rules:
  - `--slice-by` must be one of `RULE_KEY`, `SEVERITY`, `SOFTWARE_QUALITY`, `STATUS`, `TYPE`
  - `--impact` must be a comma-separated list of values matching `^[A-Z_]+$`
  - `--type` must be a comma-separated subset of `BUG`, `CODE_SMELL`, `SECURITY_HOTSPOT`, `VULNERABILITY`
  - `--rule` must be a comma-separated list of values matching `^[a-zA-Z0-9_\\-:]+$`
  - `--severity` must be a comma-separated subset of `BLOCKER`, `HIGH`, `INFO`, `LOW`, `MEDIUM`
  - `--status` must be a comma-separated subset of `ACCEPTED`, `CLOSED`, `CONFIRMED`, `FALSE_POSITIVE`, `FIXED`, `OPEN`, `RESOLVED`, `REVIEWED`, `TO_REVIEW`

### Step 4: Run the issue-count-history endpoint

```bash
sonar api GET "/organizations/issue-count-history?entityId=<ENTITY_ID>&entityType=<PROJECT_BRANCH|PORTFOLIO>&startDate=<YYYY-MM-DD>T00:00:00Z[&endDate=<YYYY-MM-DD>T00:00:00Z][&sliceBy=<FIELD>][&impacts=<VALUE[,VALUE...]>][&issueTypes=<VALUE[,VALUE...]>][&ruleKeys=<VALUE[,VALUE...]>][&severities=<VALUE[,VALUE...]>][&statuses=<VALUE[,VALUE...]>]"
```

Rules:

- Required params: `entityId`, `entityType`, `startDate`
- Optional params: `endDate`, `sliceBy`, `impacts`, `issueTypes`, `ruleKeys`, `severities`, `statuses`
- Use `entityType=PROJECT_BRANCH` with the resolved `branchId` for project or branch history.
- Use `entityType=PORTFOLIO` with the verified portfolio UUID for portfolio history.
- Omit `sliceBy` for one aggregate line.
- Do not pass `sliceBy=NONE`.
- Counts carry forward on days with no new analysis.
- Resolution is daily UTC.
- History can still have gaps when analysis is sparse.

Hints:

- For long time periods or heavily segmented requests, the result can be large and should be cached or saved.

### Step 5: Format the result

- For trend questions, render every returned series and state the UTC date range used.
- State whether the history scope is a project branch or a portfolio.
- If the user did not specify how to format the result, default to a table with one row per date and one column per returned series.
- Use one aggregate series when `sliceBy` is omitted.
- Use one series per returned segment when `sliceBy` is present.
- If the user explicitly asked to graph or visualize the history, a chart is acceptable, but do not make charts the default.
- If filters narrow the data to one segment while `sliceBy` is still present, present the segmented result returned by the endpoint rather than collapsing it manually.
- If analysis is sparse or missing on some days, say that explicitly rather than smoothing over gaps.
