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
  if (
    hasSonarQubeMcpConfig(join(getAgentDir(), "mcp.json")) ||
    hasSonarQubeMcpConfig(join(process.cwd(), CONFIG_DIR_NAME, "mcp.json"))
  ) {
    return;
  }

  pi.registerMcpServer("sonarqube", {
    command: "sonar",
    args: ["run", "mcp"],
  });
}
