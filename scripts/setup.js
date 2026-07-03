#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const CLAUDE_INTEGRATION_ID = "claude-code";

const HOOK_DISPLAY_NAMES = {
  "sonar-secrets": "Secrets Detection",
  "sonar-sqaa": "Agentic Analysis",
  "sonar-secrets-hooks": "Secrets Detection",
  "sonar-sqaa-hook": "Agentic Analysis",
};

const DECLARATIVE_HOOK_FEATURE_IDS = new Set([
  "sonar-secrets-hooks",
  "sonar-sqaa-hook",
]);

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

function canonicalPath(p) {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
}

function samePath(a, b) {
  if (!a || !b) return false;
  const caseInsensitive =
    process.platform === "darwin" || process.platform === "win32";
  const norm = (p) => {
    const c = canonicalPath(p);
    return caseInsensitive ? c.toLowerCase() : c;
  };
  return norm(a) === norm(b);
}

function featureAppliesToCwd(feature, cwd) {
  if (feature?.scope === "global") {
    return true;
  }
  if (feature?.scope === "project") {
    return samePath(cwd, feature.targetRoot);
  }
  return false;
}

function collectLegacyHookNames(state, cwd) {
  const claudeHooks = (state?.agentExtensions ?? []).filter(
    (entry) =>
      entry?.agentId === CLAUDE_INTEGRATION_ID &&
      entry.kind === "hook" &&
      typeof entry.name === "string"
  );
  const globalHooks = claudeHooks.filter((entry) => entry.global === true);
  const localHooks = claudeHooks.filter((entry) =>
    samePath(cwd, entry.projectRoot)
  );
  return [...globalHooks, ...localHooks].map((entry) => entry.name);
}

function collectDeclarativeHookNames(state, cwd) {
  const claudeIntegration = (state?.integrations?.installed ?? []).find(
    (entry) => entry?.integrationId === CLAUDE_INTEGRATION_ID
  );
  if (!claudeIntegration) {
    return [];
  }

  return (claudeIntegration.features ?? [])
    .filter(
      (feature) =>
        typeof feature?.featureId === "string" &&
        DECLARATIVE_HOOK_FEATURE_IDS.has(feature.featureId) &&
        featureAppliesToCwd(feature, cwd)
    )
    .map((feature) => feature.featureId);
}

function collectInstalledHookNames(state, cwd) {
  const names = [
    ...collectLegacyHookNames(state, cwd),
    ...collectDeclarativeHookNames(state, cwd),
  ];
  return new Set(names);
}

const cwd = process.cwd();
const state = readState();
const sonarOk = hasSonarCli();
const installed = collectInstalledHookNames(state, cwd);

const hookList = Array.from(
  new Set(Array.from(installed).map((name) => HOOK_DISPLAY_NAMES[name] || name))
).join(", ");

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
