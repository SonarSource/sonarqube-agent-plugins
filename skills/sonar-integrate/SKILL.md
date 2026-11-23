---
name: sonar-integrate
description: "Sets up SonarQube for the current agent, including signing in and finishing pending integrations. Use when the user asks to configure SonarQube or when an explicit SonarQube task needs setup before it can continue."
allowed-tools: Bash(sonar:*), Bash(docker ps:*), Bash(podman ps:*), Bash(nerdctl ps:*)
---

# Integrate SonarQube

Guide the user through installing **sonarqube-cli** if needed, signing in, and setting up SonarQube for their agent. If this skill was invoked during an explicit SonarQube task, keep the original request, repository, and analysis scope in context so you can return to it.

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, show the selector again.

### Step 1 — Check the CLI and the current agent

Run `sonar --version`. If the CLI is missing, invoke the sonar-install-cli skill. On **not installed**, stop. If the user explicitly asked to update the CLI, use that skill as well. Sign-in uses the installed CLI.

For Factory Droid and Kiro, go directly to the sonar-login skill. Factory Droid uses the plugin's MCP configuration. Kiro uses the SonarQube power. Neither needs an agent installation command.

For other agents, run `sonar system status --format json`. Find your agent's subcommand ID in `pendingIntegrations` (`claude`, `copilot`, `codex`, `cursor`, `antigravity`, `devin`, `pi`, or `opencode`). A matching entry means the agent already has setup in progress. An older CLI without this report uses the manual flow in Steps 2 and 3. If a previously available status check fails or returns unreadable data, report the error before making installation changes.

### Step 2 — Sign in

Invoke the sonar-login skill. Pass it the current agent's pending entry if present so it can guide the user to the prepared connection. Continue once this agent can use the requested login. If the user signed in successfully but this agent still uses environment overrides, ask them to restart or resume in the environment with the saved login. Give them a short prompt to resume the original request in the same repository with the same scope. If the user declines, stop and tell them they can pick up setup later.

### Step 3 — Check that integration finished

For CLI-managed agents, read `sonar system status --format json` again after sign-in. Use `claude-code` and `copilot-cli` when looking for Claude Code and Copilot CLI in the installed `integrations` list. For other agents, the installed IDs match their subcommand IDs.

- **Still preparing.** If a prepared entry still reports `waiting_for_sign_in`, verify the prepared connection. If sign-in matches and the entry is still present, ask the user to run `sonar integrate --all --non-interactive` to finish setup and then check again. Explain that this can also configure other newly detected agents. Use the same retry for `retry_setup`.
- **Already integrated.** If there is an installed entry and no pending entry, use the current setup. Run the integration command again only when the user explicitly requests reconfiguration.
- **New agent.** If neither check reported pending or installed setup, run `sonar integrate <agent> --non-interactive` with the current agent's subcommand ID. On an older CLI without pending integration reporting, keep the sign-in-then-integrate flow and reuse any installed integration the CLI reports.
- **Activation could not be confirmed.** If a previously pending entry disappears without an installed integration, or status cannot be read after preparation was detected, tell the user and stop.
- **Factory Droid or Kiro.** Continue with the respective plugin or power after sign-in. In Kiro, enable the SonarQube power if needed.

### Step 4 — Continue the original request

If the requested check can run with the authenticated CLI, continue with the same repository, files, and scope. Otherwise, address only the prerequisite blocking the request.

- If the check needs MCP and the tools are unavailable, verify that Docker, Podman, or Nerdctl is running by trying `docker ps`, `podman ps`, or `nerdctl ps`. Ask the user to start their runtime if needed.
- If Cursor's SonarQube MCP entry is disabled, ask the user to enable `sonarqube` in **Settings → MCP**. If the CLI reports that OpenCode analysis plugins are inactive, ask the user to upgrade to OpenCode 2.0 or later.
- If SonarQube cannot resolve the requested project, use the project key the user supplied for the check. If it needs a binding, offer `sonar link` to select an existing project. Use the sonar-onboard skill when the user wants to onboard the repository.
- If the current session needs to reload its configuration, ask the user to restart or reload the agent. Give them a short prompt they can use to resume the original request with the same scope.

For an explicit setup request, summarize sign-in, integration status, and any remaining action. For a check that prompted setup, return to the check and report its result. An empty findings list is a successful result when analysis actually ran. If analysis was skipped or failed, explain why and how to continue.
