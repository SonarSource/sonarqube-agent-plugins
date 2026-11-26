# Hosted MCP setup

## Choose the deployment

Use the deployment already specified by the user. Otherwise, ask them to choose:

| Deployment | MCP URL |
| --- | --- |
| SonarQube Cloud EU | `https://api.sonarcloud.io/mcp` |
| SonarQube Cloud US | `https://api.sonarqube.us/mcp` |
| SonarQube Cloud AU | `https://api.sonarqube.au/mcp` |

For SonarQube Server, direct the user to [local CLI integration](local.md) on their machine and stop this flow.

## Configure the agent

Read the current cloud product's reference and guide the user through its connection settings using the selected URL.

| Agent | Reference |
| --- | --- |
| Claude | [claude.md](agents/claude.md) |
| ChatGPT web | [chatgpt.md](agents/chatgpt.md) |
| Cursor | [cursor.md](agents/cursor.md) |
| Devin | [devin.md](agents/devin.md) |

For an unlisted product, research its cloud MCP setup and explain the steps directly to the user. If you cannot find product-specific instructions, ask the user to add a remote MCP server named `sonarqube` with the selected URL and authenticate through OAuth.

Name the connection `sonarqube`. Reuse an existing connection, preserving its tool permissions and unrelated settings. Use OAuth sign-in and omit token-based `Authorization` headers.

If policy blocks setup, ask the user to have their administrator allow the connection.

## Verify

Have the user complete sign-in, then call `list_organizations` through the configured SonarQube connection to verify access. If the tool is unavailable, check the connection status and tool permissions. Ask the user to enable the connection or start a new session only when their agent requires it. Report whether access was verified, remains unverified, or returned an error.
