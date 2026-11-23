---
name: sonar-login
description: "Logs sonarqube-cli in to SonarQube Cloud or SonarQube Server: checks the current login, asks for the connection type, and builds the `sonar auth login` command for the user to run. Use when the user asks to login, login or re-authenticate to SonarQube, when a `sonar` command reports that it is not logged in, or when another skill needs a login."
allowed-tools: Bash(sonar:*)
---

# SonarQube — Login

Make sure **sonarqube-cli** is logged in, and report the connected server, plus the organization for SonarQube Cloud (a SonarQube Server login has none). The login opens a browser, so the user runs it: never run `sonar auth login` yourself, and never ask the user to paste a token into the chat.

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

When another skill invoked this one, return to the caller once the requested connection is verified or the user stops. The caller owns the original SonarQube task and any remaining setup.

**Authentication-only mode.** For a caller that only needs credentials, inspect `sonar auth login --help` and include `--no-agent-setup` in the command if available. This saves the login while leaving agent configuration and pending setup as they are. If the flag is unavailable, run `sonar system status --format json`. A valid response without `pendingIntegrations` identifies the older flow where plain login is sufficient. If the response reports `pendingIntegrations` or cannot be verified, offer an upgrade or get the user's approval for the agent setup that login can trigger before proceeding.

## Instructions

### Step 1 — Check the current login

Run `sonar auth status` yourself. When the caller passed a pending integration, use `sonar auth status --format json` to compare the connected server (including the base path) and Cloud organization with the prepared target. Environment credentials do not activate pending setup. If `sonar` is not found, invoke the sonar-install-cli skill, then check status again. If it reports **not installed**, stop.

- **Environment credentials are active for a prepared integration.** Check this first by looking for `source` starting with `env vars:` in the JSON. Ask the user to check `sonar auth status --format json` in a terminal without those overrides. If that terminal already sees a saved login for the prepared connection, proceed to Step 3. Otherwise, guide them through Step 2 in that terminal.
- **Logged in to the requested connection:** report the server and the Cloud organization. Sign in again only when the user requested re-authentication.
- **Not logged in:** go to Step 2.
- **A different login is active:** if the user wants to sign in to the prepared target or explicitly requested another connection, explain the mismatch and ask whether to switch. If they accept, go to Step 2. Otherwise, leave the active connection and pending setup as they are.

### Step 2 — Build the login command

If the calling skill provided a pending target, use its server and Cloud organization when present, unless the user explicitly requested another connection. Validate these values before showing a command. Use a valid HTTP(S) URL without credentials, a query, or a fragment, and quote the URL for the user's shell. Check an organization key against the pattern below. If a prepared target is invalid, explain that IT needs to correct it.

For a prepared server, show `sonar auth login --server <url>`. Include `--org <key>` for a prepared Cloud organization. If a Cloud organization was omitted, let the CLI guide the user through its selection in the terminal.

When there's no server or connection type to use, ask the user to select one:

1. SonarQube Cloud - EU (default)
2. SonarQube Cloud - US
3. Self-hosted SonarQube Server

Collect what the scenario needs, and validate it before putting it into the command. If a value fails, tell the user what was rejected and ask again.

| Scenario                       | Information needed                                            | Allowed pattern                                         |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------- |
| SonarQube Cloud — EU (default) | organization key (e.g. `my-org`)                              | `^[a-zA-Z0-9_\-]+$`                                     |
| SonarQube Cloud — US           | organization key + confirm US region (`https://sonarqube.us`) | `^[a-zA-Z0-9_\-]+$`                                     |
| SonarQube Server               | server URL (e.g. `https://sonarqube.yourcompany.com`)         | `http://` or `https://` URL, no spaces, quotes or `;&|` |

Build the login command and show it to the user. In authentication-only mode, follow the flag and compatibility guidance above:

| Scenario             | Command                                                 |
| -------------------- | ------------------------------------------------------- |
| SonarQube Cloud — EU | `sonar auth login -o <org-key>`                         |
| SonarQube Cloud — US | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| SonarQube Server     | `sonar auth login -s <server-url>`                      |

Apply the authentication-only option to the prepared-target command as well. Then tell the user:

> "Run the command below — it will open your browser to login. The token is stored
> securely in your system keychain and never appears in this chat."

### Step 3 — Verify

Wait for the user to confirm they logged in, then run the same auth status check as in Step 1. If it verifies the requested connection, using a saved login when setup is pending, report the server and Cloud organization and return to the caller.

If pending setup still has an `env vars:` source, use the status from the terminal without overrides to verify the saved login. Once it is verified, ask the user to restart the agent from that terminal or resume in another environment without the overrides. Return to the caller with the remaining action so it can preserve the original task. Offer sign-in again only when the status check in the appropriate environment reports a missing or mismatched login.
