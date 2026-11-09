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
  ...["lib", "survey-gate", "review-gate", "change-check", "agent-gate"].map((name) => [
    `hooks/${name}.mjs`,
    `.claude/hooks/change/${name}.mjs`,
  ]),
];

// the hooks the copy registers in the repo's .claude/settings.json, as
// { event: [[matcher, hook name], …] }: read from ~/.claude/settings.json,
// each entry there that runs a copied hook, so cloud sessions are gated on
// the same tool calls (one that runs no copied hook, or no hook file at
// all, stays user-level)
export const repoHooks = ({ hooks = {} } = JSON.parse(readFileSync(join(CLAUDE, "settings.json"), "utf8"))) => {
  const copied = new Set(COPIED.map(([source]) => source.match(/^hooks\/(.+)\.mjs$/)?.[1]).filter(Boolean));
  return Object.fromEntries(
    Object.entries(hooks)
      .map(([event, groups]) => [
        event,
        groups.flatMap((group) =>
          group.hooks
            .map((entry) => entry.command?.match(/\.claude\/hooks\/([\w-]+)\.mjs/)?.[1])
            .filter((name) => copied.has(name))
            .map((name) => [group.matcher, name]),
        ),
      ])
      .filter(([, entries]) => entries.length),
  );
};

// a group in a repo's settings that runs one of the copied hooks
const ours = (group) => group.hooks?.some((hook) => hook.command?.includes(".claude/hooks/change/"));

// a repo's settings with the copy's hooks registered as repoHooks says:
// every earlier change entry replaced, in every event (so one dropped from
// ~/.claude's settings goes), and the repo's own settings and hooks kept
export const withRepoHooks = (settings) => {
  const wanted = repoHooks();
  const hooks = { ...settings.hooks };
  for (const event of new Set([...Object.keys(hooks), ...Object.keys(wanted)])) {
    const groups = [
      ...(hooks[event] ?? []).filter((group) => !ours(group)),
      ...(wanted[event] ?? []).map(([matcher, name]) => ({
        matcher,
        hooks: [
          {
            type: "command",
            command: `node "$CLAUDE_PROJECT_DIR/.claude/hooks/change/${name}.mjs"`,
            timeout: 10,
          },
        ],
      })),
    ];
    if (groups.length) hooks[event] = groups;
    else delete hooks[event];
  }
  return { ...settings, hooks };
};

// the repo's .claude/settings.json, {} when it has none
export const repoSettingsFile = (top) => join(top, ".claude/settings.json");
export const repoSettings = (top) => {
  const file = repoSettingsFile(top);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
};

// whether the repo carries a copy, and whether it matches ~/.claude: its
// files byte for byte, and its settings as a sync would leave them
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
  let registered = false;
  try {
    const settings = repoSettings(top);
    registered = JSON.stringify(withRepoHooks(settings)) === JSON.stringify(settings);
  } catch {}
  return COPIED.every(same) && registered ? "current" : "stale";
};
