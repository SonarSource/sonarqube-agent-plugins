#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const HOOK_DISPLAY_NAMES = {
  "sonar-secrets": "Secrets Detection",
  "sonar-sqaa": "Agentic Analysis",
};

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

function readState() {
  const statePath = path.join(
    os.homedir(),
    ".sonar",
    "sonarqube-cli",
    "state.json"
  );
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return null;
  }
}

function samePath(a, b) {
  if (!a || !b) return false;
  const caseInsensitive =
    process.platform === "darwin" || process.platform === "win32";
  const norm = (p) =>
    caseInsensitive ? path.resolve(p).toLowerCase() : path.resolve(p);
  return norm(a) === norm(b);
}

const cwd = process.cwd();
const state = readState();
const sonarOk = hasSonarCli();

const claudeHooks = (state?.agentExtensions ?? []).filter(
  (e) =>
    e?.agentId === "claude-code" &&
    e.kind === "hook" &&
    typeof e.name === "string"
);
const globalHooks = claudeHooks.filter((e) => e.global === true);
const localHooks = claudeHooks.filter((e) => samePath(cwd, e.projectRoot));
const installed = new Set([...globalHooks, ...localHooks].map((e) => e.name));

const hookList = Array.from(installed)
  .map((n) => HOOK_DISPLAY_NAMES[n] || n)
  .join(", ");

const lines = [
  "SonarQube plugin initialised.",
  "  sonarqube-cli: " +
    (sonarOk ? "✓ found" : "✗ not found — run /sonarqube:sonar-integrate"),
  "  SonarQube hooks: " +
    (installed.size > 0
      ? "✓ " + hookList
      : "✗ no hooks installed — run /sonarqube:sonar-integrate"),
];

process.stdout.write(JSON.stringify({ systemMessage: lines.join("\n") }) + "\n");
process.exit(0);
