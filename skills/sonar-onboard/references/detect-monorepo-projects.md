# Detect build roots

Copied from the `detect-monorepo-projects` skill in [SonarSource/monorepo-project-provisioning](https://github.com/SonarSource/monorepo-project-provisioning/blob/master/detect-monorepo-projects-skill/SKILL.md) (commit `20dc9db`). Steps 2 and 3 are copied verbatim, and their numbering refers to that skill. Step 2i is not in the source: sonar-onboard adds it for build systems the source does not scan. sonar-onboard leaves out the rest: it needs no organization key, writes no `sonar-monorepo-projects.json`, and derives no project keys, since `sonar init` generates them or the user names one per root. Keep Steps 2 and 3 in sync with the source when it changes.

The repo root is the repository root, or the `--path` directory the user named. Detection only reads files: never write, move or delete anything while running it.

**Goal**: Identify each **build root** in the target repository — the top-most build manifest in a directory tree, i.e. a manifest that is *not itself* referenced as a sub-module / workspace member of another manifest higher up.

A SonarQube project corresponds to **one buildable unit**: a Maven multi-module parent (with its `<modules>`), a Gradle root build (with its `include`d sub-projects), an npm/pnpm/Yarn workspace root (with its members), an Nx workspace, a uv workspace, or a standalone single-project package. **Sub-modules of any of these are part of their build root and produce no separate entries.**

A repository can have multiple build roots, especially polyglot ones (e.g. a Maven multi-module at the repo root *and* a standalone Python lambda inside one of its sub-module directories that is not declared in any workspace).

---

## Step 2: Find every build root

Run every rule below. Each rule looks for the **top-most build manifest** of one build system and records the directory containing it. A repository can have multiple build roots in different build systems — a Maven multi-module at the repo root *and* a standalone Python lambda inside one of its sub-module directories, for example — so always complete all of Step 2a–2h before moving on.

**Sub-modules never become their own build root.** When a manifest declares its members (`<modules>`, `include(...)`, `"workspaces"` globs, `[tool.uv.workspace].members`), resolve those entries to directories and add each resolved directory to a shared **covered set**. A directory in the covered set belongs to its parent build root and is never emitted as its own entry, regardless of which other rules might match it.

Each build root entry records:
- **path** — the build-root directory, relative to the repo root.
- **build system** — Gradle, Maven, npm, pnpm, Yarn, Nx, uv, Poetry, setuptools.
- **name** — derived from the manifest at that path (see each rule's naming bullet).

### 2a. Gradle

**Start by enumerating every settings file in the repo — at any depth.** Nested or sibling Gradle builds are common (e.g. a `libs/<library>/settings.gradle` living next to a top-level `settings.gradle` is two independent Gradle builds, not one). Run the find below and capture **every** match — do not stop after the first hit, do not assume there's only one Gradle build.

```bash
find . \( -name .git -o -name node_modules -o -name build -o -name .gradle -o -name target -o -name dist \) -prune \
  -o \( -name settings.gradle -o -name settings.gradle.kts \) -print
```

Every directory containing one of these files is a **candidate build root** — treat the find results as a flat list of candidates. For each candidate, parse its settings file:

- Resolve every `include(...)` / `include '...'` declaration to a directory. Default mapping: `:libs:core` → `libs/core`, `'frontend'` → `frontend`.
- **Honor `project(':<name>').projectDir = file('<path>')` overrides** — they re-route an include to a different directory. Example: `include 'auth-service'` followed by `project(':auth-service').projectDir = file('common/auth-service')` resolves to `common/auth-service`, not `auth-service`.
- Resolve `includeBuild(...)` entries the same way — composite builds belong to the same logical build root, so add their target directories to the covered set too.

Add every resolved directory (paths relative to the candidate's settings file) to the **covered set**.

After all candidates are processed, drop any candidate whose own directory is in the covered set of *another* candidate — that one is a sub-build included by an outer settings file. The remaining candidates are Gradle build roots.

**Name**: `rootProject.name = "..."` (or `rootProject.name '...'`) from the candidate's settings file; fall back to the candidate directory name.

> **Worked example.** A repo has `settings.gradle` at its root (including a handful of sub-modules under `core/` and various service directories) AND a parallel directory `libs/` with three siblings — `auth/`, `data/`, `messaging/` — each containing its own `settings.gradle` (with `rootProject.name = '<sibling>'`) and `build.gradle`. None of the three are referenced in the root's `include(...)` or `includeBuild(...)` list. Result: **four Gradle build roots** in the output — the repo root *plus* one entry per `libs/*` sibling. Failing to enumerate the nested settings files is the most common miss for this rule.

### 2b. Maven

Find every `pom.xml` at any depth (skip `target`, `node_modules`, `.git`, `build`, `dist`).

- Each directory containing a `pom.xml` is a candidate.
- For each candidate, if its `pom.xml` declares `<modules>` with `<module>…</module>` entries, resolve each entry to a directory (relative to the pom's own directory) and add it to the covered set. **Recurse**: if a child pom also declares `<modules>`, continue adding its sub-paths to the covered set.
- After every candidate is processed, drop any candidate whose own directory is in the covered set (it's a Maven sub-module of another candidate, possibly transitively).
- **Name**: read the candidate's `<name>` (or `<artifactId>`) from the root `<project>` element; fall back to the directory name.

```bash
find . \( -name .git -o -name node_modules -o -name target -o -name build -o -name dist \) -prune \
  -o -name pom.xml -print
```

### 2c. npm workspaces

- Find every `package.json` (skip `node_modules`, `.git`, `dist`, `build`) whose JSON has a top-level `"workspaces"` **array** (e.g. `["packages/*", "apps/*"]`).
- The directory containing that `package.json` is a build root. Resolve every workspace glob to a directory containing a `package.json` and add each to the covered set. **Workspace members are not separate SonarQube projects.**
- **Name**: `name` of the build-root `package.json`; strip any `@scope/` prefix; fall back to the directory name.

### 2d. pnpm workspaces

- Find every `pnpm-workspace.yaml` at any depth. The directory containing it is a build root.
- Resolve every glob in its top-level `packages:` list and add the resolved directories to the covered set.
- **Name**: `name` of the sibling `package.json` (next to the `pnpm-workspace.yaml`); fall back to the directory name.

### 2e. Yarn workspaces

- Find every `package.json` whose `"workspaces"` is either an array or an object with a `packages` array. A sibling `yarn.lock` disambiguates Yarn from npm, but the resolution is identical to 2c.
- **Name**: same as 2c.

> A directory matched by **multiple** workspace rules (e.g. `package.json` `"workspaces"` *and* a `pnpm-workspace.yaml`) is one build root, not several — de-duplicate by path in Step 3.

### 2f. Nx workspace

- Find every `nx.json` at any depth. The directory containing it is a build root.
- Mark every directory referenced in the workspace (via `project.json` files, the `nx.json` projects map, or a legacy `workspace.json`) as part of the covered set. Nx commonly layers on top of an npm/pnpm/Yarn workspace, so the covered set typically overlaps with 2c–2e — that's fine, de-duplication in Step 3 collapses them.
- **Name**: top-level identifier in `nx.json` if present, otherwise the `name` of the sibling `package.json`, otherwise the directory name.

### 2g. Standalone npm / Yarn package

After 2c, 2d, 2e, and 2f have run and the covered set is finalized, also pick up any `package.json` **not** in the covered set as its own build root — this catches single-project npm/Yarn repos and sibling JS apps that don't declare any workspace. This rule mirrors Python's "standalone package" branch in 2h: workspace rules emit one entry for the workspace root, but a `package.json` that isn't in any workspace at all would fall through entirely without this rule.

- **Guard against config-only files.** Require substantive source next to the `package.json`: at least one `src/`, `lib/`, `app/`, or `pages/` sibling directory, or a top-level `index.{js,ts,jsx,tsx,mjs}` file. A `package.json` whose only content is a `dependencies` block — no source — is configuration (e.g. holding a CDK version for a Python project), not a project. Skip it.
- **Name**: `name` field of the `package.json`; strip any `@scope/` prefix; fall back to the directory name.

> **Worked example.** A repo has a Java Gradle multi-project at the root *and* a standalone JavaScript app at `tools/admin-ui/` (its own `package.json` + `yarn.lock` + `src/`, no `workspaces` field, not referenced anywhere else). 2a captures the Gradle root; 2c–2f find nothing (no `workspaces` declared); 2g picks up the admin UI as its own build root.

### 2h. Python (uv workspace, Poetry, setuptools, PEP 621)

Python has no single universal monorepo manifest. Handle two shapes:

- **uv workspace**: a `pyproject.toml` at any depth with a `[tool.uv.workspace]` table and a `members = [...]` list of globs. The directory containing it is a build root. Resolve every glob to a directory containing a `pyproject.toml`; add those directories to the covered set.
- **Standalone Python package**: any directory containing `pyproject.toml`, `setup.py`, or `setup.cfg` that is **not** in the covered set (and is not itself a uv workspace root) is its own build root. This includes directories nested inside another build system's sub-module — e.g. a Python lambda at `services/foo/foo-infra/pyproject.toml` is its own build root even when its sibling `services/foo/foo-app` is covered by a Gradle root above.

Skip vendor / build dirs while scanning: `.venv`, `venv`, `node_modules`, `build`, `dist`, `.tox`, `target`, `.git`.

```bash
find . \( -name .venv -o -name venv -o -name node_modules -o -name build -o -name dist -o -name .tox -o -name target -o -name .git \) -prune \
  -o -name pyproject.toml -print -o -name setup.py -print -o -name setup.cfg -print
```

- **Name**: `[project].name` (or `[tool.poetry].name`) in `pyproject.toml`; `name` in `setup.cfg`'s `[metadata]`; `name=` argument in `setup.py`; fall back to the directory name. For a uv workspace root, prefer `[project].name` of the workspace-root `pyproject.toml` when present, else the directory name.

> A single root `pyproject.toml` with no workspace table and no other package directories is **one** build root, not "no result" — emit it as a single-project repo.

---

### 2i. Other build systems (sonar-onboard addition)

Run after 2a–2h, with the covered set they built. Skip `.git`, `node_modules`, `vendor`, `target`, `build`, `dist`, `bin`, `obj` and `.gradle` while scanning. Each rule adds the directories its manifest declares as members to the covered set, and records every manifest directory that is not in the covered set as a build root:

- **Gradle without settings**: a `build.gradle` or `build.gradle.kts` whose directory is not covered by 2a and has no `settings.gradle[.kts]`. **Name**: the directory name.
- **Go**: a `go.work` is a build root; its `use` directories are covered. Otherwise each `go.mod` is a build root. **Name**: the last segment of the `module` path.
- **Rust**: a `Cargo.toml` with a `[workspace]` table is a build root; its `members` globs are covered. Otherwise each `Cargo.toml` with a `[package]` table is a build root. **Name**: `[workspace.package].name` or `[package].name`, else the directory name.
- **.NET**: a `.sln` or `.slnx` file is a build root; the directories of the projects it lists are covered. Otherwise each directory with a `*.csproj`, `*.fsproj` or `*.vbproj` is a build root. **Name**: the solution or project file name without its extension.
- **PHP**: each `composer.json`. **Name**: the part of `name` after `/`, else the directory name.
- **Ruby**: each `Gemfile` or `*.gemspec`. **Name**: the gemspec's `name`, else the directory name.

## Step 3: Collect build roots and de-duplicate

Merge the results of all rules into a single list keyed by **source path** relative to the repo root. When the same directory was reported by more than one rule (e.g. an Nx workspace layered on top of pnpm, or a JS workspace root that also has its own `pyproject.toml`), keep one entry and prefer the most specific declared name.

Return the list to sonar-onboard (see **Result** below).

---

## Result

Return one entry per build root: its **path** relative to the repo root (`.` for the repo root itself), its **build system** and its **name**. Also return what was checked for: Gradle (`settings.gradle[.kts]`), Maven (`pom.xml`), npm/Yarn (`package.json` `"workspaces"` plus standalone `package.json` with source), pnpm (`pnpm-workspace.yaml`), Nx (`nx.json`), Python (`[tool.uv.workspace]` plus standalone `pyproject.toml` / `setup.py` / `setup.cfg`), standalone Gradle (`build.gradle[.kts]`), Go (`go.work` / `go.mod`), Rust (`Cargo.toml`), .NET (`.sln` / `.slnx` / `*.csproj` / `*.fsproj` / `*.vbproj`), PHP (`composer.json`), Ruby (`Gemfile` / `*.gemspec`). Bazel, Pants, Buck and other build systems are not scanned, so a repository using them may report fewer roots than it has.
