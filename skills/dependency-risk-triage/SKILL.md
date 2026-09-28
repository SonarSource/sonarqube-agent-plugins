---
name: dependency-risk-triage
description: Triage SonarQube or SonarCloud SCA dependency risks by CVE reachability, prepare safe UI writeups, and optionally bundle confirmed package fixes.
argument-hint: "[project-key?] [--branch name] [--pr id] [--fix]"
allowed-tools: Read, Edit, Write, Grep, Glob, Bash(sonar:*), Bash(git:*), Bash(gh:*), Bash(npm:*), Bash(yarn:*), Bash(pnpm:*), Bash(bun:*), Bash(mvn:*), Bash(./mvnw:*), Bash(gradle:*), Bash(./gradlew:*), Bash(pip:*), Bash(pipenv:*), Bash(poetry:*), Bash(uv:*), Bash(bundle:*), Bash(composer:*), Bash(dotnet:*), Bash(cargo:*), Bash(go:*), Agent, AskUserQuestion, mcp__sonarqube__search_dependency_risks, mcp__sonarqube__check_dependency
---

# Dependency Risk Triage

Use this skill to determine whether SonarQube or SonarCloud SCA findings are reachable in the current codebase. A vulnerable package version alone is never a verdict.

## Guardrails

- Retrieve only `OPEN` and `CONFIRMED` findings. Preserve their server order in the final report.
- Never classify a risk as `NOT_VULNERABLE` from a clean search unless the advisory identifies a narrow vulnerable API and the search covers all runtime-reachable code.
- Treat reflection, generated code, framework wiring, plugin loading, configuration-driven execution, and uncertain advisory details as `NEEDS_HUMAN` unless a focused subagent investigation produces decisive evidence.
- Never automatically mark a SonarQube or SonarCloud finding SAFE. Prepare a paste-ready SAFE writeup for the user to apply in the UI.
- Never change the default branch. Never push or create a pull request without explicit user confirmation.
- Use semantic navigation for source code searches. Use shell commands only for repository, package-manager, and Sonar operations.

## 1. Determine scope and mode

Determine whether the request targets one finding, a supplied ordered list, or the full backlog. Ask a question if the scope is ambiguous.

Use report-only mode for questions such as “are we vulnerable?” or when the request does not explicitly ask to fix risks. Use triage-and-fix mode only when the user explicitly requests fixes or passes `--fix`.

Resolve the project and branch from the supplied arguments or the current Sonar integration. Map `--branch <name>` to `branchKey` and `--pr <id>` to `pullRequestKey`. Include an explicit `projectKey` only when the user supplied it, the integration requires it, or you resolved it from project configuration. Otherwise omit it and use the integration default. State the selected project, branch, scope, and mode before fetching findings.

## 2. Fetch and normalize findings

Call `mcp__sonarqube__search_dependency_risks` with `pageIndex: 1` and `pageSize: 50`. Also pass the applicable `projectKey`, `branchKey`, or `pullRequestKey` from Step 1. Omit unused parameters. Fetch subsequent pages until a page contains fewer than 50 results.

Keep only `OPEN` and `CONFIRMED` risks. For each in-scope result, retain its key, CVE or vulnerability ID, severity, status, package name, version, package manager, direct or transitive status, and original result index. Group results by package and package manager.

For each unique package version, call `mcp__sonarqube__check_dependency`. Keep the advisory mechanism, CWEs, fixed and unaffected versions, withdrawal status, and package metadata. If an advisory is withdrawn, classify that finding as `NOT_VULNERABLE` and record the stated withdrawal reason.

## 3. Determine whether the package ships at runtime

Inspect the manifest, lockfile, and relevant build or bundle configuration for every resolved package group. Distinguish runtime dependencies from development, test, annotation-processing, build-only, or bundle-excluded dependencies.

If every occurrence is non-runtime, do not immediately conclude the risk is harmless. First confirm that the advisory cannot be triggered while the build, test, or tooling process handles attacker-controlled input. If that precondition cannot occur, classify all risks in the group as `NOT_VULNERABLE` with scope evidence. Otherwise continue with mechanism analysis.

## 4. Research the vulnerable mechanism

For each risk that remains, identify:

- the vulnerable API, feature, or configuration;
- the precondition and attacker-controlled input;
- the runtime services or modules that ship the package; and
- concrete symbol, call, annotation, or configuration search signals.

Use authoritative vendor advisories, fix commits, GHSA, OSV, or ecosystem databases. Do not use competitor SCA vendor content as an authority. If the mechanism is not sufficiently specific, classify the finding as `NEEDS_HUMAN`.

## 5. Verify reachability

For supported languages, discover declarations with `sonar context navigation search-signatures`, then inspect callers with `trace-callers`. Use `search-bodies` for dynamic JavaScript or TypeScript call patterns. Search configuration and build files only when the mechanism requires them.

Record concise evidence as `file:line` references, or state the exact signal and the runtime scope searched when no call site exists.

Escalate one focused investigation to a subagent when reachability depends on reflection, deserialization, framework auto-wiring, generated code, SPI or plugin loading, configuration-driven parsers, or several runtime services. Give the subagent the CVE, precondition, search signals, and runtime services. If its result is uncertain, use `NEEDS_HUMAN`.

## 6. Assign a verdict

Use exactly one verdict for each finding:

| Verdict | Required condition |
| --- | --- |
| `VULNERABLE` | The vulnerable code ships at runtime, the advisory precondition is reachable, and a fixed version exists. |
| `VULNERABLE_NO_FIX` | The vulnerable code ships at runtime and is reachable, but no upstream fixed version exists. |
| `NOT_VULNERABLE` | The advisory is withdrawn, the dependency is used only for development, testing, or build work and cannot process attacker-controlled input, or a narrow vulnerable API has no call sites after a complete runtime search. Prepare this verdict as a proposed SonarQube or SonarCloud `SAFE` status. |
| `NEEDS_HUMAN` | Reachability, input control, advisory mechanism, or dynamic execution cannot be established with confidence. |

Every verdict needs a concise rationale and one or two evidence items. Do not convert uncertainty into a negative result.

## 7. Report results

Keep the server result order. Report a summary count, then emit an independent fenced block for every finding:

```
Risk: <CVE> — <package>@<version> (Sonar key: <key>)
Verdict: <VULNERABLE|VULNERABLE_NO_FIX|NOT_VULNERABLE|NEEDS_HUMAN>
Fixed version: <version> (required for VULNERABLE only)
Reason: <no more than three short sentences; maximum 400 characters>
Evidence: <file:line or exact search summary>[, <second item>]
```

For `VULNERABLE`, provide the recommended fixed version. For `VULNERABLE_NO_FIX`, omit `Fixed version` and state that no upstream fix exists in `Reason`. For `NOT_VULNERABLE`, add `Proposed UI status: SAFE` before `Reason`. Write `Reason` as a complete, copy-ready explanation that starts with `Not vulnerable because` and names the reachability or non-runtime evidence. Each block must stand alone because the user pastes it into the SonarQube or SonarCloud UI. Do not call a status-change API.

## 8. Remediate only with explicit authorization

Enter this section only in triage-and-fix mode and after the user explicitly confirms the selected fixes, branch push, and pull-request creation.

Create a feature branch from the branch or pull-request head that was triaged. Use the current default branch only when no `--branch` or `--pr` was given. Before applying upgrades, confirm that the reported package version is present on that base. Apply direct dependency upgrades to a fixed version. For transitive dependencies, propose a pin only when it is high or blocker severity and has limited parent fan-out. For lower-severity, high-fan-out, or deeply integrated transitive dependencies, retain the `VULNERABLE` verdict and add a separate manual-remediation note with a suggested pin. Do not change a reachability verdict because its remediation needs human approval.

Regenerate affected lockfiles and run the repository’s relevant validation. Run `sonar analyze dependency-risks` from the repository root to check the remediated dependency graph. Create one commit per package, with all CVEs resolved by that package in its commit message or body. Bundle all confirmed package commits into one pull request. Before publication, scan changed files for secrets and run the available Sonar analysis. Ask for confirmation immediately before `git push` and again immediately before creating the pull request.

## Completion checklist

- Every in-scope OPEN or CONFIRMED finding has one verdict and evidence.
- No `NOT_VULNERABLE` verdict relies on package version alone or an incomplete source search.
- UI writeups are concise, self-contained, and not automatically submitted.
- Fixes, if authorized, use one branch, one commit per package, and one pull request.
