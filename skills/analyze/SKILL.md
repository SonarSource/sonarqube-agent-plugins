---
name: analyze
description: Analyze a file or code snippet for quality and security issues using SonarQube
argument-hint: [file-path]
allowed-tools: Read, Glob, Bash(git branch:*)
---

# SonarQube — Code Analysis

Analyze code for quality and security issues using the SonarQube MCP Server.

## Usage

```
analyze                        # analyze the file currently in context
analyze src/auth/login.py      # analyze a specific file
```

## Prerequisites

This skill requires the SonarQube MCP Server to be configured and at least one of the tools `mcp__sonarqube__run_advanced_code_analysis`, `mcp__sonarqube__analyze_code_snippet`, or `mcp__sonarqube__analyze_file_list` to be available in your session.

**Before proceeding**, verify at least one of these tools is accessible. If none are, stop immediately — do not attempt to call any CLI commands or invent alternatives — and tell the user:

> Unable to reach the SonarQube MCP Server.
>
> **Possible causes:**
> - MCP server not registered — invoke the SonarQube integrate skill to configure the SonarQube MCP Server, then restart the agent session
> - Credentials not configured — invoke the SonarQube integrate skill
> - Project key missing or invalid — pass an explicit key if needed, verify `sonar-project.properties`, or re-run the SonarQube integrate skill so the MCP default project is set

## Instructions

### Step 1: Resolve what to analyze

Both analysis tools work on **one file at a time**. Resolve a single file path:

- If the user provided a file path, use it.
- If no path was provided, look at the current conversation context for a recently mentioned or edited file.
- If nothing is clear, ask: *"Which file would you like me to analyze?"*

Do not accept a directory as input. If the user provides one, ask them to specify a single file.

### Step 2: Read the file and detect context

1. Read the file's full content (needed for the fallback tool and language detection).
2. Detect the language from the file extension (needed for the standard tool):

| Extension              | Language key |
| ---------------------- | ------------ |
| `.py`                  | `py`         |
| `.js` `.jsx`           | `js`         |
| `.ts` `.tsx`           | `ts`         |
| `.java`                | `java`       |
| `.go`                  | `go`         |
| `.php`                 | `php`        |
| `.cs`                  | `cs`         |
| `.rb`                  | `rb`         |
| `.swift`               | `swift`      |
| `.kt`                  | `kotlin`     |
| `.c` `.cpp` `.cc` `.h` | `cpp`        |

3. Determine the file scope: `"TEST"` or `"MAIN"`. Use the file path to deduce the scope. For example, if the file path contains `test`, `spec`, or `__tests__`, it's likely `"TEST"` scope.

### Step 3: Call the appropriate analysis tool

After running the SonarQube integrate skill, the SonarQube MCP Server often has a **default project** for this workspace, so **`projectKey` is sometimes unnecessary** — pass it only when the tool schema requires it or the user targets another project.

Two tools may be available depending on whether the connected organization is eligible for Agentic Analysis:

**Try `mcp__sonarqube__run_advanced_code_analysis` first** (available when the organization is eligible for Agentic Analysis).

Before calling it, detect the current branch name using `git branch --show-current`. If git is unavailable, use `main` as a fallback.

Then call with:

- `projectKey` — **omit unless the tool requires it** (initial MCP configuration usually supplies the default project); if required, use the value from the user's arguments if provided, otherwise `sonar.projectKey` in `sonar-project.properties` at the repo root
- `branchName` — detected branch name
- `filePath` — project-relative file path (e.g. `src/auth/login.py`)
- `fileContent` — full file content; **only pass if the tool requires it** (when the MCP server has a mount, it reads the file directly and this parameter will not be required)
- `fileScope` — `["TEST"]` or `["MAIN"]`

**If that tool is unavailable, fall back to `mcp__sonarqube__analyze_code_snippet` or `mcp__sonarqube__analyze_file_list`** (available for all organizations):

- `projectKey` — **omit unless the tool requires it**; resolve the same way as above when needed
- `filePath` — project-relative file path (e.g. `src/auth/login.py`)
- `codeSnippet` — full file content (optional; provide to narrow analysis to a specific snippet)
- `language` — detected language key
- `scope` — `"TEST"` or `"MAIN"`

### Step 4: Format the results

**If issues are found**, present them as a table sorted by line number:

```markdown
## SonarQube Analysis — `src/auth/login.py`

Found **3 issue(s)**:

| Line | Severity  | Rule         | Message                                               |
| ---- | --------- | ------------ | ----------------------------------------------------- |
| 12   | 🔴 Blocker | python:S2077 | Make sure that executing this SQL query is safe here. |
| 34   | 🟠 Major   | python:S1481 | Remove the unused local variable "token".             |
| 67   | 🟡 Minor   | python:S1135 | Complete the task associated to this "TODO" comment.  |
```

Severity icons (the label depends on the server version):
- 🔴 Blocker
- 🟠 Critical / High
- 🟡 Major / Medium
- 🔵 Minor / Low
- ⚪ Info

**If no issues are found**:

```markdown
## SonarQube Analysis — `src/auth/login.py`

✅ No issues found.
```

### Step 5: Next steps

After the results, always add:

- If issues were found: *"Invoke the SonarQube fix-issue skill with `<rule> <file>:<line>` to fix a specific issue, or ask me to fix them all."*
- If the MCP server is not configured: guide the user to invoke the SonarQube integrate skill.
- If the user wants to analyze another file: remind them to invoke the SonarQube analyze skill with the file path.
