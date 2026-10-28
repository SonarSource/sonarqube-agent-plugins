import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONFIG_DIR_NAME, getAgentDir, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

function hasSonarQubeMcpConfig(configPath: string): boolean {
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
    return Object.hasOwn(config?.mcpServers ?? {}, "sonarqube");
  } catch {
    return false;
  }
}

export default function registerSonarQubeMcp(pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    if (
      hasSonarQubeMcpConfig(join(getAgentDir(), "mcp.json")) ||
      (ctx.isProjectTrusted() && hasSonarQubeMcpConfig(join(ctx.cwd, CONFIG_DIR_NAME, "mcp.json")))
    ) {
      return;
    }

    pi.registerMcpServer("sonarqube", {
      command: "sonar",
      args: ["run", "mcp"],
    });
  });
}
