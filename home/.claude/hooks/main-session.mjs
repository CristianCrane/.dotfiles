// At session start, adds main-session.md, the rules only the main session
// needs, to its context. Agents never get SessionStart output (0 of 700
// agent transcripts held any, 2026-11-19), so it costs them nothing; it is
// sent again after a clear or a compaction.
//
// First it checks ~/.dotfiles, whose home/.claude is ~/.claude, for what a
// machine stop leaves (catch-up.mjs's header): a tracked file empty or
// holding null bytes where the last commit's copy is text, git's index
// unreadable, or git unable to read the last commit or a stored copy. Any
// of these is a WARNING, shown to the user under the prompt box
// (systemMessage) and put ahead of main-session.md for Claude
// (additionalContext), each with the commands that put it right; on
// 2026-11-23 a stop emptied ~/.claude/CLAUDE.md and every session after
// ran without it, saying nothing. An edit of the user's (any other
// content, a file removed) is never damage, nor is a file empty or binary
// in the last commit. ~13 ms on the real ~/.dotfiles.
//
// It imports nothing of ours (lib.mjs is a file a stop can empty too) and
// checks in a try of its own, so main-session.md goes out whatever the
// check met. Its blind spots: an empty ~/.claude/settings.json runs no
// hook, and an empty copy of this file says nothing.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// main-session.md, or nothing when it can't be read (the warning still goes)
let rules = "";
try {
  rules = readFileSync(new URL("./main-session.md", import.meta.url), "utf8");
} catch {}

// how a file restored under ~/.claude reaches the session: restored from
// inside it, as quitting takes the warning off the screen (Claude Code
// draws on the terminal's alternate screen), then a restart, which reads
// it. Quitting prints the command that reopens the conversation, when it
// has a message to reopen
const restart = (lead, what) => `\n${lead} quit Claude Code and start it again, so it reads ${what}.`;
const FSCK = "\n  git -C ~/.dotfiles fsck";
// what this session ran without, when git can't say what's damaged
const UNCHECKED = "this session's rules, hooks and skills under ~/.claude weren't checked for damage";

// git's output in `dir` (a Buffer when `encoding` is "buffer"), or a throw
// with git's last error line, its `fatal:` one (a bad index's first is
// "error: bad signature 0x00000000", its last "fatal: index file corrupt")
const git = (dir, args, encoding = "utf8") => {
  const ran = spawnSync("git", ["-C", dir, ...args], { encoding, maxBuffer: 1 << 30 });
  if (ran.status === 0) return ran.stdout;
  const said = String(ran.stderr ?? "").split("\n").findLast(Boolean);
  throw new Error(said ?? ran.error?.message ?? "git failed");
};

// "a", "a and b", "a, b and c"
const list = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

// how `mine` (a working copy) is damaged against `theirs` (the last
// commit's), or null when it isn't: empty or holding a null byte, where
// the last commit's copy is text
const damage = (mine, theirs) => {
  if (!theirs.length || theirs.includes(0)) return null;
  if (!mine.length) return { kind: "empty" };
  if (!mine.includes(0)) return null;
  if (mine.every((byte) => byte === 0)) return { kind: "all null bytes" };
  // what's left of the text, each byte where the last commit has it: what
  // the stop kept of the last commit's copy, so a restore loses nothing;
  // anything else may be an edit of the user's
  const kept = mine.length <= theirs.length && mine.every((byte, at) => byte === 0 || byte === theirs[at]);
  return { kind: "cut off by null bytes", edited: !kept };
};

// a tracked path as the user knows it: ~/.claude/… for home/.claude's
const LIVE = "home/.claude/";
const shown = (path) => (path.startsWith(LIVE) ? `~/.claude/${path.slice(LIVE.length)}` : `~/.dotfiles/${path}`);

// the warning for ~/.dotfiles, or null when it's sound or not there
const check = () => {
  const dir = join(homedir(), ".dotfiles");
  if (!existsSync(dir)) return null;
  try {
    let index = null;
    try {
      git(dir, ["ls-files", "-z"]);
    } catch (error) {
      index = error.message;
    }
    const top = git(dir, ["rev-parse", "--show-toplevel"]).trim();
    const found = [];
    for (const entry of git(dir, ["ls-tree", "-r", "-z", "HEAD"]).split("\0").filter(Boolean)) {
      const tab = entry.indexOf("\t");
      const [mode, type, sha] = entry.slice(0, tab).split(" ");
      const path = entry.slice(tab + 1);
      if (type !== "blob" || mode === "120000") continue;
      let mine;
      try {
        mine = readFileSync(join(top, path));
      } catch {
        continue;
      }
      if (mine.length && !mine.includes(0)) continue;
      let theirs;
      try {
        theirs = git(dir, ["cat-file", "blob", sha], "buffer");
      } catch (error) {
        throw Object.assign(error, { copy: { path, kind: mine.length ? "holding null bytes" : "empty" } });
      }
      const hit = damage(mine, theirs);
      if (hit) found.push({ path, ...hit });
    }
    return (index || found.length) && words(index, found);
  } catch (error) {
    const said = `(git says: ${error.message})`;
    if (!error.copy)
      return (
        `WARNING: git can't read the last commit in ~/.dotfiles, likely from a crash ${said}, so ${UNCHECKED}. ` +
        `Claude can help repair it from GitHub's copy. To see what's broken:${FSCK}` +
        restart("If the repair changes a file under ~/.claude,", "it")
      );
    // a damaged file whose stored copy is unreadable too: the check stops
    // there, so the file leads as in words(), and the rest is unchecked
    const { path, kind } = error.copy;
    const live = path.startsWith(LIVE);
    return (
      `WARNING: ${live ? `this session started with ${shown(path)} ${kind}` : `${shown(path)} is ${kind}`}, likely from ` +
      `a crash, and git can't read the last commit's copy of it ${said}, so there's no good copy here, and ` +
      `${live ? "the rest of " : ""}${UNCHECKED}. Claude can help restore it from GitHub's copy. ` +
      `To see what else is broken:${FSCK}` +
      (live ? restart("Once it's restored,", "the restored file") : "")
    );
  }
};

// the warning's words for a damaged index (git's line, or null) and files
const words = (index, found) => {
  const live = found.filter(({ path }) => path.startsWith(LIVE));
  const other = found.filter(({ path }) => !path.startsWith(LIVE));
  // a file and how it's damaged ("~/.claude/CLAUDE.md empty"); `is` puts
  // the verb in ("~/.dotfiles/docs/x.md is empty")
  const named = (is) => ({ path, kind }) => `${shown(path)}${is ? " is" : ""} ${kind}`;
  // each fact: what's damaged, then what follows from it; "likely from a
  // crash" goes between the first's two. What costs this session leads
  const facts = [
    live.length && [`this session started with ${list(live.map(named(false)))}`, ""],
    other.length && [list(other.map(named(true))), ""],
    index && [
      "git's index in ~/.dotfiles is damaged",
      ` (git says: ${index}), so git status and restore fail there and it stops catching up with GitHub`,
    ],
  ].filter(Boolean);
  const said = facts.map(([what, after], at) => `${what}${at ? "" : ", likely from a crash"}${after}`).join(", and ");
  const edits = found
    .filter(({ edited }) => edited)
    .map(({ path }) => ` The text left in ${shown(path)} isn't the last commit's: copy out any edits of yours first.`);
  const files = found.length;
  const commands = [
    ...(index ? ["read-tree HEAD"] : []),
    ...[...live, ...other].map(({ path }) => `checkout HEAD -- ${path}`),
  ].map((command) => `\n  git -C ~/.dotfiles ${command}`);
  // run from inside the session (restart's comment), by Claude or by him
  const run = ` (Claude can run ${commands.length > 1 ? "these" : "this"} for you):`;
  const restore = files > 1 ? "the files from the last commit's good copies" : "the file from the last commit's good copy";
  const steps = index
    ? files
      ? ` Rebuild the index first (every file stays as it is), then restore ${restore}${run}`
      : ` Rebuild it from the last commit, every file staying as it is${run}`
    : ` The last commit has a good copy${files > 1 ? " of each" : ""}. Restore ${files > 1 ? "them" : "it"}${run}`;
  // a live file restored reaches this session once Claude Code starts again
  const after = live.length ? restart("Then", `the restored file${files > 1 ? "s" : ""}`) : "";
  return `WARNING: ${said}.${edits.join("")}${steps}${commands.join("")}${after}`;
};

// the line, for Claude alone, that leads the warning in its context
const FOR_CLAUDE =
  "The session-start check of ~/.dotfiles found the damage below. Tell the user first in your next reply, before " +
  "anything else, and offer to run its git commands, saving any text it says to copy out first. A file restored " +
  "under ~/.claude takes effect once Claude Code restarts; quitting prints the command that reopens this conversation.";

let warning = null;
try {
  warning = check();
} catch {}
console.log(
  JSON.stringify({
    ...(warning && { systemMessage: warning }),
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: warning ? `${FOR_CLAUDE}\n\n${warning}\n\n${rules}` : rules,
    },
  }),
);
