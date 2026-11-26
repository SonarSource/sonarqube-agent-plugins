---
name: sonar-login
description: "Logs sonarqube-cli in to SonarQube Cloud or SonarQube Server: checks the current login, asks for the connection type, and builds the `sonar auth login` command for the user to run. Use when the user asks to login, login or re-authenticate to SonarQube, when a `sonar` command reports that it is not logged in, or when another skill needs a login."
allowed-tools: Bash(sonar:*)
---

# SonarQube — Login

Make sure **sonarqube-cli** is logged in, and report the connected server, plus the organization for SonarQube Cloud (a SonarQube Server login has none). The login opens a browser, so the user runs it: never run `sonar auth login` yourself, and never ask the user to paste a token into the chat.

Interaction rule: for every finite decision, always present predefined selector options (single-choice or multi-choice as appropriate) instead of asking for free-form text. If the user gives an invalid answer, re-show the same selector.

When another skill invoked this one, return to it once the user is logged in, or once they stop.

## Instructions

### Step 1 — Check the current login

Run `sonar auth status` yourself. If `sonar` is not found, invoke the sonar-install-cli skill, then run `sonar auth status` again. If it reports **not installed**, stop.

- **Logged in:** note the connected server, and the organization for SonarQube Cloud, tell the user, and stop. Login again (Step 2) only when the user asked to re-authenticate or to use another server or organization.
- **Not logged in:** go to Step 2.

### Step 2 — Build the login command

Ask for the connection type with a single-choice selector:

1. SonarQube Cloud - EU (default)
2. SonarQube Cloud - US
3. SonarQube Cloud - AU
4. Self-hosted SonarQube Server

Collect what the scenario needs, and validate it before putting it into the command. If a value fails, tell the user what was rejected and ask again.

| Scenario                       | Information needed                                            | Allowed pattern                                         |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------- |
| SonarQube Cloud — EU (default) | organization key (e.g. `my-org`)                              | `^[a-zA-Z0-9_\-]+$`                                     |
| SonarQube Cloud — US           | organization key + confirm US region (`https://sonarqube.us`) | `^[a-zA-Z0-9_\-]+$`                                     |
| SonarQube Cloud — AU           | organization key + confirm AU region (`https://sonarqube.au`) | `^[a-zA-Z0-9_\-]+$`                                     |
| SonarQube Server               | server URL (e.g. `https://sonarqube.yourcompany.com`)         | `http://` or `https://` URL, no spaces, quotes or `;&|` |

Build the login command and show it to the user:

| Scenario             | Command                                                 |
| -------------------- | ------------------------------------------------------- |
| SonarQube Cloud — EU | `sonar auth login -o <org-key>`                         |
| SonarQube Cloud — US | `sonar auth login -o <org-key> -s https://sonarqube.us` |
| SonarQube Cloud — AU | `sonar auth login -o <org-key> -s https://sonarqube.au` |
| SonarQube Server     | `sonar auth login -s <server-url>`                      |

Tell the user:

> "Run the command below — it will open your browser to login. The token is stored
> securely in your system keychain and never appears in this chat."

### Step 3 — Verify

Wait for the user to confirm they logged in, then run `sonar auth status` yourself. If it reports the login, note the connected server, and the organization for SonarQube Cloud, and stop. If it does not, show its output and go back to Step 2.
