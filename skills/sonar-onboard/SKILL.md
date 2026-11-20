---
name: sonar-onboard
description: "Connects the current repository to a SonarQube project through `sonar init`: logs in, selects the organization, links an existing project or creates one bound to the repository, and reports its analysis results. Use when the user asks to set up SonarQube for this repository, onboard or connect it to SonarQube, find security vulnerabilities, or check this repo's code quality, when the repository is not linked to a SonarQube project yet, or to add the remaining project roots of a partly onboarded monorepo. It reuses a SonarQube project that already exists for the repository. To wire the agent itself (hooks, MCP Server), use sonar-integrate instead."
argument-hint: "[--path directory] [--monorepo]"
allowed-tools: Read, Glob, Bash(sonar:*), Bash(which:*), Bash(Get-Command:*), Bash(curl:*), Bash(irm:*), Bash(iex:*), Bash(brew:*), Bash(mise:*), Bash(find:*)
---

# SonarQube — Onboard a repository

Guide the user through **`sonar init`**, which logs in, selects the organization, links an existing SonarQube project or creates one bound to the repository, and saves the mapping in `.sonar-config.json`. `sonar init` owns the onboarding logic: run it, relay what it reports, and pass the user's decisions to it as flags. Do not recreate its steps with other commands (`sonar import`, `sonar link`, `sonar api`).

`sonar init` keeps everything it completed. Running it again resumes from what is already in place, so a rerun is always how an interrupted or failed onboarding continues.

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

## Usage

```
sonar-onboard                        # onboard the current directory
sonar-onboard --path services/api    # onboard another directory of the repository
sonar-onboard --monorepo             # onboard several project roots of a monorepo
```

## Prerequisites

1. Run `sonar --version` (macOS/Linux) or `sonar.exe --version` (Windows) yourself. If `sonar` is not found, invoke the sonar-install-cli skill, then come back here. If it reports **not installed**, stop.
2. If `sonar init` rejects an option as unknown, the CLI is too old for this skill; it stops before doing anything. Invoke the sonar-install-cli skill to update it, then rerun the same command. Likewise, if `sonar init` rejects a run with `--bind does not apply with --monorepo`, the CLI predates monorepo binding: offer to update it the same way, or to map existing projects only (bare `--link`) instead.

## Guardrails

- Always pass `--non-interactive`: a prompt would wait for input you cannot type. When `sonar init` needs an answer, it stops and names the flags that would answer it.
- Only two ways to onboard exist: **link** an existing project (`--link`) or **bind**, creating a SonarQube Cloud project imported from the repository (`--bind`). Never pass or suggest any other way.
- Never create or link a project without the user confirming a `--dry-run` preview of that exact command.
- Never run `sonar auth login`, organization creation or a browser authorization yourself, and never ask the user to paste a token into the chat.
- Never suggest `--bind` for a repository that `sonar init` found an existing project for: it only offers `--link` then, and refuses to create a second project. If the user wants a separate project, tell them `sonar init` does not create one for a repository that already has a project.
- Never delete or rewrite `.sonar-config.json`, projects or credentials to start over.
- Never run `sonar integrate` or the sonar-integrate skill unless the user accepts it in Step 7. Every exit of this skill ends in Step 7, whether onboarding completed, was cancelled or failed, except when the user is not logged in.
- Never treat the repository as a monorepo on your own: only when the user passed `--monorepo`, said it holds several projects, or chose it in Step 1.1 after detection found several build roots or unmapped ones.

Validate every value before interpolating it into a command. If a value fails, stop and tell the user what was rejected instead of running the command.

| Value                                | Allowed pattern                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| project key (`--link`, `--root`)     | `^[a-zA-Z0-9_\-\.:]+$`, with at least one non-digit                                   |
| `--path`, `--root` path              | relative path matching `^[a-zA-Z0-9_.][a-zA-Z0-9_\-./]*$`, without `..`               |
| organization key (`sonar auth org`)  | `^[a-zA-Z0-9_\-]+$`                                                                   |

## Instructions

### Step 1 — Inspect the current state

1. Detect the build roots: follow [references/detect-monorepo-projects.md](references/detect-monorepo-projects.md) on the repository root. It only reads files. Skip it only when the user named one directory with `--path`. A root counts as mapped when `.sonar-config.json` at the repository root maps it; without that file, nothing is mapped. Then:
   - **`.sonar-config.json` already maps one or more roots, and some detected build roots are not mapped:** list the mapped roots and the unmapped ones (path, build system, name), and ask with a selector: **Onboard the remaining roots** (Recommended) / **Leave the setup as it is**. Onboarding them takes the monorepo path in Step 4, with only the unmapped roots and `--bind` as the recommended way to create their projects. The mapped roots are left as they are. If a mapped root is the repository root itself and the unmapped roots sit inside it, say that its project may already analyze their files. Leaving the setup as it is continues with Step 1.2.
   - **`.sonar-config.json` already maps every detected build root:** continue with Step 1.2, without mentioning the detection.
   - **The user asked for a monorepo:** keep the roots for Step 4 → Monorepo. If fewer than two were found, say so and show what was checked for. Then offer a selector: **Onboard as a single project** / **Name the roots myself**.
   - **The user did not ask, nothing is mapped yet, and two or more roots were found:** list them (path, build system, name) and ask with a selector: **Onboard as a single project** / **Onboard as a monorepo, one project per root**, in that order, without marking either as recommended. A monorepo choice keeps the roots for Step 4 → Monorepo.
   - **Otherwise:** continue as a single project, without mentioning the detection.
2. Run `sonar auth status` yourself. Note the connected server and organization. If not authenticated, go to Step 2.
3. Run `sonar init --non-interactive --dry-run` yourself, adding `--path <directory>` when the user named another directory, and `--monorepo` (with any `--root` already agreed in Step 4) for a monorepo. A dry run writes nothing. Act on what it reports:
   - **Nothing left to set up:** Step 6, using the mapped project.
   - **A decision is needed** (it names the flags that would answer it): Step 4.
   - **Not signed in:** Step 2.
   - **The account has no organization:** Step 3.
   - **Anything else:** relay the message and its hint as printed. When the hint names `sonar auth org`, offer the organization it names, or the result of `sonar list orgs`, as a selector; on confirmation run `sonar auth org <key>` yourself, then repeat this step. Leave any other fix, such as relinking `.sonar-config.json`, to the user.

### Step 2 — Login

Invoke the sonar-login skill. It selects the connection type, builds the `sonar auth login` command for the user to run, and verifies the login. Once it reports a successful login (the connected server, plus the organization for SonarQube Cloud), repeat Step 1.3. If the user stops without logging in, tell them nothing was set up, that rerunning this skill resumes from the login, and stop: do not offer `sonar integrate`, which needs a login too.

### Step 3 — No organization

Only an interactive `sonar init` can create a first organization. Ask the user to run `sonar init` in their own terminal and to stop once the organization exists (they may continue there instead; Step 1 picks up whatever they completed). When they confirm, repeat Step 1. If `sonar init` reported that organization creation is not available, relay its hint (an administrator must add them to an organization), then go to Step 7. The same applies if the user declines to create an organization.

### Step 4 — Agree on the project

Present only the options `sonar init` named, as a single-choice selector, in the user's terms. Whenever `--bind` is among them, list it first and label it **(Recommended)**; never mark `--link <key>` as recommended over it.

- **`--bind`** — create a new SonarQube Cloud project imported from the repository's DevOps platform. The server analyzes it automatically.
- **`--link`** — reuse the existing project found for this repository. **`--link <key>`** reuses a project the user names. If the user does not know the key, suggest `sonar.projectKey` from `sonar-project.properties` when that file exists, or invoke the sonar-list-projects skill.

When `sonar init` names only `--link <key>` (no SonarQube Cloud connection, no git remote, or a remote that is not GitHub or Azure DevOps), the only way forward is to link a project that already exists. If the user has none, tell them `sonar init` cannot create a project for this directory, then go to Step 7.

#### Monorepo

Only for a monorepo the user asked for or chose in Step 1.1 (see Guardrails). A non-interactive `sonar init --monorepo` cannot show its folder tree, and without `--root` it only reports the roots already mapped, so agree on the roots first:

1. Start from the build roots detected in Step 1.1, leaving out those already mapped in `.sonar-config.json`. If detection was skipped, run it now as described there.
2. Show them as a multi-choice selector, with all preselected, labelled by path, build system and name. The user can also name other paths, for example for a build system the detection does not scan.
3. Reuse existing projects without asking. Pass `--root <path>=<key>` for a root whose `sonar-project.properties` names a `sonar.projectKey`, and `--root <path>` for the others. Validate every path and key against the table above. Then run `sonar init --non-interactive --dry-run --monorepo` with these roots, plus `--bind` when binding is possible (SonarQube Cloud with a GitHub or Azure DevOps remote) or bare `--link` otherwise. For every root reported as `Project '<key>' already exists, and nothing says whether <path> belongs to it`, the generated key belongs to an existing project: map the root to it with `--root <path>=<key>`. Do not ask the user about any of this; the Step 5 preview shows every mapping, and **Change the plan** there lets them use other keys.
4. Only if some chosen roots still have no project, ask how to provision them, as a single-choice selector:
   - **Bind to the repository** (`--bind`) **(Recommended)** — only when binding is possible. All new roots are created in one import from the DevOps platform. Onboarding does not start their analysis.
   - **Only map existing projects** (bare `--link`) — never creates a project; roots without one are skipped.

   When binding is not possible, do not ask: use bare `--link`, and say which roots cannot be onboarded because they have no existing project. When every chosen root has a project, do not ask either: use bare `--link`.
5. Pass `--monorepo`, the chosen flag and one `--root` per chosen root. Always pass the flag: without it, a non-interactive run fails every root that has no project yet. `--link <key>` does not apply with `--monorepo`; name each root's key with `--root <path>=<key>` instead. Roots already mapped in `.sonar-config.json` are left as they are.

### Step 5 — Preview, confirm, then apply

1. Run the chosen command with `--non-interactive --dry-run` yourself and show the user its `Would ...` lines: the project key and name, the organization, and any browser authorization it needs. For a monorepo, show each root under its section (`Would be created and bound to the repository`, `Would be mapped to the existing project`). If the preview says the organization is not linked to your DevOps platform yet, tell the user that applying will first need a browser authorization (item 4).
2. Ask for confirmation with a selector: **Apply** / **Change the plan** / **Cancel**. On a change, go back to Step 4; on cancel, say nothing was created and go to Step 7.
3. Run the same command without `--dry-run` yourself.
4. If it stops because the organization is not linked to its DevOps platform (single project or `--monorepo --bind`), give the user the authorization link it printed, wait until they confirm they authorized it, then rerun the same command. If they decline the authorization, do not rerun it: offer a selector of **Link an existing project** (`--link <key>`, or `--root <path>=<key>` for a monorepo; back to Step 4, then Step 5 again) / **Cancel** (go to Step 7).
5. For a monorepo, act on each root listed under `Failed` in the summary, then rerun the command with the adjusted roots (roots already mapped are skipped):
   - `Project '<key>' already exists, and nothing says whether <path> belongs to it` — the generated key belongs to an existing project. Map the root to it (`--root <path>=<key>`) without asking, and preview the adjusted command again from Step 5.1.
   - `--bind is unavailable` or `Repository '<slug>' cannot be bound` — relay the reason, then offer **Map it to an existing project** (validate the key, then `--root <path>=<key>`) / **Skip this root** / **Cancel** (go to Step 7).
   - `No project was linked or created` or `Project '<key>' already exists and was not linked` — the root has no project it may be mapped to. Offer **Map it to an existing project** (validate the key, then `--root <path>=<key>`) / **Skip this root**, plus **Bind to the repository** (`--bind`) when binding is possible and was not the chosen flag.

### Step 6 — Report the result

Keep three states apart and say which one applies:

- **Setup complete** — `.sonar-config.json` maps the directory to a project. This is what a successful onboarding produces, with or without analysis results.
- **Analysis started** — the server-side analysis of a newly imported project is still running. Its results are not known yet: report no numbers.
- **Analysis completed** — `sonar init` printed `Analysis completed.` with a quality gate status and issue counts.

Missing results are not zero findings: `not available`, `No analysis results` or a pending analysis means unknown, never clean. A failed quality gate judges the code, not the setup: onboarding still succeeded, and the gate's failures are findings to work on. For a project that already existed (linked or already onboarded), the results are the last analysis on the server: say that they do not cover the user's uncommitted local changes.

Print a summary:

```
✅ This repository is set up in SonarQube.

  Project:       <project-key> — <dashboard link printed by sonar init>
  Setup:         <linked to an existing project | created and bound to <repository>>
  Analysis:      <completed | started, results not known yet | pending on the server | not run | last server analysis, not your local changes>
  Quality gate:  <passed | passed with warnings | failed | not available>
```

Omit the quality gate line when no analysis completed. For a monorepo, list one line per root from the `sonar init` summary instead of the project lines; for a root created and bound to the repository, onboarding does not start an analysis, so never call it pending or started: say there are no results yet and that this does not mean the project is clean.

For the gate's conditions or the issue list, invoke the sonar-quality-gate or sonar-list-issues skill with the project key.

### When a step fails

Relay the error and its hint as printed. Then tell the user what is already in place (logged in, organization, project, `.sonar-config.json` mapping, analysis), what remains, and the exact command that resumes — usually the same `sonar init` command after the fix the hint names. Do not retry a failing step in a loop. Then go to Step 7.

### Step 7 — Next step

Every exit of this skill ends here: setup complete, plan cancelled or declined, no organization, or a failed step. Suggest the sonar-integrate skill, which wires this agent to SonarQube: analysis hooks, secrets scanning and the SonarQube MCP Server. When setup did not complete, say that it still works without a SonarQube project or organization, and repeat the command that resumes onboarding. Ask the user (yes/no) whether to run it now. Invoke it only if they say yes; otherwise stop.

Skip this offer when the `sonar` CLI is not installed or the user is not logged in (`sonar auth status` does not report a login, e.g. after a failure that lost it), since `sonar integrate` needs both. Then stop and repeat the resume command.
