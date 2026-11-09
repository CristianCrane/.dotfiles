// The change rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// Copies the change rules into a repo, byte for byte, and registers the
// copy's hooks in the repo's .claude/settings.json, so sessions without
// ~/.claude (cloud sessions) hold to them too. Run from ~/.claude:
//
//   node ~/.claude/hooks/sync.mjs [repo]   (default: the current repo)
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CLAUDE, COPIED, repoSettings, repoSettingsFile, withRepoHooks } from "./copy.mjs";
import { topOf } from "./lib.mjs";

const top = topOf(process.argv[2] ?? process.cwd());

for (const [source, copy] of COPIED) {
  mkdirSync(dirname(join(top, copy)), { recursive: true });
  copyFileSync(join(CLAUDE, source), join(top, copy));
  console.log(`copied ${copy}`);
}

// the repo's other settings and hooks stay; earlier change entries are replaced
writeFileSync(repoSettingsFile(top), JSON.stringify(withRepoHooks(repoSettings(top)), null, 2) + "\n");
console.log("registered the hooks in .claude/settings.json");
