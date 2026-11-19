// Edited in github.com/CristianCrane/.dotfiles (home/.claude); user-level only, never copied into repos.
//
// Fast-forwards ~/.dotfiles to origin's main at every session start,
// whatever folder the session is in. Its working tree is linked into
// ~/.claude, live for every session, and a dotfiles PR merges on GitHub,
// where no local hook sees it: without this, every session ran the old
// hooks and rules until someone pulled by hand (7 times on 2026-11-19).
// Run as an async SessionStart hook; it says something only when it moved
// ~/.dotfiles or is stuck, and nothing when there is no ~/.dotfiles
// (another machine, a cloud session) or nothing to do.
//
// It never resets, overwrites or stashes: the user's uncommitted changes
// there are theirs. Git refuses a fast-forward over a changed file even
// when it equals the incoming one (the user's own /model save, which a PR
// then landed), so each changed file the merge touches is staged first,
// only when its working copy is byte-equal to origin's and staging it
// loses nothing staged. Anything else (a file changed differently, a
// branch other than main, commits origin lacks, git's index.lock) leaves
// it all as it is, named in one line.
//
// Killed partway (Claude Code kills an async hook at its timeout): the
// fetch, the slow part, is harmless to cut; staging is a step per file, each
// still equal to origin's on the next run; the merge is one ~15 ms git step.
// A merge cut short leaves git's index.lock (named, and left for the user,
// who can see whether a git still runs), or the new tree and index with
// HEAD unmoved, which the next run's staging finds equal and finishes. Two
// runs at once (SessionStart fires on startup, resume, clear and compact):
// the second leaves it to the first (lib's lock).
import { existsSync, lstatSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { git, hook, lock, run } from "./lib.mjs";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// a blob's sha (`<ref>:<path>`, or `:<path>` for the index), or null when
// it has none
const blob = (cwd, spec) => {
  try {
    return git(cwd, "rev-parse", "--verify", "--quiet", spec);
  } catch {
    return null;
  }
};

// the sha of `file`'s working copy, or null when it's gone. A symlink
// (the dotfiles track none) hashes by what it points at, never equal to
// git's blob of its target's name, so it's left and named; a dangling one
// throws, and the run says nothing and touches nothing
const working = (top, file) =>
  lstatSync(join(top, file), { throwIfNoEntry: false }) ? git(top, "hash-object", "--", file) : null;

// the paths a -z listing gives
const paths = (listing) => listing.split("\0").filter(Boolean);

// why ~/.dotfiles can't be fast-forwarded to `theirs` (origin's main), or
// null once it is; `done` collects what it did
const catchUp = (dir, branch, theirs, done) => {
  const top = git(dir, "rev-parse", "--show-toplevel");
  let at = null;
  try {
    at = git(top, "symbolic-ref", "--quiet", "--short", "HEAD");
  } catch {}
  if (at !== branch) return `it's on ${at || "a detached HEAD"}, not ${branch}: once it's back on ${branch}, the next session start catches it up`;
  const ahead = Number(git(top, "rev-list", "--count", `${theirs}..HEAD`));
  if (ahead)
    return `it has ${plural(ahead, "commit")} ${theirs} lacks (\`git -C ~/.dotfiles log ${theirs}..HEAD\`): they reach ${branch} by PR, or go, before it can catch up`;
  const indexLock = git(top, "rev-parse", "--path-format=absolute", "--git-path", "index.lock");
  if (existsSync(indexLock))
    return `${indexLock} is there, left by a git run cut short or held by one running now: once no git runs there, remove it, and the next session start catches it up`;

  // the files the merge touches that differ here from HEAD, staged or not,
  // or that are new and untracked
  const touched = new Set(paths(git(top, "diff", "--name-only", "--no-renames", "-z", "HEAD", theirs)));
  const changed = new Set([
    ...paths(git(top, "diff", "--name-only", "--no-renames", "-z", "HEAD")),
    ...paths(git(top, "diff", "--cached", "--name-only", "--no-renames", "-z", "HEAD")),
    ...paths(git(top, "ls-files", "--others", "--exclude-standard", "-z")),
  ]);
  const inTheWay = [...touched].filter((file) => changed.has(file));
  const differ = inTheWay.filter((file) => {
    const incoming = blob(top, `${theirs}:${file}`);
    const staged = blob(top, `:${file}`);
    return working(top, file) !== incoming || ![blob(top, `HEAD:${file}`), incoming].includes(staged);
  });
  if (differ.length) {
    const named = differ.slice(0, 3).join(", ") + (differ.length > 3 ? ` and ${differ.length - 3} more` : "");
    return `${named} changed here and on ${theirs} differently: once each is landed by PR or dropped, the next session start catches it up`;
  }
  if (inTheWay.length) git(top, "--literal-pathspecs", "add", "--all", "--", ...inTheWay);
  done.staged = inTheWay.length;
  try {
    run(top, "git", "merge", "--ff-only", "--quiet", theirs);
  } catch (error) {
    return `git merge --ff-only refused: ${error.message}`;
  }
  return null;
};

hook(() => {
  const dir = join(homedir(), ".dotfiles");
  if (!existsSync(dir)) return;
  const held = join(git(dir, "rev-parse", "--path-format=absolute", "--git-common-dir"), "claude/catch-up.lock");
  if (!lock(held)) return;
  try {
    // offline, or beside another session's fetch: it goes as far as the last
    // fetch brought origin
    try {
      run(dir, "git", "fetch", "--quiet", "origin");
    } catch {}
    let theirs = "origin/main";
    try {
      theirs = git(dir, "symbolic-ref", "--short", "refs/remotes/origin/HEAD");
    } catch {}
    const branch = theirs.slice("origin/".length);
    const was = git(dir, "rev-parse", "HEAD");
    const behind = Number(git(dir, "rev-list", "--count", `HEAD..${theirs}`));
    if (!behind) return;
    const done = { staged: 0 };
    const stuck = catchUp(dir, branch, theirs, done);
    if (stuck)
      return { systemMessage: `~/.dotfiles is ${plural(behind, "commit")} behind ${theirs} and was left as it is: ${stuck}.` };
    const now = git(dir, "rev-parse", "HEAD");
    const matched = done.staged ? ` (${plural(done.staged, "uncommitted file")} there already matched it)` : "";
    return {
      systemMessage: `~/.dotfiles caught up with ${theirs}: ${plural(behind, "commit")}, ${was.slice(0, 7)}..${now.slice(0, 7)}${matched}.`,
    };
  } finally {
    rmSync(held, { recursive: true, force: true });
  }
});
