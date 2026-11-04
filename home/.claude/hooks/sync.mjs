// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// Copies the shape rules into a repo, byte for byte, and registers the
// copy's hooks in the repo's .claude/settings.json, so sessions without
// ~/.claude (cloud sessions) hold to them too. Run from ~/.claude:
//
//   node ~/.claude/hooks/sync.mjs [repo]   (default: the current repo)
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CLAUDE, COPIED, REPO_HOOKS } from "./copy.mjs";
import { topOf } from "./lib.mjs";

const top = topOf(process.argv[2] ?? process.cwd());

for (const [source, copy] of COPIED) {
  mkdirSync(dirname(join(top, copy)), { recursive: true });
  copyFileSync(join(CLAUDE, source), join(top, copy));
  console.log(`copied ${copy}`);
}

// the repo's other settings and hooks stay; earlier shape entries are replaced
const file = join(top, ".claude/settings.json");
const settings = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
const ours = (group) => group.hooks?.some((hook) => hook.command?.includes(".claude/hooks/shape/"));
settings.hooks ??= {};
for (const [event, entries] of Object.entries(REPO_HOOKS)) {
  settings.hooks[event] = [
    ...(settings.hooks[event] ?? []).filter((group) => !ours(group)),
    ...entries.map(([matcher, name]) => ({
      matcher,
      hooks: [
        {
          type: "command",
          command: `node "$CLAUDE_PROJECT_DIR/.claude/hooks/shape/${name}.mjs"`,
          timeout: 10,
        },
      ],
    })),
  ];
}
writeFileSync(file, JSON.stringify(settings, null, 2) + "\n");
console.log("registered the hooks in .claude/settings.json");
