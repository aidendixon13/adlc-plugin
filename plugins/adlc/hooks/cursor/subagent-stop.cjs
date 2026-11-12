// subagentStop: when an ADLC subagent finishes, run `just` verification and
// hand the parent agent either the failures or a completion checklist.
//
// Fail-open: no justfile, no `just`, or a missing recipe allows completion.
// ADLC_STOP_VERIFY sets the recipes (default "lint,typecheck"); "off" disables.

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { readInput, projectDir, respond } = require("./lib.cjs");

const IMPLEMENTERS = new Set([
  "backend-engineer",
  "frontend-engineer",
  "qa-engineer",
  "platform-engineer",
  "documentation-specialist",
]);
const REVIEWER = "code-reviewer";

const IMPLEMENTER_CHECKLIST = `The ADLC implementation subagent finished. Before moving on, confirm:
1. Have the acceptance criteria for this task been met?
2. If architectural or design changes were made, have relevant docs (AGENTS.md, CLAUDE.md, architecture docs) been updated?
3. Has a code review been performed (via the code-reviewer subagent or manual review)?
If any are missing, address them before completing.`;

const REVIEWER_CHECKLIST = `The ADLC code-review subagent finished. Before moving on, confirm:
1. Were any critical or major issues found?
2. If so, have they been addressed or flagged for resolution?
Do not treat the review as complete with unacknowledged critical issues.`;

function runVerification(cwd) {
  const config = process.env.ADLC_STOP_VERIFY ?? "lint,typecheck";
  if (config === "off" || config.trim() === "") return "";
  if (!["justfile", "Justfile"].some((name) => fs.existsSync(path.join(cwd, name)))) return "";

  const list = spawnSync("just", ["--list"], { cwd, encoding: "utf8" });
  if (list.error || list.status !== 0) return "";
  const available = new Set(
    list.stdout
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/)[0])
      .filter(Boolean),
  );

  let failures = "";
  for (const recipe of config.split(",").map((r) => r.trim()).filter(Boolean)) {
    if (!available.has(recipe)) continue;
    const run = spawnSync("just", [recipe], { cwd, encoding: "utf8" });
    if (run.status !== 0) {
      const output = `${run.stdout ?? ""}${run.stderr ?? ""}`.trimEnd().split(/\r?\n/).slice(-25).join("\n");
      failures += `\n--- just ${recipe} failed ---\n${output}`;
    }
  }
  return failures;
}

const input = readInput();
const agent = input.subagent_type;
const isImplementer = IMPLEMENTERS.has(agent);

if ((!isImplementer && agent !== REVIEWER) || input.status !== "completed" || (input.loop_count ?? 0) > 0) {
  respond({});
}

if (isImplementer) {
  const failures = runVerification(projectDir(input));
  if (failures) {
    respond({
      followup_message: `Verification failed after the ${agent} subagent finished. Fix these, then finish:${failures}\n\nDo not claim this work complete until \`just\` verification passes. Set ADLC_STOP_VERIFY=off to disable this gate.`,
    });
  }
  respond({ followup_message: IMPLEMENTER_CHECKLIST });
}

respond({ followup_message: REVIEWER_CHECKLIST });
