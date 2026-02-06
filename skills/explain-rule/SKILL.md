---
description: Explain a SonarQube rule and its rationale
disable-model-invocation: true
---

You are helping the user understand a SonarQube/SonarLint rule.

## Task

Explain a SonarQube rule in detail, including its purpose, rationale, and how to fix violations.

## Instructions

1. Look up the rule by its key (e.g., "java:S1234") or description
2. Provide a comprehensive explanation including:
   - What the rule checks for
   - Why it matters (security, maintainability, performance, etc.)
   - Common scenarios where violations occur
   - How to fix violations with code examples
   - Related rules or best practices

## User Arguments

$ARGUMENTS - Should contain a rule key (e.g., "java:S1481") or rule description

## Example Usage

```
/sonarqube:explain-rule java:S1481
/sonarqube:explain-rule unused local variables
```

Use clear, educational language. Include code examples showing both the violation and the fix.
