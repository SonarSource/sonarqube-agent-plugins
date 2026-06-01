---
name: sonar-portfolio-measures
description: Fetch SonarQube enterprise portfolio aggregate measures via sonarqube-cli
argument-hint: "[--portfolio-id uuid|--portfolio-name name] [--metric key[,key...]]"
allowed-tools: Read, Grep, Bash(sonar:*)
---

# SonarQube — Portfolio Measures

Use this skill for enterprise portfolio aggregate analytics when the answer should come from `/enterprises/portfolio-measures`.

This skill covers:

- portfolio aggregate metrics
- portfolio name and UUID resolution
- response-body filtering for requested aggregate metrics

## Usage

```
sonar-portfolio-measures --portfolio-id 123e4567-e89b-12d3-a456-426614174000 --metric quality-gate-ratio
sonar-portfolio-measures --portfolio-name "Finance" --metric quality-gate-ratio
sonar-portfolio-measures --portfolio-id 123e4567-e89b-12d3-a456-426614174000 --metric releasability_rating,project_branch_count
sonar-portfolio-measures --portfolio-name "Finance"
```

Representative user requests this skill should handle:

- "What is the quality gate ratio for this portfolio?"
- "Show releasability_rating for this portfolio."
- "Show matched_project_branch_count and project_branch_count for Finance."
- "Summarize the current portfolio measures."

## Command selection

Use the command that matches the current stage of the workflow:

- Portfolio aggregates: use `sonar api GET "/enterprises/portfolio-measures?..."`, then filter the response body to the requested aggregate metrics.

Resolve the portfolio identifier first, then call the portfolio-measures endpoint once and filter the returned payload locally when the user requested specific aggregate metrics.

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

> Unable to fetch Sonar portfolio analytics data.
>
> **Possible causes:**
> - `sonarqube-cli` not installed or not authenticated — invoke the sonar-integrate skill

Then ask the user (yes/no) whether to run the sonar-integrate skill now. If they confirm, invoke the sonar-integrate skill yourself and follow it end-to-end in this session, then re-check and continue; if they decline, stop.

## Instructions

### Step 1: Resolve the portfolio identifier

- Require exactly one portfolio selector:
  - a verified `--portfolio-id` UUID
  - or a `--portfolio-name` that must be resolved to a verified portfolio UUID before continuing
- If both `--portfolio-id` and `--portfolio-name` are supplied, prefer the verified `--portfolio-id` and use the name only as a consistency check when helpful.
- Use only verified enterprise and portfolio UUIDs from the user or Sonar output.
- If the user provided only a portfolio name, resolve it to a verified portfolio UUID using the environment's existing enterprise portfolio lookup flow before continuing.
- If the lookup returns multiple plausible portfolios, ask the user to choose instead of guessing.
- If the lookup returns no matches, stop and tell the user no portfolio was found rather than falling back to a guessed UUID.
- Use the verified `portfolioId` directly after resolution.

### Step 2: Choose the portfolio flow

Use `/enterprises/portfolio-measures` when the user asks for aggregate portfolio metrics:

```bash
sonar api GET "/enterprises/portfolio-measures?portfolioId=<PORTFOLIO_UUID>"
```

Rules:

- The endpoint accepts `portfolioId` only.
- Do not append `metric`, `metricKey`, or any other metric filter to this request.
- If the user requested one or more aggregate metrics, fetch the full payload once and then filter the response body locally to those requested metrics.
- If the user did not request a specific aggregate metric, summarize the relevant aggregate fields returned by the payload.

Key fields to inspect in the response body:

- `releasability_rating`
- `releasability_status_distribution`
- `matched_project_branch_count`
- `project_branch_count`

Supported aggregate filtering in this skill:

- `quality-gate-ratio` -> derive from `releasability_status_distribution`
- `releasability_rating` -> return the raw field
- `releasability_status_distribution` -> return the raw field
- `matched_project_branch_count` -> return the raw field
- `project_branch_count` -> return the raw field

If the user requests multiple aggregate metrics, return only those requested fields and derived values from the fetched payload.
If the user requests an aggregate metric that is not represented in this payload, say that this endpoint does not expose it instead of inventing a mapping.

Quality gate ratio recipe:

1. Read `releasability_status_distribution`.
2. Treat `OK` as passed and `ERROR` as failed.
3. Compute `OK / (OK + ERROR)`.
4. Also report `releasability_rating`.

### Step 3: Format the result

- For portfolio aggregates, report only the requested filtered metrics when the user named specific ones, and include the raw source fields used for any derived value.
- When no aggregate metric filter was requested, summarize the main fields returned by `/enterprises/portfolio-measures`.
