#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

function hasSonarCli() {
  const envPath = process.env.PATH || "";
  const dirs = envPath.split(path.delimiter);
  const exts =
    process.platform === "win32"
      ? (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";")
      : [""];

  for (const dir of dirs) {
    for (const ext of exts) {
      try {
        fs.accessSync(path.join(dir, "sonar" + ext), fs.constants.F_OK);
        return true;
      } catch {
        // not in this directory
      }
    }
  }
  return false;
}

function readClaudeCodeHooksInstalled() {
  const statePath = path.join(
    os.homedir(),
    ".sonar",
    "sonarqube-cli",
    "state.json"
  );
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    const installed = state?.agents?.["claude-code"]?.hooks?.installed;
    return Array.isArray(installed) ? installed : [];
  } catch {
    return [];
  }
}

function hasNamedHook(installed, hookName) {
  return installed.some((entry) => entry && entry.name === hookName);
}

const sonarOk = hasSonarCli();
const hooksInstalled = readClaudeCodeHooksInstalled();
const agenticAnalysisOk = hasNamedHook(hooksInstalled, "sonar-sqaa");
const secretsOk = hasNamedHook(hooksInstalled, "sonar-secrets");
const integrateHint = "✗ not set up — run /sonarqube:integrate";

const lines = [
  "SonarQube plugin initialised.",
  "  sonarqube-cli:    " +
    (sonarOk ? "✓ found" : "✗ not found — run /sonarqube:integrate"),
  "  Agentic Analysis hook (sonar-sqaa): " +
    (agenticAnalysisOk ? "✓ configured" : integrateHint),
  "  Secrets hook (sonar-secrets): " +
    (secretsOk ? "✓ configured" : integrateHint),
];

process.stdout.write(JSON.stringify({ systemMessage: lines.join("\n") }) + "\n");
process.exit(0);
