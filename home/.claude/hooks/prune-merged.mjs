// Edited in github.com/CristianCrane/.dotfiles (home/.claude); user-level only, never copied into repos.
//
// Removes a repo's worktrees and branches whose PR merged, so nobody has to
// remember to (CristianCrane/empire-cleaning#263: 4 worktrees and 34
// branches on GitHub had piled up). By hand, from any checkout of a GitHub
// repo:
//
//   node ~/.claude/hooks/prune-merged.mjs [--dry-run]
//
// and from the SessionStart hook (`--hook`, run in the background) in a
// repo's main checkout, where it says something only when it removed
// something or a merged worktree is stuck, and nothing at all when it
// can't run (no network, no gh, not on GitHub).
//
// What goes:
// - a worktree other than the main checkout, whose branch's merged PR holds
//   its HEAD (or whose detached HEAD is in origin's default branch), when it
//   has no uncommitted or untracked changes, isn't locked, no process works
//   in it, and it wasn't used for RECENT. Agents work in a worktree by
//   `cd <it> && …` on each call (agent-gate.mjs), so between calls no
//   process is there: only its last use shows it's live.
// - a branch, local or on origin, whose merged PR holds its tip, when no
//   open PR has its name; never the default branch, nor one checked out.
//   On origin only your own PR's branch, and only if it is still where it
//   was fetched (a lease).
// A branch with no PR, a PR closed unmerged, commits its merged PR lacks,
// or (on origin) another author's PR is listed and kept: the user decides.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readlinkSync, renameSync, rmSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { git, hook, lines, topOf } from "./lib.mjs";

// how long a worktree stays after its last use: empire-cleaning's live ones
// had been used 0–6 minutes before, its stale ones 11–20 hours (2026-11-09)
const RECENT = 6 * 60 * 60 * 1000;

// a command that may reach the network (fetch, push, gh), or whose refusal
// the report quotes: its output, or a throw with its first error line; never
// a prompt, and at most 30 s
const run = (cwd, command, ...args) => {
  const ran = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GH_PROMPT_DISABLED: "1" },
  });
  if (ran.status === 0) return ran.stdout.trim();
  throw new Error(lines(ran.stderr ?? "")[0] ?? ran.error?.message ?? `${command} failed`);
};

// whether `commit` holds `tip` (is it, or comes after it)
const holds = (cwd, commit, tip) => {
  try {
    git(cwd, "merge-base", "--is-ancestor", tip, commit);
    return true;
  } catch {
    return false;
  }
};

// the repo's worktrees, the main checkout first (as git lists them)
const worktrees = (cwd) =>
  git(cwd, "worktree", "list", "--porcelain")
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const fields = Object.fromEntries(
        lines(block).map((line) => [line.split(" ")[0], line.slice(line.indexOf(" ") + 1)]),
      );
      return {
        path: fields.worktree,
        head: fields.HEAD,
        branch: fields.branch?.replace(/^refs\/heads\//, ""),
        skip: "bare" in fields || "prunable" in fields,
        locked: "locked" in fields,
      };
    });

// branch name → tip, under `prefix`
const tips = (cwd, prefix) =>
  new Map(
    lines(git(cwd, "for-each-ref", "--format=%(objectname) %(refname)", prefix))
      .map((line) => line.split(" "))
      .map(([sha, ref]) => [ref.slice(prefix.length), sha])
      .filter(([name]) => name !== "HEAD"),
  );

// the pids whose working folder is in `dir`; throws where there's no /proc
// to read (not Linux), so nothing is taken for idle unseen
const processesIn = (dir) =>
  readdirSync("/proc")
    .filter((pid) => /^\d+$/.test(pid))
    .filter((pid) => {
      try {
        const cwd = readlinkSync(`/proc/${pid}/cwd`);
        return cwd === dir || cwd.startsWith(`${dir}/`);
      } catch {
        return false;
      }
    });

// when a worktree was last used: its git dir's HEAD and reflog (a switch,
// commit or reset) and the change skill's files there; never its index,
// which a `git status` (this script's own) rewrites
const lastUsed = (wt) => {
  const dir = git(wt.path, "rev-parse", "--absolute-git-dir");
  const claude = join(dir, "claude");
  const files = [join(dir, "HEAD"), join(dir, "logs/HEAD")];
  if (existsSync(claude)) files.push(...readdirSync(claude).map((name) => join(claude, name)));
  return Math.max(...files.filter((file) => existsSync(file)).map((file) => statSync(file).mtimeMs));
};

// why a merged worktree stays: { why, stuck } (stuck: it won't go by
// itself), or null when nothing keeps it
const busy = (wt) => {
  if (wt.locked) return { why: "locked", stuck: true };
  if (git(wt.path, "status", "--porcelain")) return { why: "uncommitted or untracked changes", stuck: true };
  try {
    const pids = processesIn(wt.path);
    if (pids.length) return { why: `a process works in it (pid ${pids.join(", ")})`, stuck: true };
  } catch {
    return { why: "can't tell whether a process works in it", stuck: true };
  }
  const since = Date.now() - lastUsed(wt);
  if (since < RECENT) return { why: `used ${Math.round(since / 60_000)} min ago`, stuck: false };
  return null;
};

// deletes a folder at low priority; a deletion cut short leaves it for the
// next run
const erase = (dir) => {
  const ran = spawnSync("nice", ["-n", "19", "ionice", "-c3", "rm", "-rf", dir]);
  if (ran.status !== 0 && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
};

// removes a worktree in one step a kill can't leave half done: its folder
// moves into `trash` (a rename), is checked for changes once more there
// (and moved back if it has any), its entry is pruned, and only then is it
// deleted. Across disks, `git worktree remove` does it instead.
const remove = (main, trash, wt) => {
  mkdirSync(trash, { recursive: true });
  const aside = join(trash, `${basename(wt.path)}-${Date.now()}`);
  try {
    renameSync(wt.path, aside);
  } catch (error) {
    if (error.code !== "EXDEV") throw error;
    run(main, "git", "worktree", "remove", wt.path);
    return;
  }
  if (git(aside, "status", "--porcelain")) {
    renameSync(aside, wt.path);
    throw new Error("changes turned up as it was removed");
  }
  git(main, "worktree", "prune");
  erase(aside);
};

// what goes and what stays, and with `dry` false, removes it
const prune = (cwd, dry) => {
  const all = worktrees(cwd);
  const main = all[0].path;
  // as written, before any insteadOf
  const url = git(main, "config", "--get", "remote.origin.url");
  const [, owner, name] = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/) ?? [];
  if (!owner) throw new Error(`origin isn't on GitHub (${url})`);
  const gh = (...args) => JSON.parse(run(main, "gh", ...args));
  const { viewer, repository } = gh(
    "api",
    "graphql",
    "-f",
    "query=query($owner: String!, $name: String!) { viewer { login } repository(owner: $owner, name: $name) { defaultBranchRef { name } } }",
    "-F",
    `owner=${owner}`,
    "-F",
    `name=${name}`,
  ).data;
  const base = repository.defaultBranchRef.name;
  const prs = Map.groupBy(
    gh(
      "pr",
      "list",
      "-R",
      `${owner}/${name}`,
      "--state",
      "all",
      "--limit",
      "1000",
      "--json",
      "number,state,headRefName,headRefOid,isCrossRepository,author",
    ).filter((pr) => !pr.isCrossRepository),
    (pr) => pr.headRefName,
  );
  run(main, "git", "fetch", "--prune", "--quiet", "origin");
  const trash = join(git(main, "rev-parse", "--path-format=absolute", "--git-common-dir"), "claude/pruned");
  if (!dry) {
    // what a run cut short left
    if (existsSync(trash)) readdirSync(trash).forEach((left) => erase(join(trash, left)));
    git(main, "worktree", "prune");
  }

  // what a branch's PRs say of its tip: { open }, { merged }, or { keep: why }
  const verdict = (branch, tip) => {
    const own = prs.get(branch) ?? [];
    const open = own.find((pr) => pr.state === "OPEN");
    if (open) return { open };
    const merged = own.find((pr) => pr.state === "MERGED" && holds(main, pr.headRefOid, tip));
    if (merged) return { merged };
    if (own.some((pr) => pr.state === "MERGED")) return { keep: "commits its merged PR doesn't have" };
    return { keep: own.length ? "its PR closed unmerged" : "no PR" };
  };

  const done = { removed: [], kept: [], local: [], remote: [], branchesKept: new Map(), failed: [] };
  const checkedOut = new Set([base, all[0].branch]);
  for (const wt of all.slice(1).filter((wt) => !wt.skip)) {
    const where = relative(main, wt.path);
    const keep = (why, stuck = false) => {
      done.kept.push({ where, branch: wt.branch, why, stuck });
      checkedOut.add(wt.branch);
    };
    let pr = null;
    if (wt.branch) {
      const said = verdict(wt.branch, wt.head);
      if (said.open) {
        keep(`open PR #${said.open.number}`);
        continue;
      }
      if (said.keep) {
        keep(said.keep);
        continue;
      }
      pr = said.merged;
    } else if (!holds(main, `refs/remotes/origin/${base}`, wt.head)) {
      keep(`detached, at a commit not in origin/${base}`);
      continue;
    }
    const held = busy(wt);
    if (held) {
      keep(held.why, held.stuck);
      continue;
    }
    if (!dry)
      try {
        remove(main, trash, wt);
      } catch (error) {
        keep(`not removed: ${error.message}`, true);
        continue;
      }
    done.removed.push({ where, branch: wt.branch, pr: pr?.number, base });
  }

  // the branches no worktree keeps: each copy, local and on origin, judged
  // by its own tip
  const local = tips(main, "refs/heads/");
  const remote = tips(main, "refs/remotes/origin/");
  const keepBranch = (why, branch) => {
    const names = done.branchesKept.get(why) ?? new Set();
    names.add(remote.has(branch) ? branch : `${branch} (local only)`);
    done.branchesKept.set(why, names);
  };
  for (const branch of new Set([...local.keys(), ...remote.keys()])) {
    if (checkedOut.has(branch)) continue;
    if (local.has(branch)) {
      const said = verdict(branch, local.get(branch));
      if (said.merged) done.local.push(branch);
      else if (said.keep) keepBranch(said.keep, branch);
    }
    if (remote.has(branch)) {
      const said = verdict(branch, remote.get(branch));
      if (said.merged?.author?.login === viewer.login) done.remote.push(branch);
      else if (said.merged) keepBranch(`merged, not your PR (on origin)`, branch);
      else if (said.keep) keepBranch(said.keep, branch);
    }
  }
  if (dry) return done;

  for (const branch of done.local)
    try {
      run(main, "git", "branch", "-D", branch);
    } catch (error) {
      done.failed.push({ branch, where: "local", why: error.message });
    }
  if (done.remote.length)
    try {
      run(
        main,
        "git",
        "push",
        "--quiet",
        ...done.remote.map((branch) => `--force-with-lease=refs/heads/${branch}:${remote.get(branch)}`),
        "origin",
        "--delete",
        ...done.remote,
      );
    } catch (error) {
      // a deleted branch's tracking ref goes with it: what's left failed
      const left = tips(main, "refs/remotes/origin/");
      for (const branch of done.remote.filter((branch) => left.has(branch)))
        done.failed.push({ branch, where: "origin", why: error.message });
    }
  for (const side of ["local", "remote"]) {
    const where = side === "local" ? "local" : "origin";
    done[side] = done[side].filter((branch) => !done.failed.some((f) => f.branch === branch && f.where === where));
  }
  return done;
};

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : word.endsWith("h") ? "es" : "s"}`;

// everything it did and kept, for a run by hand
const report = (done, dry) => {
  const [remove, del] = dry ? ["Would remove", "Would delete"] : ["Removed", "Deleted"];
  const out = [];
  if (done.removed.length)
    out.push(
      `${remove} ${plural(done.removed.length, "worktree")}:`,
      ...done.removed.map(
        ({ where, branch, pr, base }) => `  ${where} (${branch ? `${branch}, PR #${pr} merged` : `detached, in origin/${base}`})`,
      ),
    );
  if (done.local.length) out.push(`${del} ${plural(done.local.length, "local branch")}: ${done.local.join(", ")}`);
  if (done.remote.length) out.push(`${del} ${plural(done.remote.length, "branch")} on origin: ${done.remote.join(", ")}`);
  if (done.kept.length)
    out.push("Kept worktrees:", ...done.kept.map(({ where, branch, why }) => `  ${where} (${branch ?? "detached"}): ${why}`));
  if (done.branchesKept.size)
    out.push(
      "Kept branches, yours to decide:",
      ...[...done.branchesKept].map(([why, names]) => `  ${why} (${names.size}): ${[...names].join(", ")}`),
    );
  if (done.failed.length)
    out.push("Failed:", ...done.failed.map(({ branch, where, why }) => `  ${branch} (${where}): ${why}`));
  return out.join("\n") || "Nothing to remove, and nothing kept.";
};

// one line for a session's start: what went, and each merged worktree that
// won't go by itself; nothing when neither
const summary = (done) => {
  const gone = [
    done.removed.length && plural(done.removed.length, "worktree"),
    done.local.length && plural(done.local.length, "local branch"),
    done.remote.length && `${plural(done.remote.length, "branch")} on origin`,
  ].filter(Boolean);
  const stuck = done.kept.filter(({ stuck }) => stuck);
  if (!gone.length && !stuck.length && !done.failed.length) return null;
  return [
    gone.length && `Pruned merged work: ${gone.join(", ")}.`,
    ...stuck.map(({ where, why }) => `Kept ${where}, merged but: ${why}.`),
    done.failed.length && `${plural(done.failed.length, "branch deletion")} failed.`,
    "`node ~/.claude/hooks/prune-merged.mjs --dry-run` lists what it keeps and why.",
  ]
    .filter(Boolean)
    .join(" ");
};

if (process.argv.includes("--hook"))
  hook((input) => {
    if (topOf(input.cwd) !== worktrees(input.cwd)[0].path) return;
    const message = summary(prune(input.cwd, false));
    return message && { systemMessage: message };
  });
else {
  const dry = process.argv.includes("--dry-run");
  try {
    console.log(report(prune(process.cwd(), dry), dry));
  } catch (error) {
    console.error(`prune-merged: ${error.message}`);
    process.exitCode = 1;
  }
}
