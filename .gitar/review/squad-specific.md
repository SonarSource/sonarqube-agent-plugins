# Agent plugin review focus

Apply these checks only when the diff touches the relevant behavior.
Leave an advisory finding only for a concrete failure supported by the changed
code and its callers; name the failing scenario and source location.
Update an existing thread for the same concern, preserve unresolved evidence,
and remain quiet when the checks pass. Do not approve, block, or modify the PR.

## CLI, MCP, and recorded state

- For skill, hook, or setup changes, verify CLI commands and MCP tool names
  against the supported CLI/server interface rather than inventing replacements.
  Check arguments, feature IDs, and recorded state shapes used by the caller.
- `mcp.json` launches `sonar run mcp`; `skills/sonar-integrate/SKILL.md`
  describes integration, and `scripts/setup.js` reads legacy and declarative
  installed features from CLI state. Trace the changed path before claiming
  a command or state transition is incompatible.
- Cite the actual supported version and failing invocation or state example.
  If the external contract cannot be verified, explain the specific uncertainty
  only when it is material to the changed behavior.

## Host counterparts

- When shared behavior changes, inspect the relevant counterpart in `.claude-plugin/`,
  `.github/plugin/`, `.cursor-plugin/`, `.codex-plugin/`, `.factory-plugin/`,
  `plugin.json`, or `kiro-power/mcp.json` only where that host uses the behavior.
- `agents/sonarqube-reviewer.agent.md` and `droids/sonarqube-reviewer.md` share
  reviewer behavior with intentionally different tool/frontmatter capabilities.
  Check body consistency when affected, preserving required host differences.
- Report a missed counterpart only with evidence of a broken supported workflow.
  Do not demand identical manifests, hook support, or configuration across hosts.
