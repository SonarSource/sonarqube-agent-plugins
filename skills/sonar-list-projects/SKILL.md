---
name: sonar-list-projects
description: List SonarQube projects accessible to the current user
argument-hint: [search-query]
allowed-tools: Bash(sonar:*)
---

# SonarQube — List Projects

List SonarQube projects accessible to the authenticated user. Useful for discovering project keys before running other skills.

## Usage

```
sonar-list-projects                      # list all accessible projects
sonar-list-projects my-project              # search by name or key
```

## Prerequisites

This skill uses the `sonarqube-cli` command. The CLI must be installed and authenticated before proceeding.

**Before proceeding**, verify that `sonar` is available on your PATH and authenticated. If it is not, do not attempt to call any alternative commands or invent alternatives, and show the user:

> Unable to list projects.
>
> **Possible causes:**
> - `sonarqube-cli` not installed or not authenticated — invoke the sonar-integrate skill

Then ask the user (yes/no) whether to run the sonar-integrate skill now. If they confirm, invoke the sonar-integrate skill yourself and follow it end-to-end in this session, then re-check and continue; if they decline, stop.

## Instructions

### Step 1: Parse optional search term from the user-provided arguments

- If the user provided a search term (not a flag), pass it as `--query`.

### Step 2: Validate arguments

If a `--query` search term was provided, validate it matches `^[a-zA-Z0-9_\-\. ]+$`. If it does not, stop and tell the user what was rejected — do not run the command.

### Step 3: Run `sonar list projects`

Build and run the command using a shell command. Use `--page-size 500` and continue paging until the full result set is retrieved.

```bash
sonar list projects --page-size 500 --page <page-number> [--query <search-term>]
```

Only include `--query` if a search term was provided.

Pagination rules:

- Start with `--page 1`.
- Keep incrementing `--page` until the full result set has been retrieved.
- If the CLI exposes a total count, use it to decide when paging is complete.
- If the CLI does not expose a total count, stop when a page returns fewer than `--page-size` results.
- For requests that ask for "all projects" or for any downstream ranking/discovery workflow, do not stop after the first page.

### Step 4: Format the results

**If projects are found**:

```markdown
## SonarQube Projects

Found **8 project(s)**:

| Project key       | Name            |
| ----------------- | --------------- |
| my-org_backend    | Backend Service |
| my-org_frontend   | Frontend App    |
| my-org_shared-lib | Shared Library  |
```

**If no projects are found**:

```markdown
## SonarQube Projects

No projects found. If you expected results, check your authentication with `sonar auth status`.
```

If results required multiple pages, note that the output was assembled from the full paginated result set.

### Step 5: Next steps

- To list issues: *"Invoke the sonar-list-issues skill with the project key, or ensure `sonar.projectKey` is in `sonar-project.properties` — the CLI always requires `-p`."*
- To check the quality gate: *"Invoke the sonar-quality-gate skill — add a project key only if you are not using the MCP integration default."*
