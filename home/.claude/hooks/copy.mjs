// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// The copy of the shape rules a repo carries for cloud sessions (they load
// only the repo's own .claude/), as sync.mjs makes it and stale-copy.mjs
// checks it. Never copied itself.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { git } from "./lib.mjs";

// ~/.claude, the source
export const CLAUDE = join(dirname(fileURLToPath(import.meta.url)), "..");

// each copied file's place under ~/.claude, and in the repo
export const COPIED = [
  ["skills/shape/SKILL.md", ".claude/skills/shape/SKILL.md"],
  ["agents/shape-reviewer.md", ".claude/agents/shape-reviewer.md"],
  ...["lib", "survey-gate", "review-gate", "shape-check"].map((name) => [
    `hooks/${name}.mjs`,
    `.claude/hooks/shape/${name}.mjs`,
  ]),
];

// the hooks the copy registers in the repo's .claude/settings.json
export const REPO_HOOKS = {
  PreToolUse: [
    ["Edit|Write|MultiEdit|NotebookEdit", "survey-gate"],
    ["Bash", "review-gate"],
  ],
  PostToolUse: [["Edit|Write|MultiEdit|NotebookEdit|Bash", "shape-check"]],
};

// whether the repo carries a copy, and whether it matches ~/.claude byte
// for byte
export const repoCopy = (cwd) => {
  const top = git(cwd, "rev-parse", "--show-toplevel");
  if (!existsSync(join(top, ".claude/hooks/shape"))) return "none";
  const same = ([source, copy]) => {
    try {
      return readFileSync(join(CLAUDE, source)).equals(readFileSync(join(top, copy)));
    } catch {
      return false;
    }
  };
  return COPIED.every(same) ? "current" : "stale";
};
