---
name: sonar-measures
description: Disambiguate Sonar analytics requests and route them to the correct measure-related skill
argument-hint: "\"<analytics question or request>\""
allowed-tools: Read, Grep
---

# SonarQube — Measures

Use this skill only when the task is about Sonar analytics data but the correct downstream analytics skill is not yet obvious.

Do not use this skill when the request already clearly matches a concrete skill.
Do not use this skill for generic metric-catalog or rule-metadata requests that should be answered directly by MCP tools.

This router does not write Sonar API commands or perform shared normalization. It only decides which downstream skill should own the request.

This skill covers:

- ambiguous analytics-discovery prompts
- mixed prompts that may fit more than one measure-related skill
- routing guidance for downstream Sonar analytics skills when one of the supported history or portfolio-aggregate skills is the correct owner

## Usage

```
sonar-measures "Summarize the current measures for the Finance portfolio."
sonar-measures "Show quality trends for this project."
sonar-measures "Show severity trends for the Finance portfolio."
sonar-measures "Compare issue-count trend and coverage trend."
```

Representative user requests this skill should handle:

- "Summarize the current measures for this portfolio."
- "Show quality trends for this service."
- "Show severity trends for the Finance portfolio."
- "Compare issue-count trend and coverage trend."

## Instructions

### Step 1: Decide whether the router is needed

- If the request already clearly matches a concrete skill, do not use this router. Invoke the downstream skill directly.
- If the request is only asking which Sonar metrics exist in general, do not use this router. Use the direct metric-discovery MCP tool instead.
- If the request asks for portfolio membership, per-project rankings, top-N projects inside a portfolio, or other portfolio drilldown beyond current aggregate measures, do not route it to `sonar-portfolio-measures`; that skill only covers `/enterprises/portfolio-measures`.
- Use this router only when the request is vague, mixed, or discovery-oriented and you need to choose the correct downstream skill first.

Direct examples that should bypass this router:

- "Graph coverage for main over 90 days." -> `sonar-measures-history`
- "Graph portfolio coverage over the last quarter." -> `sonar-measures-history`
- "Show me issue count over the last month." -> `sonar-issue-count-history`
- "What is the quality gate ratio for this portfolio?" -> `sonar-portfolio-measures`
- "Which projects currently have unresolved vulnerabilities?" -> `sonar-list-issues`

### Step 2: Route ambiguous requests to one owner

Choose exactly one downstream skill before any execution work begins.

| Request shape | Route to |
| ------------- | -------- |
| Time-series numeric metrics over a project, branch, or portfolio | `sonar-measures-history` |
| Time-series issue counts or issue trends by type, severity, status, impact, or rule | `sonar-issue-count-history` |
| Current portfolio aggregate measures from `/enterprises/portfolio-measures` | `sonar-portfolio-measures` |
| Current issue inspection, unresolved vulnerabilities, or issue searches by severity, type, status, or rule | `sonar-list-issues` |

Tie-breakers:

- If the request asks for trends over time, prefer one of the history skills.
- If the request asks for current portfolio aggregate state such as quality-gate ratio, releasability rating, or project-branch counts, prefer `sonar-portfolio-measures`.
- If the request mixes current issue discovery with time-series counts, ask the user which one they want first instead of guessing.
- If the request is discovery-oriented but clearly about issue-count segmentation over time, default to `sonar-issue-count-history`.
- If the request is discovery-oriented but clearly about current portfolio aggregate measures, default to `sonar-portfolio-measures`.
- If the request is discovery-oriented but clearly trend-focused, default to `sonar-measures-history`.

Examples:

- "Summarize the current measures for the Finance portfolio." -> `sonar-portfolio-measures`
- "Show quality trends for this service." -> `sonar-measures-history`
- "Show severity trends for the Finance portfolio." -> `sonar-issue-count-history`
- "Compare issue-count trend and coverage trend." -> ask one clarifying question before routing

### Step 3: Delegate immediately

Once the target skill is chosen, invoke that downstream skill end-to-end.

Do not duplicate auth handling, date-window interpretation, metric validation, paging rules, or endpoint instructions in this router. The downstream skill owns those details.

## Next steps

- For project-branch or portfolio metric trend history: *"Invoke the sonar-measures-history skill."*
- For project-branch or portfolio issue count trend history: *"Invoke the sonar-issue-count-history skill."*
- For current portfolio aggregate measures: *"Invoke the sonar-portfolio-measures skill."*
- For current issue searches: *"Invoke the sonar-list-issues skill."*
