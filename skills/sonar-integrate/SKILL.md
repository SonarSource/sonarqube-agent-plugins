---
name: sonar-integrate
description: "Set up SonarQube for the current agent using CLI integration locally or hosted MCP in cloud environments. Use when the user wants to connect their agent to SonarQube or configure SonarQube integration."
---

# Integrate SonarQube

Identify where the agent runs from the session context. If unclear, ask whether it runs on the user's machine or in a cloud environment. Present predefined options for finite choices.

- **Local environment:** Follow [local CLI integration](references/local.md) to install or update the SonarQube CLI, authenticate, and configure the agent's MCP server and hooks.
- **Cloud environment:** Follow [hosted MCP setup](references/cloud.md) to connect to SonarQube Cloud through OAuth.

If the user cannot install or run the CLI on their local machine, for example because of enterprise restrictions, offer the hosted MCP path for SonarQube Cloud instead. A missing CLI alone is not a reason to skip installation.

Read only the selected path's reference.
