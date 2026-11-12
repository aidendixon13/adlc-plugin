// sessionStart: inject the using-adlc skill body as session context, plus
// whether the repository has agent instructions.

const fs = require("fs");
const path = require("path");
const { PLUGIN_ROOT, readInput, projectDir, respond } = require("./lib.cjs");

const input = readInput();

const skillFile = path.join(PLUGIN_ROOT, "skills", "using-adlc", "SKILL.md");
const skill = fs.readFileSync(skillFile, "utf8");
const body = skill.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

const root = projectDir(input);
const hasInstructions = ["AGENTS.md", "CLAUDE.md"].some((name) => fs.existsSync(path.join(root, name)));
const status = hasInstructions
  ? "Repository initialized (agent instructions found)."
  : "Repository has no AGENTS.md or CLAUDE.md. Recommend adding one before running the ADLC pipeline.";

respond({ additional_context: `${body}\n\nRepository Status: ${status}` });
