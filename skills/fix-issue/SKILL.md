---
name: fix-issue
description: Fix a specific SonarQube issue in code by rule key and location
argument-hint: "[rule-key] [file-path:line]"
allowed-tools: Read, Edit
---

# SonarQube — Fix Issue

Fix a code quality or security issue identified by SonarQube.

## Usage

```
fix-issue java:S1481 src/main/java/MyClass.java:42
fix-issue python:S2077 src/auth/login.py
fix-issue Remove unused variable in MyClass.java
```

## Instructions

### Step 1: Identify the issue

Parse the user-provided arguments for:
- A rule key (e.g. `java:S1481`, `python:S2077`)
- A file path and optional line number (e.g. `src/auth/login.py:34`)
- Or a plain-language description if no rule key is given

If neither a rule key nor a file path can be determined, ask: *"Which rule and file should I fix?"*

### Step 2: Look up the rule (if a key was given)

Call `mcp__sonarqube__show_rule` with the rule key to retrieve the full rule description,
rationale, and remediation guidance before touching any code. **Do not add extra parameters** (such as `projectKey`) unless the tool schema requires them — after integration, rule lookup usually needs only the rule key.

If the MCP server is unavailable, rely on built-in knowledge of SonarQube rules.

### Step 3: Read the file

Read the full file content. If a line number was given, focus analysis around that line
but read the whole file to understand context.

### Step 4: Apply the fix

- Make the **minimal change** that resolves the rule violation
- Do not refactor surrounding code or fix unrelated issues
- Preserve existing behaviour — the fix must not change what the code does

### Step 5: Explain the change

After editing, briefly explain:
- What the violation was
- Why the rule flags it
- What was changed and why it resolves the issue

### Step 6: Suggest next steps

- *"Invoke the SonarQube analyze skill with `<file>` to confirm no new issues were introduced."*
- *"Invoke the SonarQube list-issues skill with the project key (or `sonar.projectKey` in `sonar-project.properties`) — the CLI always uses `-p`."*
