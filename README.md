# ADLC plugin for Cursor and Claude Code

A private copy of HG Capital's ADLC (Agentic Development Lifecycle) plugin, adapted so the same plugin installs in both Cursor and Claude Code. Plugin docs: [`plugins/adlc/README.md`](plugins/adlc/README.md).

## Layout

```text
.cursor-plugin/marketplace.json     Cursor marketplace (lists plugins/adlc)
.claude-plugin/marketplace.json     Claude Code marketplace
plugins/adlc/
  .cursor-plugin/plugin.json        Cursor manifest; points hooks at hooks/cursor-hooks.json
  .claude-plugin/plugin.json        Claude Code manifest
  agents/  commands/  skills/       Shared by both tools
  hooks/hooks.json + *.sh           Claude Code hooks (bash + jq)
  hooks/cursor-hooks.json           Cursor hooks
  hooks/cursor/*.cjs                Cursor hook scripts (Node, no bash or jq needed)
```

## Install in Cursor

**From GitHub:** in Cursor Settings → Plugins (Customize), choose **From GitHub Repository** and enter `aidendixon13/adlc-plugin`.

**From disk:** copy `plugins/adlc` to `~/.cursor/plugins/local/adlc`, then run **Developer: Reload Window**. On Enterprise plans an admin must enable **Allow Local Plugin Imports**.

Commands appear as `/adlc-refine`, `/adlc-plan`, `/adlc-breakdown`, `/adlc-execute`, `/adlc-pr`, `/adlc-quick`, `/adlc-chore`, `/adlc-bug-fix`, `/adlc-address-feedback`, `/adlc-label`, and `/adlc-clean-worktrees`. Hooks need `node` on `PATH`.

## Install in Claude Code

```text
/plugin marketplace add aidendixon13/adlc-plugin
/plugin install adlc@adlc-plugin
```

Commands keep their `/adlc:<command>` names.

## What changed from the original

- **Manifests.** Renamed `.claude_plugin` to `.claude-plugin`, which is the folder Claude Code reads. Added a Cursor manifest and marketplace files for both tools.
- **Hooks.** Cursor has no `TeammateIdle` or `TaskCompleted` event and runs hooks through PowerShell on Windows, where `bash` may resolve to WSL and `jq` is often missing. The Cursor hooks are Node rewrites:
  - `sessionStart` injects the `using-adlc` skill and checks for `AGENTS.md` or `CLAUDE.md`.
  - `subagentStop` runs `just` verification (`ADLC_STOP_VERIFY`, default `lint,typecheck`) when an ADLC implementer finishes, then sends the completion checklist. Cursor delivers it to the parent agent as a follow-up message; Claude Code blocks the subagent instead.
- **Agents.** `model: sonnet` and `model: opus` became `model: inherit`, because Cursor only accepts `inherit` or a full model ID. In Claude Code the agents now use the session's model.
- **Commands.** Each command has `name: adlc-<command>` so Cursor shows `/adlc-execute` instead of a bare `/execute`.
- **Skills.** `using-adlc` gained a "Running in Cursor" table that maps Claude tool names (`AskUserQuestion`, `Monitor`, `TaskCreate`, `${CLAUDE_PLUGIN_ROOT}`) to Cursor equivalents. The session-start hook injects it, so the mapping is in context from the first message.

## Known gaps in Cursor

- Agent Teams (the default "team" execution strategy) don't exist in Cursor. Use the sequential strategy or parallel `Task` subagents.
- The PR babysitting scripts and `find-polluter.sh` are bash and need `jq`. On Windows, run them with Git Bash.
- The `/foundations:*` commands referenced in the docs belong to a separate plugin that isn't included.
