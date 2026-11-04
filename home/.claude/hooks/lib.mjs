// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// What the shape hooks share: git, the per-branch survey and review files
// the `shape` skill writes into the git dir (never committed, kept per
// worktree), and the copy of the rules a repo may carry for sessions that
// have no ~/.claude (cloud sessions load only the repo's own .claude/).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOOKS = dirname(fileURLToPath(import.meta.url));

// what a repo's copy holds: each file's place under ~/.claude, and in the repo
export const COPIED = [
  ["skills/shape/SKILL.md", ".claude/skills/shape/SKILL.md"],
  ["agents/shape-reviewer.md", ".claude/agents/shape-reviewer.md"],
  ...["lib", "survey-gate", "review-gate", "shape-check"].map((name) => [
    `hooks/${name}.mjs`,
    `.claude/hooks/shape/${name}.mjs`,
  ]),
];

// the hooks a repo's copy registers in its .claude/settings.json
export const REPO_HOOKS = {
  PreToolUse: [
    ["Edit|Write|MultiEdit|NotebookEdit", "survey-gate"],
    ["Bash", "review-gate"],
  ],
  PostToolUse: [["Edit|Write|MultiEdit|NotebookEdit|Bash", "shape-check"]],
};

// "self" when this script is the repo's copy; otherwise whether the repo
// carries a copy, and whether it matches this one byte for byte
export const repoCopy = (cwd) => {
  const top = git(cwd, "rev-parse", "--show-toplevel");
  const dir = join(top, ".claude/hooks/shape");
  if (!existsSync(dir)) return "none";
  if (realpathSync(dir) === realpathSync(HOOKS)) return "self";
  const same = ([source, copy]) => {
    try {
      return readFileSync(join(HOOKS, "..", source)).equals(readFileSync(join(top, copy)));
    } catch {
      return false;
    }
  };
  return COPIED.every(same) ? "current" : "stale";
};

// a user-level hook leaves a repo with a current copy to that copy, so
// nothing runs twice; a stale copy runs beside it, and the newest rules hold
export const leftToRepo = (cwd) => repoCopy(cwd) === "current";

export const git = (cwd, ...args) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

export const lines = (text) => text.split("\n").filter(Boolean);

export const readInput = () => JSON.parse(readFileSync(0, "utf8"));

// the edited file's own checkout (the nearest folder that exists: a new
// file's own may not yet), so an edit in a worktree counts that worktree
export const cwdFor = (input) => {
  const path = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (!path) return input.cwd;
  let cwd = dirname(path);
  while (!existsSync(cwd)) cwd = dirname(cwd);
  return cwd;
};

// null on a detached HEAD (a rebase, a bisect): nothing is gated there
export const branchOf = (cwd) => {
  const branch = git(cwd, "rev-parse", "--abbrev-ref", "HEAD");
  return branch === "HEAD" ? null : branch;
};

export const stateFile = (cwd, kind, branch) => {
  const path = git(
    cwd,
    "rev-parse",
    "--path-format=absolute",
    "--git-path",
    `claude/${kind}-${branch.replaceAll("/", "-")}.md`,
  );
  mkdirSync(dirname(path), { recursive: true });
  return path;
};

// seconds since the epoch; 0 before the first commit
const headTime = (cwd) => {
  try {
    return Number(git(cwd, "log", "-1", "--format=%ct"));
  } catch {
    return 0;
  }
};

const mainBranches = ["main", "master"];

// the branch's survey and whether it counts: it must name a path that
// exists, and on main it must be newer than the last commit (each change
// on main gets its own)
export const survey = (cwd, branch) => {
  const path = stateFile(cwd, "survey", branch);
  if (!existsSync(path)) return { path, ok: false, reason: "missing" };
  const text = readFileSync(path, "utf8");
  if (
    mainBranches.includes(branch) &&
    statSync(path).mtimeMs / 1000 < headTime(cwd)
  )
    return { path, ok: false, reason: "older than the last commit" };
  const top = git(cwd, "rev-parse", "--show-toplevel");
  const named = text
    .split(/[\s,;()`'"<>]+/)
    .map((word) => word.replace(/[:.]+$/, ""))
    .filter((word) => /\w/.test(word) && /[/.]/.test(word))
    .some((word) => existsSync(isAbsolute(word) ? word : join(top, word)));
  if (!named) return { path, ok: false, reason: "names no path that exists" };
  const expected = Number(text.match(/^Expected files:\s*~?(\d+)/m)?.[1]);
  return { path, ok: true, expected: expected || null };
};

export const review = (cwd, branch) => {
  const path = stateFile(cwd, "review", branch);
  if (!existsSync(path)) return { path, ok: false, reason: "missing" };
  if (statSync(path).mtimeMs / 1000 < headTime(cwd))
    return { path, ok: false, reason: "older than the last commit" };
  return { path, ok: true };
};

// what the branch is measured against: where it left the default branch
export const base = (cwd) => {
  for (const ref of ["origin/HEAD", "origin/main", "origin/master", "main", "master"]) {
    try {
      return git(cwd, "merge-base", "HEAD", ref);
    } catch {}
  }
  return "HEAD";
};

// files the branch changes against its base, untracked ones included
export const changedFiles = (cwd) =>
  new Set([
    ...lines(git(cwd, "diff", "--name-only", base(cwd))),
    ...lines(git(cwd, "ls-files", "--others", "--exclude-standard")),
  ]);

// whether `path` sits in the git dir (where the survey and review live)
export const inGitDir = (cwd, path) =>
  [
    git(cwd, "rev-parse", "--path-format=absolute", "--git-dir"),
    git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"),
  ].some((dir) => path.startsWith(dir + "/"));
