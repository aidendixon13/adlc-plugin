// Shared helpers for the Cursor hook entry points. Cursor runs hook commands
// through PowerShell on Windows and sh elsewhere, so the hooks are Node scripts
// with no bash or jq dependency.

const fs = require("fs");
const path = require("path");

const PLUGIN_ROOT = process.env.CURSOR_PLUGIN_ROOT || path.resolve(__dirname, "..", "..");

function readInput() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf8");
  } catch {
    return {};
  }
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function projectDir(input) {
  if (process.env.CURSOR_PROJECT_DIR) return process.env.CURSOR_PROJECT_DIR;
  if (Array.isArray(input.workspace_roots) && input.workspace_roots.length > 0) return input.workspace_roots[0];
  return process.cwd();
}

function respond(output) {
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

module.exports = { PLUGIN_ROOT, readInput, projectDir, respond };
