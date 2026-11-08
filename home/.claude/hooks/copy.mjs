// The change rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// The copy of the change rules a repo carries for cloud sessions (they load
// only the repo's own .claude/), as sync.mjs makes it and stale-copy.mjs
// checks it. Never copied itself.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { topOf } from "./lib.mjs";

// ~/.claude, the source
export const CLAUDE = join(dirname(fileURLToPath(import.meta.url)), "..");

// each copied file's place under ~/.claude, and in the repo
export const COPIED = [
  ["skills/change/SKILL.md", ".claude/skills/change/SKILL.md"],
  ["skills/lessons/SKILL.md", ".claude/skills/lessons/SKILL.md"],
  ["agents/change-reviewer.md", ".claude/agents/change-reviewer.md"],
  ...["lib", "survey-gate", "review-gate", "change-check"].map((name) => [
    `hooks/${name}.mjs`,
    `.claude/hooks/change/${name}.mjs`,
  ]),
];

// the hooks the copy registers in the repo's .claude/settings.json
export const REPO_HOOKS = {
  PreToolUse: [
    ["Edit|Write|MultiEdit|NotebookEdit", "survey-gate"],
    ["Bash", "review-gate"],
  ],
  PostToolUse: [["Edit|Write|MultiEdit|NotebookEdit|Bash", "change-check"]],
};

// whether the repo carries a copy, and whether it matches ~/.claude byte
// for byte
export const repoCopy = (cwd) => {
  const top = topOf(cwd);
  if (!existsSync(join(top, ".claude/hooks/change"))) return "none";
  const same = ([source, copy]) => {
    try {
      return readFileSync(join(CLAUDE, source)).equals(readFileSync(join(top, copy)));
    } catch {
      return false;
    }
  };
  return COPIED.every(same) ? "current" : "stale";
};
