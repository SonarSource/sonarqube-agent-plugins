---
name: analyze
description: Analyze a file or code snippet for quality and security issues using SonarQube
argument-hint: [file-path]
allowed-tools: Read, Glob, Bash(git branch:*)
---

# SonarQube — Code Analysis

Analyze code for quality and security issues using the SonarQube MCP server.

## Usage

```bash
/sonarqube:analyze                        # analyze the file currently in context
/sonarqube:analyze src/auth/login.py      # analyze a specific file
```

## Instructions

### Step 1: Resolve what to analyze

Both analysis tools work on **one file at a time**. Resolve a single file path:

- If `$ARGUMENTS` contains a path, use it.
- If `$ARGUMENTS` is empty, look at the current conversation context for a recently mentioned or edited file.
- If nothing is clear, ask: *"Which file would you like me to analyze?"*

Do not accept a directory as input. If the user provides one, ask them to specify a single file.

### Step 2: Read the file and detect context

1. Read its full content with the `Read` tool.
2. Detect the language from the file extension (needed for the standard tool):

| Extension | Language key |
|-----------|-------------|
| `.py` | `py` |
| `.js` `.jsx` | `js` |
| `.ts` `.tsx` | `ts` |
| `.java` | `java` |
| `.go` | `go` |
| `.php` | `php` |
| `.cs` | `cs` |
| `.rb` | `rb` |
| `.swift` | `swift` |
| `.kt` | `kotlin` |
| `.c` `.cpp` `.cc` `.h` | `cpp` |

3. Detect the SonarQube project key:
   - If `$ARGUMENTS` contains a project key, use it.
   - Otherwise look for `sonar.projectKey` in `sonar-project.properties` at the repo root.
   - If still not found, omit `projectKey` — when the MCP server is configured per-project it already has the project context.

4. Determine the file scope: `"TEST"` if the file path contains `test`, `spec`, or `__tests__`; otherwise `"MAIN"`.

### Step 3: Call the appropriate analysis tool

Two tools may be available depending on whether the connected organization is eligible for Agentic Analysis:

**Try `mcp__sonarqube__run_advanced_code_analysis` first** (available when the organization is eligible for Agentic Analysis).

Before calling it, detect the current branch name using `git branch --show-current`. If git is unavailable, use `main` as a fallback. Then call with:

- `projectKey` — project key if found, otherwise omit
- `branchName` — detected branch name
- `filePath` — project-relative file path (e.g. `src/auth/login.py`)
- `fileContent` — full file content
- `fileScope` — `["TEST"]` or `["MAIN"]`

**If that tool is unavailable, fall back to `mcp__sonarqube__analyze_code_snippet`** (available for all organizations):

- `projectKey` — project key if found, otherwise omit
- `codeSnippet` — full file content
- `language` — detected language key
- `scope` — `"TEST"` or `"MAIN"`

### Step 4: Format the results

**If issues are found**, present them as a table sorted by line number:

```markdown
## SonarQube Analysis — `src/auth/login.py`

Found **3 issue(s)**:

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| 12 | 🔴 Blocker | python:S2077 | Make sure that executing this SQL query is safe here. |
| 34 | 🟠 Major | python:S1481 | Remove the unused local variable "token". |
| 67 | 🟡 Minor | python:S1135 | Complete the task associated to this "TODO" comment. |
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

- If issues were found: *"Run `/sonarqube:fix-issue <rule> <file>:<line>` to fix a specific issue, or ask me to fix them all."*
- If the MCP server is not configured: guide the user to run `/sonarqube:integrate`.
- If the user wants to analyze another file: remind them to run `/sonarqube:analyze <file>`.

## Error Handling

If both `mcp__sonarqube__run_advanced_code_analysis` and `mcp__sonarqube__analyze_code_snippet` are unavailable or return an error:

```markdown
Unable to reach the SonarQube MCP server.

**Possible causes:**
- MCP server not registered — run `/sonarqube:integrate` so `sonar integrate claude` can wire the SonarQube MCP server, then restart Claude Code
- Credentials not configured — run `/sonarqube:integrate`
- Project key is invalid — verify `sonar-project.properties`
```
