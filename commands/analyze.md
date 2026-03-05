---
name: analyze
description: Analyze a file or code snippet for quality and security issues using SonarQube
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

`mcp__sonarqube__analyze_code_snippet` analyzes **one file at a time**. Resolve a single file path:

- If `$ARGUMENTS` contains a path, use it.
- If `$ARGUMENTS` is empty, look at the current conversation context for a recently mentioned or edited file.
- If nothing is clear, ask: *"Which file would you like me to analyze?"*

Do not accept a directory as input. If the user provides one, ask them to specify a single file.

### Step 2: Read the file and detect context

1. Read its full content with the `Read` tool.
2. Detect the language from the file extension:

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

3. Detect the SonarQube project key (use the first that exists):
   - `sonar.projectKey` in `sonar-project.properties` at the repo root
   - The `SONARQUBE_ORG` environment variable as a fallback prefix

### Step 3: Call `mcp__sonarqube__analyze_code_snippet`

Call the tool with:
- `projectKey` — project key if found, otherwise omit
- `codeSnippet` — full file content
- `language` — detected language key
- `scope` — `"TEST"` if the file path contains `test`, `spec`, or `__tests__`; otherwise `"MAIN"`

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

Severity icons:
- 🔴 Blocker / Critical
- 🟠 Major
- 🟡 Minor
- 🔵 Info

**If no issues are found**:

```markdown
## SonarQube Analysis — `src/auth/login.py`

✅ No issues found.
```

### Step 5: Next steps

After the results, always add:

- If issues were found: *"Run `/sonarqube:fix-issue <rule> <file>:<line>` to fix a specific issue, or ask me to fix them all."*
- If the MCP server is not configured: guide the user to run `/sonarqube:configure`.
- If the user wants to analyze another file: remind them to run `/sonarqube:analyze <file>`.

## Error Handling

If `mcp__sonarqube__analyze_code_snippet` is unavailable or returns an error:

```markdown
Unable to reach the SonarQube MCP server.

**Possible causes:**
- MCP server is not running — check `.mcp.json` and restart Claude Code
- Credentials not configured — run `/sonarqube:configure`
- Project key is invalid — verify `sonar-project.properties`
```
