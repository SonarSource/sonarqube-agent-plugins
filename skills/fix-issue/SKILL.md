---
description: Fix a specific SonarQube issue in code
---

You are helping the user fix a specific SonarQube/SonarLint issue in their code.

## Task

Fix a code quality issue identified by SonarQube/SonarLint according to the rule specifications.

## Instructions

1. Identify the issue from the user's description or rule key
2. Read the affected file(s)
3. Understand the rule violation and why it was flagged
4. Apply the appropriate fix following SonarQube best practices
5. Explain what was changed and why
6. Verify the fix doesn't introduce new issues

## User Arguments

$ARGUMENTS - Should contain:
- Rule key (e.g., "java:S1234")
- File path
- Line number (optional)
- Or a description of the issue

## Example Usage

```
/sonarqube:fix-issue java:S1481 src/main/java/MyClass.java:42
/sonarqube:fix-issue Remove unused variable in MyClass.java
```

Make minimal, focused changes that address the specific rule violation while maintaining code functionality.
