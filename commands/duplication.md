---
name: duplication
description: Find files with code duplications in a SonarQube project and inspect duplication blocks for a file (project key optional when MCP integration already defines the default project)
argument-hint: "[project-key?] [--pr id] [--page-size n] [--page n] [--file key]"
allowed-tools: Read, Grep
---

# SonarQube — Duplication

List files that contain duplicated code in a SonarQube project, then drill into **duplication blocks** for a specific file when needed.

## Usage

```
/sonarqube:duplication                              # all duplicated files in the current project (auto-paginated)
/sonarqube:duplication my-project                   # duplicated files in a specific project
/sonarqube:duplication my-project --pr 42           # same, on a pull request
/sonarqube:duplication my-project --page-size 100 --page 2   # single page of results (manual pagination)
/sonarqube:duplication my-project --file src/auth/login.py   # duplication detail for one file
```

## Instructions

### Step 1: Resolve the project key (only when needed)

MCP tools sometimes **do not require** `projectKey` after **`sonar integrate claude`** has stored the default project for this workspace. Resolve a key only when you must pass it (tool schema requires it, or the user targets another project):

- If `$ARGUMENTS` contains a project key, use it.
- Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
- If still not found, **omit `projectKey`** in MCP calls and rely on the integration default.

### Step 2: Parse optional flags from `$ARGUMENTS`

| Flag              | Meaning                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `--pr <id>`       | Pull request context (maps to `pullRequest`)                                                                 |
| `--page-size <n>` | Results per page for **manual** pagination only; integer 1–500 (maps to `pageSize`)                          |
| `--page <n>`      | Page number for **manual** pagination; starts at **1** (maps to `pageIndex`)                                 |
| `--file <key>`    | Skip the duplicated-files list; fetch duplication blocks for this file (maps to `key` in `get_duplications`) |

**Pagination rule:** By default, call `search_duplicated_files` **without** `pageSize` or `pageIndex` so the MCP server auto-fetches every page of duplicated files (up to **10,000** files). Use `pageSize` and `pageIndex` only when the user asks for a specific page or wants to limit page size. If the user supplies `--page-size` but not `--page`, use `pageIndex` **1**.

### Step 3: Run the appropriate flow

#### Flow A — Duplicated file list (default, no `--file`)

Call `mcp__sonarqube__search_duplicated_files`.

**Default (auto-fetch all pages):**

Include **`projectKey` only if** you resolved one in Step 1 **and** the tool requires it; otherwise omit it.

```json
{
  "projectKey": "<only-if-required>",
  "pullRequest": "<id>"
}
```

Omit `pullRequest` when `--pr` was not given. Omit `pageSize` and `pageIndex` entirely so all duplicated files are retrieved automatically. Omit `projectKey` from the payload when the integration default applies.

**Manual pagination (single page):**

```json
{
  "projectKey": "<only-if-required>",
  "pullRequest": "<id>",
  "pageSize": <n>,
  "pageIndex": <n>
}
```

The tool returns **only files that have duplications**. Present results in a table. Include columns the response provides (for example path, duplicated line counts, or density); sort by the strongest duplication signal if multiple metrics exist (for example highest duplicated-lines density or count first).

```markdown
## Duplication — `my-project`

Files with duplications:

| File                 | Duplicated lines (example) |
| -------------------- | -------------------------- |
| src/auth/login.py    | 42                         |
| src/utils/helpers.py | 18                         |
```

If the list is empty: *"No duplicated files were returned for this project/branch/PR."*

Then offer to drill in:

*"Ask me to open duplications for any file, or run `/sonarqube:duplication --file <file-key>` (add a project key only if needed)."`*

#### Flow B — Duplication detail (`--file <key>` given, or user asks to inspect a file)

Call `mcp__sonarqube__get_duplications`:

```json
{
  "key": "<file-key>",
  "pullRequest": "<id>"
}
```

The file key format is `<projectKey>:<path>`, e.g. `my-project:src/auth/login.py`. If the user provides just a path, prepend the resolved project key when you have one; otherwise follow the MCP tool schema for the default project. Omit `pullRequest` when `--pr` was not given.

> **Permission:** This call requires **Browse** permission on the file’s project. If the tool reports forbidden or missing access, say so clearly.

Present duplication **blocks** from the response: for each block, show ranges, sibling copies, or other fields returned by the API so the user can see where code is duplicated.

```markdown
## Duplication detail — `src/auth/login.py`

### Block 1
- Lines 10–24 (example) duplicated in `src/other/helper.py` lines 30–44
...
```

If the file has no duplications in the response, say: *"No duplications were reported for this file."*

### Step 4: Next steps

- To refactor: *"Ask me to extract a shared helper or consolidate the duplicated regions."*
- To scan the same file for issues: *"Run `/sonarqube:analyze <file>`."*
- To check the quality gate (e.g. `new_duplicated_lines_density`): *"Run `/sonarqube:quality-gate` (add a project key only if you are not using the integration default)."*

## Error Handling

If the MCP server is unavailable or the project key is not found:

```markdown
Unable to reach the SonarQube MCP Server, or project key not found.

**Possible causes:**
- MCP server not registered — run `/sonarqube:integrate` so `sonar integrate claude` can wire the SonarQube MCP Server, then restart Claude Code
- Credentials not configured — run `/sonarqube:integrate`
- Project key is wrong or no default project in MCP config — pass an explicit key, or verify `sonar-project.properties` / re-run `/sonarqube:integrate` for this project
```

If `get_duplications` fails with permission errors, mention **Browse** on the project and that the user may need a role with code view access.
