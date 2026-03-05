---
name: explain-rule
description: Explain a SonarQube rule — what it detects, why it matters, and how to fix violations
---

# SonarQube — Explain Rule

Explain a SonarQube rule in detail, including its rationale and how to fix violations.

## Usage

```
/sonarqube:explain-rule java:S1481
/sonarqube:explain-rule python:S2077
/sonarqube:explain-rule unused local variables
```

## Instructions

### Step 1: Identify the rule

Parse `$ARGUMENTS` for a rule key (e.g. `java:S1481`) or a plain-language description.

If nothing is provided, ask: *"Which rule would you like me to explain?"*

### Step 2: Look up the rule

If a rule key was given, call `mcp__sonarqube__show_rule` to retrieve the authoritative
rule definition, description, and remediation guidance from SonarQube.

If the MCP server is unavailable or only a description was given, use built-in knowledge
of SonarQube rules.

### Step 3: Explain the rule

Structure the explanation as:

1. **What it detects** — describe the pattern or construct the rule flags
2. **Why it matters** — security risk, reliability issue, maintainability concern, etc.
3. **Common scenarios** — typical code patterns that trigger a violation
4. **How to fix it** — concrete remediation steps with a before/after code example
5. **Related rules** — mention closely related rules if relevant

Use plain language. Include code examples in the appropriate language when possible.

### Step 4: Suggest next steps

- *"Run `/sonarqube:analyze <file>` to check if your code has this violation."*
- *"Run `/sonarqube:fix-issue <rule> <file>:<line>` to fix a specific occurrence."*
