---
name: configure
description: "Install sonarqube-cli, authenticate, and integrate SonarQube with Claude Code"
disable-model-invocation: true
---

# Configure SonarQube

Guide the user through setting up sonarqube-cli, authenticating, and enabling SonarQube integration
(secrets scanning hooks) in Claude Code.

## Instructions

### Step 1 — Check for sonarqube-cli

Run `which sonar` yourself using the Bash tool.

**If found:** proceed to Step 2.

**If not found:** show the user the platform-appropriate install command and ask them to run it
(this cannot be automated — it requires an interactive shell session).

| Platform       | Install command |
|----------------|-----------------|
| macOS / Linux  | `curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh \| bash` |
| Windows (PS)   | `irm https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.ps1 \| iex` |

Wait for the user to confirm, then re-run `which sonar` yourself to verify before continuing.

---

### Step 2 — Check authentication status

Run `sonar auth status` yourself using the Bash tool.

**If already authenticated:** note the connected server and organisation from the output,
then skip directly to Step 4.

**If not authenticated:** proceed to Step 3.

---

### Step 3 — Authenticate (`sonar auth login`)

This step requires user interaction — do **not** run it yourself.

First determine the connection type. Ask:

> "Are you connecting to **SonarQube Cloud** (sonarcloud.io / sonarqube.us) or a
> **self-hosted SonarQube Server**?"

Collect:

| Scenario | Information needed |
|---|---|
| SonarQube Cloud — EU (default) | organization key (e.g. `my-org`) |
| SonarQube Cloud — US | organization key + confirm US region (`https://sonarqube.us`) |
| SonarQube Server | server URL (e.g. `https://sonarqube.yourcompany.com`) |

Build the login command and show it to the user:

| Scenario | Command |
|---|---|
| SonarQube Cloud — EU | `sonar auth login -o <org-key>` |
| SonarQube Cloud — US | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| SonarQube Server | `sonar auth login -s <server-url>` |

Tell the user:

> "Run the command below — it will open your browser to log in. The token is stored
> securely in your system keychain and never appears in this chat."

---

### Step 4 — Install secrets binary

Run `sonar install secrets --status` yourself using the Bash tool.

**If already installed:** skip to Step 5.

**If not installed:** run `sonar install secrets` yourself using the Bash tool and wait
for it to complete.

Wait for the user to confirm they logged in, then run `sonar auth status` yourself to
verify before continuing.
---

### Step 5 — Integrate with Claude Code

Before running any command, validate the values collected in Step 3:

- **Organization key** must match `^[a-zA-Z0-9_\-]+$` — reject and ask again if it contains anything else.
- **Server URL** must start with `https://` or `http://` and contain no shell metacharacters (spaces, quotes, semicolons, backticks, `$`, `&`, `|`, `>`). Reject and ask again if it does not.

Ask the user:

> "Should this integration apply to the **current project only** (default) or
> **globally** to all projects?"

Then run the appropriate command yourself using the Bash tool, using the server/org
from Step 2 or Step 3 and adding `--non-interactive`:

| Scenario | Command |
|---|---|
| SonarQube Cloud — EU, project | `sonar integrate claude -o <org-key> --non-interactive` |
| SonarQube Cloud — EU, global | `sonar integrate claude -o <org-key> --global --non-interactive` |
| SonarQube Cloud — US, project | `sonar integrate claude -o <org-key> -s https://sonarqube.us --non-interactive` |
| SonarQube Cloud — US, global | `sonar integrate claude -o <org-key> -s https://sonarqube.us --global --non-interactive` |
| SonarQube Server, project | `sonar integrate claude -s <server-url> --non-interactive` |
| SonarQube Server, global | `sonar integrate claude -s <server-url> --global --non-interactive` |

---

### Summary message

After all steps complete, print a summary:

```
✅ SonarQube integration is ready.

  Secrets scanning:  hooks installed via sonar integrate claude
  Authentication:    token stored in system keychain

You can verify at any time with:  sonar auth status
To re-run this setup:             /sonarqube:configure
```

If any step failed, note it clearly and suggest the corrective action.
