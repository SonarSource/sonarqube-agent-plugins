---
name: fix-issue
description: Fix a specific SonarQube issue in code by rule key and file location
---

# SonarQube — Fix Issue

Fix a code quality or security issue identified by SonarQube.

## Usage

```
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java
/sonarqube:fix-issue python:S2077 src/auth/login.py:34
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java --branch feature/auth
```

## Instructions

### Step 1: Parse `$ARGUMENTS`

Extract:
- **Rule key** — e.g. `java:S1481`, `python:S2077` (required)
- **File path** — e.g. `src/auth/login.py` or `src/auth/login.py:34` (strip line number if present)
- **`--branch <name>`** and/or **`--pr <id>`** — optional filters, passed through as-is

If rule key or file path cannot be determined, ask: *"Which rule and file should I fix? For example: `/sonarqube:fix-issue java:S1481 src/MyClass.java`"*

### Steps 2–4: Fetch the matching issues

Follow the same project key resolution, input validation, and `sonar list issues` steps defined in the `/sonarqube:list-issues` command, using these specific filters:

- `--rules <rule-key>`
- `--component <file-path>` (will be expanded to `<project-key>:<file-path>` per the list-issues instructions)
- `--branch` / `--pr` if provided

If no issues are returned, tell the user:

> "No open issues found for rule `<rule-key>` in `<file-path>`. The issue may already be resolved, or the project/branch may not match. Run `/sonarqube:list-issues` to see all open issues."

If multiple issues are returned for the same rule in the same file, fix all of them.

### Step 5: Read the file

Read the full file. Use line numbers from the issue results to focus analysis, but read the whole file to understand context.

### Step 6: Apply the fix

- Make the **minimal change** that resolves each flagged violation
- Do not refactor surrounding code or fix unrelated issues
- Preserve existing behaviour — the fix must not change what the code does

### Step 7: Explain the change

After editing, briefly explain:
- What the violation was (using the issue message from Step 2–4)
- Why the rule flags it
- What was changed and why it resolves the issue

### Step 8: Suggest next steps

- *"Run `/sonarqube:list-issues <project-key>` to see remaining issues in the project."*
