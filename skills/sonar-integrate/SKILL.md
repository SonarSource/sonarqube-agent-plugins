---
name: sonar-integrate
description: "Set up SonarQube for the current agent using CLI integration locally or hosted MCP in cloud environments. Use when the user wants to connect their agent to SonarQube or configure SonarQube integration."
---

# Integrate SonarQube

Determine where you run from the session context and select the path without asking the user. Only if you cannot determine this, ask "Are you using this agent on your machine or in a web app?" with exactly two choices: "On my machine" and "In a web app".

- **Local environment:** Follow [local CLI integration](references/local.md) to install or update the SonarQube CLI, authenticate, and configure the agent's MCP server and hooks.
- **Cloud environment:** Follow [hosted MCP setup](references/cloud.md) to connect to SonarQube Cloud through OAuth.

If machine restrictions block the CLI, look up the current local agent's MCP setup instructions and configure an OAuth connection using the appropriate SonarQube Cloud URL from [hosted MCP setup](references/cloud.md). Use this fallback only when restrictions prevent installing or running the CLI. If the CLI is simply missing, install it through the local integration path.

Read only the selected path's reference.
