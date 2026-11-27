# Local CLI integration

### Step 1: Install or update sonarqube-cli

Invoke the sonar-install-cli skill to install the CLI if missing or update it if already installed. Continue to Step 2 when the CLI is available. If machine restrictions block the CLI, use the SonarQube Cloud URLs in [hosted MCP setup](cloud.md), research the current local agent's MCP configuration, and connect it directly with OAuth instead. For other installation failures, help resolve the error before continuing.

---

### Step 2: Login

Invoke the sonar-login skill. It checks `sonar auth status`, and when the CLI is not logged in, builds the `sonar auth login` command for the user to run and verifies the login. Once it reports a successful login (the connected server, plus the organization for SonarQube Cloud), continue to Step 3. If the user stops without logging in, stop here too.

---

### Step 3: Agent-specific integration

For the current agent, run this command yourself using a shell command:

```bash
sonar integrate <agent> --non-interactive
```

Use the current agent's name: `claude`, `copilot`, `codex`, `cursor`, `antigravity`, `devin`, `pi`, or `opencode`.

Exceptions:

- **Cursor:** After the command completes, tell the user to open **Customize**, find the `sonarqube` MCP server, and turn on its toggle.
- **Factory Droid:** Use the agent's MCP settings to add a user-scoped `sonarqube` server with command `sonar` and arguments `["run", "mcp"]`. Reuse an existing entry if present.

After integration, run `sonar system status` to check the reported MCP status. If it uses the container fallback, verify the runtime with `docker ps`, `podman ps`, or `nerdctl ps`. Ask the user to start their runtime if needed. For a hosted connection, proceed without a container runtime. Ask the user to restart the agent session to load the integration.

---

### Summary message

After all steps complete, print a summary:

```
✅ SonarQube integration is ready.

  sonarqube-cli:     up to date
  Authentication:    token stored in system keychain
  Integration:       configured

Restart the current agent session to load the configuration.

You can verify at any time with:  sonar auth status
To refresh CLI + wiring later:    invoke the sonar-integrate skill again
```

For **Cursor**, insert this message before the restart instruction:

```
Enable the sonarqube MCP server in Cursor Customize before restarting.
```

If sonar-install-cli reported **installed** in Step 1, replace the `sonarqube-cli` summary line with `sonarqube-cli: installed`.

If it reported **not updated** in Step 1, adjust the summary: omit the `sonarqube-cli` line or state that the CLI was not updated and suggest the manual upgrade command sonar-install-cli returned for its install route.

If any other step failed, note it clearly and suggest the corrective action.
