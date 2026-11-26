// The change hooks' cases (CristianCrane/.dotfiles#10): the gates'
// (survey-gate, review-gate, agent-gate, process-gate, scratch-gate,
// reviewer-gate), each fed to the hook as Claude Code runs it (`node
// <hook>.mjs`, the tool call's JSON on stdin, with the input fields
// MORE_INPUT adds, in a scratch repo), and below them plain tests of
// scratch-gate at a subagent's start, reviewer-gate's other callers, the curator and the ux-reviewer, capture (the process layer's inbox), user-words (the inbox's words for a ux-reviewer), the
// survey gate on main (branch first where origin is on GitHub),
// review-gate's merge rule, a dictated settings change, a prototype branch, lib's cwdFor and
// substitutions, the
// scripts' flags, prune-merged (the SessionStart hook that removes merged
// work), red-checks (the SessionStart hook that names what is red),
// catch-up (the SessionStart hook that fast-forwards ~/.dotfiles),
// usage (the ledger of tokens spent, its reports, and the
// SessionStart check that the weekly review is due), steps (one agent's
// profile from its transcript), main-session (the
// main session's SessionStart message), pr-conflict (the note that a PR
// conflicting with its base runs no CI), settings-format, and the repo's
// .githooks (pre-commit, which runs settings-format, and post-commit). Run
// from the repo root:
//
//   node --test 'home/.claude/hooks/*.test.mjs'
//
// (quoted, so node expands the glob: Node 24 runs a bare directory as one
// failing file). The hooks are this file's neighbours, never ~/.claude's,
// so a copy of it in a checkout of an older commit tests that commit's
// hooks.
//
// A gate's case is a row: [state, command, expected]. The command (for
// scratch-gate, a path to Write or a shell command) is what TOOL_INPUT
// makes the tool call from; its <body>, <repo>, <outside> and <own> stand
// for the state's paths. Expected is THROUGH or the gist of the
// turn-down, so a case held for one reason can't pass for another. Every
// state with a through row has a row it holds too (a test below checks),
// so a hook that fails silently (lib's `hook()` swallows errors) can't
// pass a through case.

import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { cwdFor, lines, stateFile, substitutions, workOf } from "./lib.mjs";
import { formatSettings } from "./settings-format.mjs";
import * as steps from "./steps.mjs";

const HOOKS = dirname(fileURLToPath(import.meta.url));
const BRANCH = "feature";

// git, here and in the hooks, reads none of the machine's config but its
// default excludes file, ~/.config/git/ignore (home.nix's
// `programs.git.ignores`), which GIT_CONFIG_GLOBAL doesn't replace; the
// F7 test sets its own core.excludesFile over it. (A GIT_CONFIG_COUNT entry
// hiding it would outrank that repo config too.)
Object.assign(process.env, {
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@t",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@t",
});

const dirs = [];
after(() => dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const scratchDir = () => {
  const dir = mkdtempSync(join(tmpdir(), "change-hooks-"));
  dirs.push(dir);
  return dir;
};

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

// runs hooks/<name>.mjs as Claude Code does: `input` as JSON on stdin (none
// when undefined), then `args` after the script and any other spawnSync
// `options`
const runHook = (name, input, { args = [], ...options } = {}) =>
  spawnSync(process.execPath, [join(HOOKS, `${name}.mjs`), ...args], {
    input: input === undefined ? undefined : JSON.stringify(input),
    encoding: "utf8",
    ...options,
  });

// a fake `name` (gh, sync), for a folder (`bin`, its own unless given)
// put first on PATH: an sh script that logs each run's arguments, a line
// each, to <name>-args beside it, then runs `body`; that folder and log
const fakeCommand = (name, body, bin = scratchDir()) => {
  mkdirSync(bin, { recursive: true });
  const log = join(bin, `${name}-args`);
  writeFileSync(join(bin, name), `#!/bin/sh\necho "$*" >> "${log}"\n${body}\n`, { mode: 0o755 });
  return { bin, log };
};

// a bare origin for `repo`, on main, reached by a github.com URL (as gh
// and prune-merged see one), with main pushed; its path
const withOrigin = (repo, dir = scratchDir()) => {
  const origin = join(dir, "origin.git");
  git(dir, "init", "-q", "--bare", "-b", "main", origin);
  git(repo, "config", `url.${origin}.insteadOf`, "https://github.com/o/r");
  git(repo, "remote", "add", "origin", "https://github.com/o/r");
  git(repo, "push", "-q", "origin", "main");
  return origin;
};

const commit = (repo, file, text) => {
  writeFileSync(join(repo, file), text);
  git(repo, "add", file);
  git(repo, "commit", "-qm", file);
};

// a scratch HOME whose .dotfiles links to a clone of a bare origin (as
// ~/.dotfiles links to the main checkout), never the real one: the live
// clone, its HOME, and `merged(file, text)`, which lands a commit on
// origin's main from a second clone, standing for a PR merged on GitHub;
// with `dotfiles` false, HOME has no .dotfiles
const live = ({ dotfiles = true } = {}) => {
  const dir = scratchDir();
  const origin = join(dir, "origin.git");
  git(dir, "init", "-q", "--bare", "-b", "main", origin);
  const repo = join(dir, "live");
  git(dir, "clone", "-q", origin, repo);
  commit(repo, "a.txt", "a\n");
  commit(repo, "b.txt", "b\n");
  git(repo, "push", "-q", "origin", "main");
  const other = join(dir, "other");
  git(dir, "clone", "-q", origin, other);
  const home = join(dir, "home");
  mkdirSync(home);
  if (dotfiles) symlinkSync(repo, join(home, ".dotfiles"));
  const merged = (file, text) => {
    if (text === null) git(other, "rm", "-q", file);
    else writeFileSync(join(other, file), text);
    git(other, "add", "-A");
    git(other, "commit", "-qm", file);
    git(other, "push", "-q", "origin", "main");
    return git(other, "rev-parse", "HEAD");
  };
  return { dir, origin, repo, home, merged };
};

// one of the change skill's files for BRANCH, where lib looks for it
const write = (repo, kind, text) => {
  const path = stateFile(repo, kind, BRANCH);
  writeFileSync(path, text);
  return path;
};

// a repo on BRANCH, one commit past main, with the change skill's files
// given: `review` writes one of HEAD (a string: its findings, after the
// header; `header` replaces the header's words after the sha), `ux` a UX
// review (it may take HEAD's short sha), `lessons` and `body` their text
// (`body` may take HEAD's full sha); `said`, a message the user typed, in
// the session's transcript
const scratchRepo = ({ review = false, header = "round 1, 0 to recheck", ux, lessons, body, said } = {}) => {
  const repo = scratchDir();
  git(repo, "init", "-qb", "main");
  commit(repo, "a.txt", "a\n");
  git(repo, "switch", "-qc", BRANCH);
  commit(repo, "b.txt", "b\n");
  const head = git(repo, "rev-parse", "--short", "HEAD");
  if (review)
    write(repo, "review", `# Change review: ${BRANCH} @ ${head}, ${header}\n${review === true ? "" : review}`);
  if (ux !== undefined) write(repo, "ux-review", typeof ux === "function" ? ux(head) : ux);
  if (lessons !== undefined) write(repo, "lessons", lessons);
  if (typeof body === "function") body = body(git(repo, "rev-parse", "HEAD"));
  let transcript;
  if (said !== undefined) {
    transcript = join(scratchDir(), "t.jsonl");
    writeFileSync(transcript, `${JSON.stringify({ type: "user", origin: { kind: "human" }, message: { role: "user", content: said } })}\n`);
  }
  return { repo, transcript, body: body === undefined ? undefined : write(repo, "pr-body", body) };
};

const ROUTED = "Signals for feature:\n- A cost → inbox 1a2b3c4d\n";
const BEFORE = "**Before / after:**\n| Before | After |\n| --- | --- |\n| a | b |\n";
// a UX review of HEAD with no findings, for a body with Before / after
const CLEAN_UX = (head) => `# UX review: ${BRANCH} @ ${head}, first pass, 0 to recheck\n`;
// a UX review of HEAD, its second pass, with two findings: it saw U1's fix,
// and turned U2 down on the author's case
const CLOSED_UX = (head) =>
  `# UX review: ${BRANCH} @ ${head}, pass 2, 0 to recheck\n## Previous findings\n- U1 [recheck] a → fixed (b.png)\n- U2 [polish] b → turned down: the owner's call\n`;
// a UX review of HEAD, its first pass, with one finding to recheck
const OPEN_UX = (head) => `# UX review: ${BRANCH} @ ${head}, first pass, 1 to recheck\n## Findings\nU1. [recheck] a\n`;
// a PR body in the change skill's shape, its permalinks at `head`, with
// `change` as its Change section's lines; `parts` replaces a part's text,
// or leaves it out (null)
const prBody = (head, change = "- New: nothing\n", parts = {}) =>
  Object.values({
    problem: "**Problem:** a thing is wrong.\n",
    fix: "**Fix:** it's right now.\n",
    check: `**Check these:**\n${[1, 2, 3].map((n) => `- [b.txt](https://github.com/o/r/blob/${head}/b.txt#L${n}): why\n`).join("")}`,
    change: `<details><summary>Change</summary>\n\n## Change\n${change}\n</details>\n`,
    footer: "Generated with Claude Code\n",
    ...parts,
  })
    .filter((part) => part !== null)
    .join("\n");
const BODY = (head) => prBody(head);

// each state: the hook it feeds, and how its scratch repo is built
const STATES = {
  ready: ["review-gate", () => scratchRepo({ review: true, lessons: ROUTED })],
  noLessons: ["review-gate", () => scratchRepo({ review: true })],
  lessonNoArrow: ["review-gate", () => scratchRepo({ review: true, lessons: "- A lesson\n" })],
  lessonsEmpty: ["review-gate", () => scratchRepo({ review: true, lessons: "" })],
  lessonsNone: ["review-gate", () => scratchRepo({ review: true, lessons: "None: a one-line fix\n" })],
  // bullets after None: are its reason, not costs; a bare None: says none
  lessonsNoneAfter: ["review-gate", () => scratchRepo({ review: true, lessons: `${ROUTED}\nNone:\n- F1 a cost: one quick fix\n` })],
  lessonsOnlyNone: ["review-gate", () => scratchRepo({ review: true, lessons: "None: none of the costs is a lesson\n- F1 a cost: one quick fix\n" })],
  lessonsNoneEmpty: ["review-gate", () => scratchRepo({ review: true, lessons: "None:\n" })],
  // a lesson with no → before None: (None: once let the whole file through)
  lessonUnroutedNone: ["review-gate", () => scratchRepo({ review: true, lessons: "- A lesson\nNone: the rest\n" })],
  // a commit after the review's last pass: one that names no finding it
  // fixes (its message is its file's name), and one that names F1
  staleReview: [
    "review-gate",
    () => {
      const state = scratchRepo({ review: true, lessons: ROUTED });
      commit(state.repo, "lessons.md", "a lesson\n");
      return state;
    },
  ],
  fixNamed: [
    "review-gate",
    () => {
      const state = scratchRepo({ review: true, lessons: ROUTED });
      writeFileSync(join(state.repo, "c.txt"), "c\n");
      git(state.repo, "add", ".");
      git(state.repo, "commit", "-qm", "Change: the stale line, F1");
      return state;
    },
  ],
  // ready to open as a draft: a review and a PR body, no lessons
  createDraft: ["review-gate", () => scratchRepo({ review: true, body: BODY })],
  noReview: ["review-gate", () => scratchRepo({ lessons: ROUTED, body: BODY })],
  // a review with findings, and a PR body closing them in each form the
  // reviewer's template has: a fix, or the review's own word on it
  answered: [
    "review-gate",
    () =>
      scratchRepo({
        review:
          "## Previous findings\n- F2 [recheck] b → fixed in the survey\n- F3 [recheck] c → ruled by the user: keep it\n- F4 d → fixed elsewhere: #313's body\n- F5 [recheck] e → conceded: a misread\n- F6 f → turned down: the owner's call\n## Findings\nF1. [recheck] a\n",
        body: (head) =>
          prBody(
            head,
            `- Review: F1 a → fixed in ${head.slice(0, 7)}\n- Review: F2 b → fixed in the survey\n- Review: F3 c → ruled by the user: keep it\n- Review: F4 d → fixed elsewhere: #313's body\n- Review: F5 e → conceded: a misread\n- Review: F6 f → turned down: the owner's call\n`,
          ),
      }),
  ],
  // each kind of line that doesn't close its finding, F1 to F8: F5's word
  // isn't the review's, F6's `answered:` closed one until 2026-11-23, F7's
  // word is in its finding's text but not the review's word on it, and F8
  // is fixed in the survey by the body alone (the old gate took F7 and F8)
  unanswered: [
    "review-gate",
    () =>
      scratchRepo({
        review: "## Previous findings\n- F5 e → held: it's real\n- F7 the gate takes `conceded:` anywhere → open: still wrong\n## Findings\nF1. [recheck] a\nF2. b\nF3. [recheck] c\nF4. [recheck] d\nF6. f\nF8. h\n",
        body: (head) =>
          prBody(
            head,
            "- Review: F1 a → fixed in deadbee0\n- Review: F2 b → fixed: #313's body revised\n- Review: F3 c → answered on #266\n- Review: F5 e → turned down: rare\n- Review: F6 f → answered: a rare state\n- Review: F7 the gate takes `conceded:` anywhere → conceded: x\n- Review: F8 h → fixed in the survey\n",
          ),
      }),
  ],
  // a PR body with Before / after, and the UX review it then needs
  ...Object.fromEntries(
    Object.entries({
      uxClosed: [CLOSED_UX, (head) => `- UX review: U1 a → fixed in ${head.slice(0, 7)}\n- UX review: U2 b → turned down: the owner's call\n`],
      uxUnclosed: [CLOSED_UX, () => "- UX review: U1 a → answered: rare\n"],
      uxOpen: [OPEN_UX, () => ""],
      uxFixed: [OPEN_UX, (head) => `- UX review: U1 a → fixed in ${head.slice(0, 7)}\n`],
      // the change review's word on a U<n> closes nothing: each review's
      // word closes only its own findings (the old gate took it)
      uxChangeWord: [OPEN_UX, () => "- UX review: U1 a → turned down: the owner's call\n", "## Previous findings\n- U1 a → turned down: the owner's call\n"],
      uxElsewhere: [() => `# UX review: ${BRANCH} @ 0000000, first pass, 0 to recheck\n`, () => ""],
      uxMissing: [undefined, () => ""],
    }).map(([name, [ux, change, review = true]]) => [
      name,
      ["review-gate", () => scratchRepo({ review, ux, lessons: ROUTED, body: (head) => prBody(head, `- New: nothing\n${change(head)}`, { before: BEFORE }) })],
    ]),
  ),
  // a change at stakes: the critical review's findings close in the body
  // too (red on the old gate, which read no critical review)
  ...Object.fromEntries(
    Object.entries({
      criticalClosed: (head) => `- Critical review: C1 a → fixed in ${head.slice(0, 7)}\n`,
      criticalUnclosed: () => "",
    }).map(([name, change]) => [
      name,
      [
        "review-gate",
        () => {
          const state = scratchRepo({ review: true, lessons: ROUTED, body: (head) => prBody(head, `- New: nothing\n${change(head)}`) });
          write(state.repo, "critical-review", `# Critical review: feature @ ${git(state.repo, "rev-parse", "--short", "HEAD")}, diff, 1 to recheck\n## Findings\nC1. shown, sure: a\n`);
          return state;
        },
      ],
    ]),
  ),
  // a survey that names its file by a short name only, and one that
  // names no file at all
  shortNames: [
    "survey-gate",
    () => {
      const state = scratchRepo();
      mkdirSync(join(state.repo, "src/deep"), { recursive: true });
      commit(state.repo, "src/deep/c.ts", "c\n");
      write(state.repo, "survey", "Change: c.\nPatterns touched:\n  - c.ts\n");
      return state;
    },
  ],
  // a short name two tracked files go by
  sharedName: [
    "survey-gate",
    () => {
      const state = scratchRepo();
      for (const dir of ["src/a", "src/b"]) {
        mkdirSync(join(state.repo, dir), { recursive: true });
        commit(state.repo, `${dir}/c.ts`, "c\n");
      }
      write(state.repo, "survey", "Change: c.\nPatterns touched:\n  - c.ts\n");
      return state;
    },
  ],
  noPaths: [
    "survey-gate",
    () => {
      const state = scratchRepo();
      mkdirSync(join(state.repo, "src"));
      commit(state.repo, "src/d.ts", "d\n");
      write(state.repo, "survey", "Change: something.\n");
      return state;
    },
  ],
  // a recheck's header, and one with no count (the form before 2026-11-26)
  ...Object.fromEntries(
    Object.entries({
      headerRecheck: "recheck 2, 0 to recheck",
      headerNoCount: "round 2, 0 open change findings",
    }).map(([name, header]) => [name, ["review-gate", () => scratchRepo({ review: true, header, body: BODY })]]),
  ),
  // a [recheck] finding's fix, committed: the PR waits for the reviewer to
  // read it, or for the user's ruling against the finding, which no fix
  // ends (the body's closing takes F1 off the count), quoted from a message
  // they typed (round 1 F30)
  ...Object.fromEntries(
    Object.entries({
      owesRecheck: [(head) => `fixed in ${head.slice(0, 7)}`],
      owesRuled: [() => 'ruled by the user: "keep it as it stands"', "fine, keep it as it stands"],
      owesRuledUnsaid: [() => 'ruled by the user: "keep it as it stands"', "ship it"],
      owesRuledUnquoted: [() => "ruled by the user: keep it as it stands", "fine, keep it as it stands"],
    }).map(([name, [closing, said]]) => [
      name,
      ["review-gate", () => scratchRepo({ review: "## Findings\nF1. [recheck] a\n", header: "round 1, 1 to recheck", lessons: ROUTED, said, body: (head) => prBody(head, `- New: nothing\n- Review: F1 a → ${closing(head)}\n`) })],
    ]),
  ),
  // `filed in #<n>` closes a later pass's `[polish]` finding, and no other:
  // not a `[recheck]`, nor the first look's polish (round 1 F31)
  ...Object.fromEntries(
    Object.entries({
      filedPolish: ["polish", "recheck 1"],
      filedRecheck: ["recheck", "recheck 1"],
      filedFirstLook: ["polish", "round 1"],
    }).map(([name, [mark, pass]]) => [
      name,
      ["review-gate", () => scratchRepo({ review: `F1. [${mark}] a\n`, header: `${pass}, 0 to recheck`, body: (head) => prBody(head, "- New: nothing\n- Review: F1 a → filed in #12\n") })],
    ]),
  ),
  // PR bodies out of the change skill's shape, each a part replaced (bodyMore
  // has every part, and headings in fenced code)
  ...Object.fromEntries(
    Object.entries({
      bodyMore: (head) => ({
        before: "**Before / after:**\n| Before | After |\n| --- | --- |\n| a | b |\n",
        tests: "**Tests:**\n- [a test](x): red on the old code\n\n```\n## Summary\n**Evidence:** in code\n```\n",
        check: `**Check these:**\n${[1, 2, 3, 4, 5].map((n) => `- https://github.com/o/r/blob/${head}/b.txt#L${n}\n`).join("")}`,
      }),
      bodyBare: () => ({ problem: null, fix: "**Fix:**\n" }),
      bodyExtra: () => ({
        problem: "## Summary\n\n**Problem:** a thing.\n\n**Evidence:** it ran\n\n### Merge Danger\n\n**Evidence**\n",
        footer: "**Left open**: x\n",
      }),
      bodyFewLinks: (head) => ({ check: `**Check these:**\n- https://github.com/o/r/blob/${head}/b.txt#L1\n- https://github.com/o/r/blob/main/b.txt\n` }),
      bodyLinksElsewhere: (head) => ({
        check: `**Check these:**\n${[head, head, "0".repeat(40)].map((sha) => `- https://github.com/o/r/blob/${sha}/b.txt\n`).join("")}`,
        tests: `**Tests:**\n- https://github.com/o/r/blob/${"1".repeat(40)}/b.test.mjs#L3\n`,
      }),
      bodyOpen: () => ({ change: "## Change\n- New: nothing\n" }),
      bodyNoBlank: () => ({ change: "<details><summary>Change</summary>\n## Change\n- New: nothing\n</details>\n" }),
      bodyUnclosed: () => ({ change: "<details><summary>Change</summary>\n\n## Change\n- New: nothing\n" }),
      bodyShown: () => ({ change: "<details open><summary>Change</summary>\n\n## Change\n- New: nothing\n</details>\n" }),
    }).map(([name, parts]) => [name, ["review-gate", () => scratchRepo({ review: true, ux: CLEAN_UX, body: (head) => prBody(head, undefined, parts(head)) })]]),
  ),
  // a prototype branch's checkout (lib's prototypeBranch), and a detached
  // one: neither has work to gate, but neither opens a PR unchecked
  prototype: [
    "review-gate",
    () => {
      const state = scratchRepo({ body: BODY });
      git(state.repo, "switch", "-qc", PROTOTYPE_BRANCH);
      return state;
    },
  ],
  detached: [
    "review-gate",
    () => {
      const state = scratchRepo();
      git(state.repo, "switch", "-q", "--detach");
      return state;
    },
  ],
  // agent-gate reads only the tool call
  agent: ["agent-gate", () => ({ repo: scratchDir() })],
  // a reviewer's passes, read from the review files at the output path its
  // prompt names (`<out>`, the folder beside the survey)
  ...Object.fromEntries(
    Object.entries({
      passNone: {},
      passPlan: { survey: "Change: a.\nExpected files: 4\n", "plan-review": "# Change review: feature @ abc1234, plan, 1 to recheck, 4 expected files\n" },
      passPlanRedone: { survey: "Change: a.\nExpected files: 7\n", "plan-review": "# Change review: feature @ abc1234, plan, 1 to recheck, 4 expected files\n" },
      // a later pass: a fix to recheck, and HEAD moved past the pass (abc1234
      // is no commit here), or not; or nothing to recheck
      passOwed: { review: "# Change review: feature @ abc1234, round 1, 2 to recheck\n" },
      passOwedAtHead: { review: (head) => `# Change review: feature @ ${head}, round 1, 1 to recheck\n` },
      passNothingOwed: { review: (head) => `# Change review: feature @ ${head}, recheck 1, 0 to recheck\n` },
      // round 1 F29: a commit since the change review's last pass that names
      // no finding, or a rebase past it (abc1234), is new work no review has
      // read, the change-reviewer's and no other's; one naming a finding is
      // a fix, read only while one is owed
      passUnread: {
        review: (head) => `# Change review: feature @ ${head}, round 1, 0 to recheck\n`,
        "ux-review": "# UX review: feature @ abc1234, first pass, 0 to recheck\n",
        commit: "Cleanup: a stale line",
      },
      passFixNamed: { review: (head) => `# Change review: feature @ ${head}, round 1, 0 to recheck\n`, commit: "Change: the stale line, F1" },
      passRebased: {
        review: "# Change review: feature @ abc1234, round 1, 0 to recheck\n",
        "ux-review": "# UX review: feature @ abc1234, first pass, 0 to recheck\n",
      },
      // a fix the change review marks [recheck] opens the critical review's
      // later pass too, as one at stakes is its to read
      passCriticalOwed: {
        review: "# Change review: feature @ abc1234, round 1, 1 to recheck\n",
        "critical-review": "# Critical review: feature @ abc1234, diff, 0 to recheck\n",
      },
      passUx: { "ux-review": "# UX review: feature @ abc1234, first pass, 0 to recheck\n" },
      // round 1 F32: one review's count opens its own reviewer and the
      // critical-reviewer, not the other reviewers
      passChangeOwes: {
        review: "# Change review: feature @ abc1234, round 1, 1 to recheck\n",
        "ux-review": "# UX review: feature @ abc1234, first pass, 0 to recheck\n",
      },
      passUxOwes: {
        review: (head) => `# Change review: feature @ ${head}, round 1, 0 to recheck\n`,
        "ux-review": "# UX review: feature @ abc1234, first pass, 1 to recheck\n",
      },
      // a design is fixed in place, with no commit: its own count opens its pass
      passDesign: { "ux-review-design": "# UX review: feature @ abc1234, first pass, 1 to recheck\n" },
      passDesignDone: { "ux-review-design": "# UX review: feature @ abc1234, pass 2, 0 to recheck\n" },
      passCriticalPlan: { "critical-review": "# Critical review: feature @ abc1234, plan, 1 to recheck\n" },
    }).map(([name, files]) => [
      name,
      [
        "agent-gate",
        () => {
          const state = scratchRepo();
          const head = git(state.repo, "rev-parse", "--short", "HEAD");
          const { commit: message, ...kinds } = files;
          for (const [kind, text] of Object.entries(kinds)) write(state.repo, kind, typeof text === "function" ? text(head) : text);
          if (message) {
            writeFileSync(join(state.repo, "c.txt"), "c\n");
            git(state.repo, "add", ".");
            git(state.repo, "commit", "-qm", message);
          }
          return { ...state, out: dirname(stateFile(state.repo, "review", BRANCH)) };
        },
      ],
    ]),
  ),
  // the build's size cap: 1.5x the plan review's count, 1 here, is 2 files
  capped: [
    "survey-gate",
    () => {
      const state = scratchRepo();
      commit(state.repo, "c.txt", "c\n");
      write(state.repo, "survey", "Change: b.\nFiles: b.txt\nExpected files: 1\n");
      write(state.repo, "plan-review", "# Change review: feature @ abc1234, plan, 0 to recheck, 1 expected files\n");
      return { ...state, out: dirname(stateFile(state.repo, "review", BRANCH)) };
    },
  ],
  // process-gate reads only the command
  process: ["process-gate", () => ({ repo: scratchDir() })],
  // scratch-gate: a subagent's call, the repo standing for the session's
  // scratchpad and <own> for the agent's folder in it
  scratch: [
    "scratch-gate",
    () => {
      const repo = scratchDir();
      return { repo, own: join(repo, "agents", AGENT) };
    },
  ],
  // reviewer-gate: the change-reviewer's call, <own> standing for the
  // folder its survey (and so its review) is in
  reviewer: [
    "reviewer-gate",
    () => {
      const state = scratchRepo();
      return { ...state, own: dirname(write(state.repo, "survey", "Change: b.\n")) };
    },
  ],
  // a checkout with no survey, and a folder outside any checkout
  noSurvey: [
    "survey-gate",
    () => {
      const state = { ...scratchRepo(), outside: scratchDir() };
      symlinkSync(join(state.repo, "b.txt"), join(state.outside, "link.txt"));
      return state;
    },
  ],
};

const THROUGH = null;
const NO_LESSONS = /can't leave draft before its lessons/;
const NAMED = /Run `gh pr ready` bare/;
const NO_SURVEY = /there is no survey for feature/;
const PROTOTYPE_BRANCH = "prototype-look";
const PROTOTYPE = /^prototype-look is a prototype branch: .* never becomes a PR\. Build the pick on its own branch/;
const SELF_MATCH = /match this command's own shell/;
const AGENT = "a1";
// the gist of a reviewer-gate turn-down of a command: the rule, why this
// one (its text, <repo> and <own> standing for any path), and what to do
const reads = (why) =>
  new RegExp(
    String.raw`^The change-reviewer runs only commands that read: .*\. Here ` +
      why.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/<(?:repo|own)>/g, ".*") +
      String.raw`.*\. The author runs the tests, builds and checks beside you in this same checkout.*take the author's numbers, or call the claim unshown`,
  );
const NOT_REVIEW = /^The change-reviewer writes only its review: .* isn't one\./;
const NOT_OWN = /is in the scratchpad, outside this agent's own scratch folder, .*\/agents\/a1\. .*Read a file elsewhere in the scratchpad \(one your caller left\) with the Read tool; when a command needs it, Write a copy into your folder/;

// ways of naming a PR after `gh pr ready`, and redirects that may come first
const NAMING = ["12", "-R o/r 12", "-Ro/r", "-R=o/r 12", "--repo=o/r 12", "12 -R o/r"];
// F18: a redirect's & hid the arguments after it (red at 6442db7)
const REDIRECTS = ["2>&1", ">&2", "&>/dev/null", "<&0"];

const CASES = [
  ["noLessons", "gh pr ready", NO_LESSONS],
  ["lessonNoArrow", "gh pr ready", /1 cost\(s\) that don't say where they went/],
  ["lessonsEmpty", "gh pr ready", /lists none/],
  ["ready", "gh pr ready", THROUGH],
  ["lessonsNone", "gh pr ready", THROUGH],
  ["lessonsNoneAfter", "gh pr ready", THROUGH],
  ["lessonsOnlyNone", "gh pr ready", THROUGH],
  ["lessonsNoneAfter", "gh pr ready 12", NAMED],
  ["lessonsOnlyNone", "gh pr ready 12", NAMED],
  ["lessonsNoneEmpty", "gh pr ready", /lists none/],
  ["lessonUnroutedNone", "gh pr ready", /1 cost\(s\) that don't say where they went/],
  ["lessonsNone", "gh pr ready 12", NAMED],
  ["noLessons", "gh pr ready --undo", THROUGH],
  // after the review's last pass, each commit names the finding it fixes
  ["staleReview", "gh pr ready", /^[0-9a-f]{7} came after the change review's last pass \([0-9a-f]+\) and names no finding it fixes \(`F<n>`, `C<n>`, `U<n>`\) nor `CI`: .* run the change-reviewer on HEAD/],
  ["fixNamed", "gh pr ready", THROUGH],
  ["fixNamed", "gh pr ready 12", NAMED],

  // naming another PR: turned down
  ...NAMING.map((args) => ["ready", `gh pr ready ${args}`, NAMED]),
  ...REDIRECTS.flatMap((redirect) => NAMING.map((args) => ["ready", `gh pr ready ${redirect} ${args}`, NAMED])),
  ["ready", "gh -R o/r pr ready", NAMED],
  ["ready", "gh --repo=o/r pr ready", NAMED],
  ["ready", "GH_REPO=o/r gh pr ready", NAMED],
  ["ready", "export GH_REPO=o/r && gh pr ready", NAMED],
  ["ready", "GH_HOST=x gh pr ready", NAMED],

  // bare, with redirects or chains: through
  ...["2>&1", "&>/dev/null", ">&/dev/null", ">/dev/null 2>&1", "| tail -1", "&& echo done", "& wait"].map((rest) => [
    "ready",
    `gh pr ready ${rest}`,
    THROUGH,
  ]),

  ["createDraft", "gh pr create --draft --title t --body-file <body>", THROUGH],
  ["createDraft", `gh pr create --title "skip --draft" --body-file <body>`, NO_LESSONS],
  ["createDraft", "gh pr create --draft --body-file <body> 2>&1 --head other", /--head other runs from feature's checkout/],
  // F9: the gate checked gh pr ready and returned, skipping create's checks (red at d582e4f)
  ["noReview", "gh pr create --draft --body-file <body> && gh pr ready", /change review for feature isn't ready \(missing\)/],
  ["answered", "gh pr create --draft --body-file <body>", THROUGH],
  ["answered", "gh pr create --body-file <body>", NO_LESSONS],
  // dotfiles#9: each says what's wrong with its line
  ["unanswered", "gh pr create --draft --body-file <body>", /F1: `fixed in deadbee0` is no commit on this branch: after a rebase or an amend, give the new sha; a fix that landed elsewhere \(main, another PR\) is `fixed elsewhere: <where>`/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F2: it says fixed, but in no commit on this branch: a fix to the survey's text is `fixed in the survey`/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F3: `answered` closes nothing/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F4: no line names it/],
  // the reviewer has the last word (red on the old gate, which took any
  // `answered:` and read no reviewer's word)
  ["unanswered", "gh pr create --draft --body-file <body>", /F5: it says `turned down`, but the review's own word on it doesn't/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F7: it says `conceded`, but the review's own word on it doesn't/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F8: it says `fixed in the survey`, but the review's own word on it doesn't/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F6: `answered` closes nothing/],
  // a body with Before / after needs a UX review, its findings closed as
  // the change review's (red on the old gate, which read no UX review)
  ["uxClosed", "gh pr create --draft --body-file <body>", THROUGH],
  ["uxClosed", "gh pr ready", THROUGH],
  ["uxClosed", "gh pr create --draft --body-file <body> --head other", /--head other runs from feature's checkout/],
  ["uxUnclosed", "gh pr create --draft --body-file <body>", /U1: `answered` closes nothing: .*; U2: no line names it/],
  ["uxOpen", "gh pr create --draft --body-file <body>", /U1: no line names it/],
  ["uxOpen", "gh pr ready", /U1: no line names it\. .*Then `gh pr edit --body-file /],
  // a [recheck] finding's fix opens a draft, and waits for its recheck to leave draft
  ["uxFixed", "gh pr create --draft --body-file <body>", THROUGH],
  ["uxFixed", "gh pr ready", /ux-review-feature\.md has 1 to recheck: a reviewer still owes those fixes a read/],
  ["uxChangeWord", "gh pr create --draft --body-file <body>", /U1: it says `turned down`, but the review's own word on it doesn't/],
  ["uxElsewhere", "gh pr create --draft --body-file <body>", /it read 0000000, no commit on this branch/],
  ["uxMissing", "gh pr create --draft --body-file <body>", /needs its UX review, and it isn't ready \(missing\)/],
  ["uxMissing", "gh pr ready", /needs its UX review, and it isn't ready \(missing\)/],
  ["criticalClosed", "gh pr create --draft --body-file <body>", THROUGH],
  ["criticalClosed", "gh pr create --draft --body-file <body> --head other", /--head other runs from feature's checkout/],
  ["criticalUnclosed", "gh pr create --draft --body-file <body>", /C1: no line names it/],

  // what runs before gh: a prefix or wrapper is gated, a mention isn't
  ...[`FOO="a b"`, `FOO='a b'`, "env", "command", "time", "nohup", "exec"].map((prefix) => [
    "noLessons",
    `${prefix} gh pr ready`,
    NO_LESSONS,
  ]),
  // a shell keyword or `timeout <duration>` before gh runs it too (round 1's F7)
  ...[
    "if gh pr ready; then echo ok; fi",
    "if false; then :; elif gh pr ready; then :; fi",
    "if false; then :; else gh pr ready; fi",
    "until gh pr ready; do sleep 1; done",
    "while ! gh pr ready; do sleep 1; done",
    "! gh pr ready",
    "{ gh pr ready; }",
    "timeout 60 gh pr ready",
  ].map((command) => ["noLessons", command, NO_LESSONS]),
  ["noReview", "if gh pr create --draft --body-file <body>; then echo ok; fi", /change review for feature isn't ready \(missing\)/],
  ["noLessons", "echo env gh pr ready", THROUGH],
  ["noLessons", `git commit -m "then gh pr ready"`, THROUGH],
  // lib's one command boundary: a redirect's & starts no command, a paren does
  ["noLessons", "git push 2>&1 && gh pr ready", NO_LESSONS],
  ["noLessons", "(gh pr ready)", NO_LESSONS],

  // the body's shape (the change skill's PR body step)
  ["bodyMore", "gh pr create --draft --body-file <body>", THROUGH],
  ["bodyMore", "gh pr create --body-file <body>", NO_LESSONS],
  ["bodyBare", "gh pr create --draft --body-file <body>", /no `\*\*Problem:\*\*`; `\*\*Fix:\*\*` has no sentence on its line/],
  ["bodyExtra", "gh pr create --draft --body-file <body>", /parts it doesn't have: `\*\*Evidence\*\*`, `\*\*Left open\*\*`, `## Summary`, `### Merge Danger`/],
  ["bodyFewLinks", "gh pr create --draft --body-file <body>", /has 1 permalink\(s\) .*, not 3 to 5/],
  ["bodyLinksElsewhere", "gh pr create --draft --body-file <body>", /permalinks at 0000000, 1111111, no commit on this branch/],
  ...["bodyOpen", "bodyNoBlank", "bodyUnclosed", "bodyShown"].map((state) => [
    state,
    "gh pr create --draft --body-file <body>",
    /no `## Change` collapsed as/,
  ]),

  // a prototype branch never becomes a PR; from its checkout, as from a
  // detached one, another branch's PR is turned down as from any (plan
  // review F1, F2: both returned before the --head and named-PR checks)
  ["prototype", "gh pr create --draft --body-file <body>", PROTOTYPE],
  ["prototype", "gh pr ready", PROTOTYPE],
  ["prototype", "gh pr ready --undo", THROUGH],
  ["prototype", "gh pr create --draft --head feature", /--head feature runs from prototype-look's checkout/],
  ["prototype", "gh pr ready 5", NAMED],
  ["createDraft", "gh pr create --draft --body-file <body> --head prototype-look", PROTOTYPE],
  ["createDraft", "gh pr create --draft --body-file <body> --head o:prototype-look", PROTOTYPE],
  ["detached", "gh pr create --draft --head feature", /--head feature runs from HEAD's checkout/],
  ["detached", "gh pr ready 5", NAMED],
  ["detached", "gh pr ready", THROUGH],

  ["headerRecheck", "gh pr create --draft --body-file <body>", THROUGH],
  ["headerRecheck", "gh pr create --body-file <body>", NO_LESSONS],
  ["headerNoCount", "gh pr create --draft --body-file <body>", /its first line reads `# Change review: <branch> @ <short sha>, <round 1 \| recheck <n>>, <r> to recheck`/],
  // a draft opens with a fix owed its recheck; ready waits for it, or for
  // the user's ruling
  ["owesRecheck", "gh pr create --draft --body-file <body>", THROUGH],
  ["owesRecheck", "gh pr ready", /review-feature\.md has 1 to recheck: a reviewer still owes those fixes a read/],
  ["owesRuled", "gh pr ready", THROUGH],
  ["owesRuled", "gh pr ready 12", NAMED],
  // the author's word alone, or the user's unquoted, isn't their ruling
  ["owesRuledUnsaid", "gh pr ready", /F1: `ruled by the user:` closes it with the user's own words in quotes/],
  ["owesRuledUnquoted", "gh pr ready", /F1: `ruled by the user:` closes it with the user's own words in quotes/],
  ["filedPolish", "gh pr create --draft --body-file <body>", THROUGH],
  ["filedPolish", "gh pr create --body-file <body>", NO_LESSONS],
  ["filedRecheck", "gh pr create --draft --body-file <body>", /F1: `listed` and `filed in #<n>` close only a finding the review marks `\[polish\]`/],
  ["filedFirstLook", "gh pr create --draft --body-file <body>", /F1: `listed` and `filed in #<n>` close only a later pass's `\[polish\]`/],

  // agent-gate: the command is the Agent call's isolation, if any
  ["agent", "worktree", /Spawn it without `isolation`/],
  ["agent", "", THROUGH],
  // agent-gate: a reviewer's prompt (`<type>: <prompt>`); its first look
  // runs, and a later pass only to read fixes some review marks [recheck]
  ["passNone", "change-reviewer: round 1 of feature", /prompt names no output path/],
  ["passNone", "change-reviewer: round 1, output <out>/review-feature.md, plan review <out>/plan-review-feature.md", THROUGH],
  ["passNone", "ux-reviewer: shots, output <out>/ux-review-feature.md", THROUGH],
  ["passPlan", "change-reviewer: plan, survey <out>/survey-feature.md, output <out>/plan-review-feature.md", /plan-review-feature\.md is written, and the plan review runs once/],
  ["passPlan", "change-reviewer: round 1, output <out>/review-feature.md, plan review <out>/plan-review-feature.md", THROUGH],
  ["passPlanRedone", "change-reviewer: plan, survey <out>/survey-feature.md, output <out>/plan-review-feature.md", THROUGH],
  ["passOwed", "change-reviewer: recheck, output <out>/review-feature.md", THROUGH],
  ["passOwedAtHead", "change-reviewer: recheck, output <out>/review-feature.md", /review-feature\.md already reads HEAD \([0-9a-f]+, or only comment lines since\), .*: commit the fixes first/],
  ["passNothingOwed", "change-reviewer: recheck, output <out>/review-feature.md", /^No fix the change-reviewer reads is owed a recheck \([^,]*\/review-feature\.md: each header reads 0 to recheck/],
  ["passUnread", "change-reviewer: recheck, output <out>/review-feature.md", THROUGH],
  ["passUnread", "ux-reviewer: shots, output <out>/ux-review-feature.md", /^No fix the ux-reviewer reads is owed a recheck/],
  ["passFixNamed", "change-reviewer: recheck, output <out>/review-feature.md", /^No fix the change-reviewer reads is owed a recheck/],
  ["passChangeOwes", "change-reviewer: recheck, output <out>/review-feature.md", THROUGH],
  ["passChangeOwes", "ux-reviewer: shots, output <out>/ux-review-feature.md", /^No fix the ux-reviewer reads is owed a recheck/],
  ["passUxOwes", "ux-reviewer: shots, output <out>/ux-review-feature.md", THROUGH],
  ["passUxOwes", "change-reviewer: recheck, output <out>/review-feature.md", /^No fix the change-reviewer reads is owed a recheck/],
  ["passRebased", "change-reviewer: recheck, output <out>/review-feature.md", THROUGH],
  ["passRebased", "ux-reviewer: shots, output <out>/ux-review-feature.md", /^No fix the ux-reviewer reads is owed a recheck/],
  ["passCriticalOwed", "critical-reviewer: recheck, output <out>/critical-review-feature.md", THROUGH],
  ["passUx", "ux-reviewer: shots, output <out>/ux-review-feature.md", /^No fix the ux-reviewer reads is owed a recheck/],
  ["passUx", "ux-reviewer: design, output <out>/ux-review-design-feature.md", THROUGH],
  ["passDesign", "ux-reviewer: design, output <out>/ux-review-design-feature.md", THROUGH],
  ["passDesignDone", "ux-reviewer: design, output <out>/ux-review-design-feature.md", /ux-review-design-feature\.md leaves nothing to recheck/],
  ["passCriticalPlan", "critical-reviewer: mode: diff, output <out>/critical-review-feature.md", THROUGH],
  ["passCriticalPlan", "critical-reviewer: plan mode, output <out>/critical-review-feature.md", /critical-review-feature\.md holds the plan pass, which runs once/],
  // whatever the files, a reviewer's prompt names its output
  ["passPlanRedone", "critical-reviewer: diff of feature", /prompt names no output path/],
  ["passOwed", "critical-reviewer: diff of feature", /prompt names no output path/],
  ["passCriticalOwed", "critical-reviewer: diff of feature", /prompt names no output path/],
  ["passDesign", "critical-reviewer: diff of feature", /prompt names no output path/],
  // survey-gate: the build's size cap, and a reviewer's file kept to it
  ["capped", "<repo>/b.txt", THROUGH],
  ["capped", "<repo>/d.txt", /feature is past 1\.5x the 1 files its plan review counted \(3 with this edit, against 2;/],
  ["capped", "<out>/review-feature.md", /is a reviewer's file/],

  // process-gate: a full-command-line pgrep/pkill matches its own shell (dotfiles#15)
  ...[
    "pgrep -f vite",
    'pgrep -af "playwright|vitest"',
    'until ! pgrep -f "playwright test"; do sleep 3; done',
    'pkill -f "vite --port 5173"',
    "pgrep -fl x | xargs kill",
    "pgrep --full x",
    "sleep 1 && pkill -fa x",
    "/usr/bin/pgrep -f x",
    'pgrep "x" -f',
    // lib's argsOf: a redirect's & doesn't end pgrep's arguments (went through before)
    "pgrep x 2>&1 -f",
    "(pgrep -f x)",
  ].map((command) => ["process", command, SELF_MATCH]),
  ...[
    "pgrep -x node",
    "pgrep -a vite",
    "pkill node",
    'ps -eo pid,args | grep "[p]laywright"',
    'git commit -m "no more pgrep -f waits"',
    "kill 123",
  ].map((command) => ["process", command, THROUGH]),

  // scratch-gate: a row's command is a path to Write, or else a shell
  // command (dotfiles#14)
  ...[
    "<repo>/test-change.log",
    "<repo>/agents/other/check.log",
    "<repo>/agents/a12/x.log", // an id that starts with this one's
    "<own>/../x.log",
    "pnpm test:change > <repo>/test-change.log 2>&1",
    "S=<repo>; pnpm test > $S/x.log",
    'cd "<repo>" && touch landing.log',
    "cat '<repo>/brief.md'",
    "tee <own>/a.log < <repo>/agents/other/b.log",
  ].map((call) => ["scratch", call, NOT_OWN]),
  ...[
    "<own>/x.log",
    "<own>",
    "<repo>-other/x.log", // a sibling of the scratchpad
    "/etc/hostname",
    "pnpm test:change > <own>/test-change.log 2>&1",
    "S=<own>; pnpm test > $S/x.log",
    "cd <own> && ls",
    "echo hi > /tmp/x.log",
  ].map((call) => ["scratch", call, THROUGH]),

  // reviewer-gate: the change-reviewer reads and writes its review, nothing
  // else (dotfiles#17); a row's command is a path to Write, or else a shell
  // command. The through rows are shaped like past reviewers' reads, the
  // held ones like the writes and runs among them
  ...[
    ["pnpm test:change", "`pnpm` isn't a reading command"],
    ["cd <repo> && npx vitest run a.test.ts", "`npx` isn't a reading command"],
    ["node -e 'console.log(1)'", "node runs only as `node --permission`"],
    ["node --permission --allow-fs-write='*' -e 1", "node's `--allow-fs-write=*` isn't one this reads"],
    ["git diff > <repo>/d.patch", "`> <repo>/d.patch` writes a file"],
    ['git log >> "<repo>/x"', "`>> \"<repo>/x\"` writes a file"],
    ["cat > <own>/review-feature.md <<'EOF'\nx\nEOF", "`> <own>/review-feature.md` writes a file"],
    ["git log | tee x", "`tee` isn't a reading command"],
    ["git fetch origin", "`git fetch` isn't one of git's reading subcommands"],
    ["git -c core.pager=rm log", "git's `-c` can change what git runs"],
    ["git diff --output=x", "git's --output writes a file"],
    ["git stash", "`git stash` changes the stash"],
    ["git branch new-one", "`git branch` changes branches"],
    ["git config user.name x", "`git config` changes the config"],
    ["git worktree add ../x", "`git worktree` changes the worktrees"],
    ["sed -i s/a/b/ b.txt", "sed edits a file in place"],
    ["sed -i.bak 1p b.txt", "sed edits a file in place"],
    ["sed -n '1w x' b.txt", "sed's script `1w x` isn't only"],
    ["sed 's/a/b/e' b.txt", "sed's script `s/a/b/e` isn't only"],
    ["awk '{print > \"x\"}' b.txt", "awk's program writes or runs a command"],
    ["awk 'BEGIN{system(\"rm x\")}'", "awk's program writes or runs a command"],
    ["find . -delete", "find's action runs a command or writes"],
    ["fd -x rm", "fd's --exec runs a command"],
    ["rg --pre cat x", "rg's --pre runs a command"],
    ["sort -o x b.txt", "sort writes a file"],
    ["xargs rm < list", "`rm` isn't a reading command"],
    ["timeout 5 pnpm test", "`pnpm` isn't a reading command"],
    ["FOO=1 git diff", "`FOO=1` before a command changes what it runs"],
    ["gh pr checkout 12", "`gh pr checkout` isn't a view or list"],
    ["gh api -X POST repos/o/r/issues", "`gh api` sends more than a GET"],
    ["gh api repos/o/r/issues -f title=x", "`gh api` sends more than a GET"],
    // F2: substitutions the shell runs where masked() blanks them
    ['echo "$(pnpm test)"', "`pnpm` isn't a reading command"],
    ["cat <<EOF\n$(pnpm test)\nEOF", "`pnpm` isn't a reading command"],
    ['rg x "`node -e 1`"', "node runs only as"],
    ["git diff $(touch x)", "`touch` isn't a reading command"],
    ["diff <(rm x) b.txt", "`rm` isn't a reading command"],
    ["$(echo rm) cat", "`__________` isn't a reading command"], // a substitution never names a reader
    ["(cd <repo> && make)", "`make` isn't a reading command"],
    // round 1: F8 node's own options only, F9 every command after a case,
    // F10 readers that write, F11 >&file
    ["node --permission --allow-fs-read='*' --run test:change", "node's `--run` isn't one this reads"],
    ["node - --permission", "node runs only as"],
    ["node x.mjs --permission", "node runs only as"],
    ["node --permission --test", "node's `--test` isn't one this reads"],
    ["node --permission --allow-inspector -e 1", "node's `--allow-inspector` isn't one this reads"],
    ["case $x in a) echo x;; esac; pnpm test", "`pnpm` isn't a reading command"],
    ["case \"$x\" in a|b) echo x;; *) echo y;; esac && pnpm build", "`pnpm` isn't a reading command"],
    ["awk -i inplace '{sub(/a/,\"b\")}1' b.txt", "this awk option edits in place"],
    ["awk --sandbox -d x '{print}' b.txt", "this awk option edits in place"],
    ["awk -e 'BEGIN{}' -e 'BEGIN{system(\"x\")}'", "awk's program writes or runs a command"],
    ["export GIT_EXTERNAL_DIFF=true; git diff", "`export` isn't a reading command"],
    ["GIT_EXTERNAL_DIFF=true; git diff", "setting `GIT_EXTERNAL_DIFF` may change what later commands run"],
    ["PATH=/tmp:$PATH; git diff", "setting `PATH` may change"],
    // round 2: F8 node's options on a list, F9 a subshell past esac, F10
    // attached awk programs and zsh's spellings of allexport, F14 every way
    // a command sets a name
    ["node --permission --title x --run test", "node's `--title` isn't one this reads"],
    ["node --permission --prof -e 1", "node's `--prof` isn't one this reads"],
    ["node --check x.mjs --run test", "node's `--check` isn't one this reads"],
    ["(case $x in a) true;; esac && pnpm test)", "`pnpm` isn't a reading command"],
    ["(case $x in a) true;; esac | sh)", "`sh` isn't a reading command"],
    ["awk --source='BEGIN{system(\"x\")}'", "awk's program writes or runs a command"],
    ["awk -e'BEGIN{system(\"x\")}'", "awk's program writes or runs a command"],
    ["set -o all_export; x=1", "`set -a` exports"],
    ["set -o ALLEXPORT; x=1", "`set -a` exports"],
    ["path=/tmp; git diff", "setting `path` may change"],
    ["read -r PATH <<< /tmp; git diff", "setting `PATH` may change"],
    ["for PATH in /tmp; do git diff; done", "setting `PATH` may change"],
    ["printf -v PATH /tmp; git diff", "setting `PATH` may change"],
    ["set -a; x=1", "`set -a` exports"],
    ["xxd b.txt out.hex", "xxd's second file is its output"],
    ["gh secret set pr --body list", "`gh secret` isn't a view or list"],
    ["git diff >&<repo>/x", "`>&<repo>/x` writes a file"],
  ].map(([call, why]) => ["reviewer", call, reads(why)]),
  ...[
    "git diff $(git merge-base HEAD origin/main)..HEAD",
    'git diff --stat "$(git merge-base HEAD origin/main)"',
    "cd <repo> && git log --oneline -5 && git status --short",
    "git -C <repo> show HEAD:b.txt | head -20",
    "rg -n 'pnpm test|`x`|$(y)' <repo> 2>/dev/null | wc -l",
    "command ls <repo> && cat <repo>/b.txt 2>&1 >/dev/null",
    "sed -n '1,40p;60,80p' <repo>/b.txt",
    "sed -n '/^export const x/,/^};/p' <repo>/b.txt",
    "n=$(rg -n x b.txt | cut -d: -f1); sed -n \"$((n-6)),$((n+4))p\" b.txt",
    "awk -F'|' 'NF>7 {print $2}' b.txt | sort | uniq -c | sort -rn",
    "awk --sandbox '{print > \"x\"}' b.txt",
    "find <repo> \\( -name '*.txt' -o -name '*.md' \\) -newer <repo>/a.txt",
    "for f in a.txt b.txt; do git log -1 --format=%h -- $f; done",
    "for p in a b; do case $p in a|b) echo x;; *) echo y;; esac; done",
    "if git diff --quiet; then echo same; fi",
    "[ -f b.txt ] && echo yes || echo no",
    "diff <(git show HEAD~1:b.txt) <(git show HEAD:b.txt)",
    "cat <<'EOF'\nhello (world) > x `y` $(z)\nEOF",
    "S=<repo>; ls $S; command -v git",
    "gh pr view 12 --json body -q .body; gh repo view --json defaultBranchRef -q .defaultBranchRef.name",
    "gh api repos/o/r/pulls/1/comments --paginate",
    "git branch --list 'feat*'; git branch --show-current; git config --get user.name; git stash list",
    "timeout 20 git log -1 | xargs -n1 echo",
    "node --permission --allow-fs-read='*' - <<'EOF'\nconsole.log(`${1}`)\nEOF",
    "uptime; ps -eo pid,args | grep '[n]ode'",
    "git diff >&/dev/null; git diff >& /dev/null",
    "node -e 1 --permission --allow-fs-read='*'",
    "gh -R o/r pr view 12; gh --version",
    "S=x; mb=$(git merge-base HEAD main); wt=y; set -e; set -o pipefail",
    "for f in a b; do read -r x y; printf -v z %s $f; IFS=: read -r a b; done",
    "node --permission --allow-fs-read=* --input-type=module -p 1",
    "node --version; node --check <repo>/b.txt",
    "<own>/review-feature.md",
    "<own>/plan-review-feature.md",
  ].map((call) => ["reviewer", call, THROUGH]),
  ["reviewer", "<own>/survey-feature.md", NOT_REVIEW],
  ["reviewer", "<own>/review-other.md", NOT_REVIEW], // no survey of its own beside it
  ["reviewer", "<repo>/b.txt", NOT_REVIEW],
  ["reviewer", "<repo>/review-feature.md", NOT_REVIEW],

  // survey-gate: the command is the edited file
  ["noSurvey", "<repo>/b.txt", NO_SURVEY],
  ["noSurvey", "<outside>/link.txt", NO_SURVEY], // a symlink into the checkout: gated like its target
  ["noSurvey", "<outside>/c.txt", THROUGH], // outside any checkout
  // dotfiles#9: a survey that exists but names no path says what to write
  ["shortNames", "<repo>/b.txt", /the survey for feature \(.*\) names no file by its path from the top of the checkout \(`c\.ts` is `src\/deep\/c\.ts`\)/],
  ["noPaths", "<repo>/b.txt", /the survey for feature \(.*\) names no file by its path from the top of the checkout \(such as `src\/d\.ts`\)/],
  ["sharedName", "<repo>/b.txt", /\(`c\.ts` could be 2 files, such as `src\/a\/c\.ts`: give the one you mean\)/],
];

// each gate's tool call, from a row's command
const TOOL_INPUT = {
  "review-gate": (command) => ({ command }),
  "survey-gate": (file_path) => ({ file_path, content: "x\n" }),
  "agent-gate": (call) => {
    const [, subagent_type, prompt] = /^(\S+-reviewer): (.*)$/.exec(call) ?? [];
    return subagent_type ? { subagent_type, prompt } : { prompt: "x", ...(call && { isolation: call }) };
  },
  "process-gate": (command) => ({ command }),
  "scratch-gate": (call) => (call.startsWith("/") ? { file_path: call, content: "x\n" } : { command: call }),
  "reviewer-gate": (call) => (call.startsWith("/") ? { file_path: call, content: "x\n" } : { command: call }),
};

// what else a gate reads from the hook's input
const MORE_INPUT = {
  "scratch-gate": (state) => ({ agent_id: AGENT, scratchpad_dir: state.repo }),
  "reviewer-gate": () => ({ agent_id: AGENT, agent_type: "change-reviewer" }),
  "review-gate": (state) => (state.transcript ? { transcript_path: state.transcript } : {}),
};

// the hook's answer to the case's tool call: the deny reason, or null
const answer = (hookName, state, command) => {
  const filled = command.replace(/<(body|repo|outside|own|out)>/g, (_, name) => state[name]);
  const toolInput = TOOL_INPUT[hookName](filled);
  const cwd = filled.startsWith(state.outside ?? "\0") ? state.outside : state.repo;
  const ran = runHook(hookName, { tool_input: toolInput, cwd, session_id: "s", ...MORE_INPUT[hookName]?.(state) });
  assert.equal(ran.status, 0, ran.stderr);
  if (!ran.stdout.trim()) return null;
  const decision = JSON.parse(ran.stdout).hookSpecificOutput;
  assert.equal(decision.permissionDecision, "deny");
  return decision.permissionDecisionReason;
};

for (const [name, [hookName, build]] of Object.entries(STATES))
  describe(`${hookName}, ${name}`, () => {
    for (const [, command, expected] of CASES.filter(([state]) => state === name))
      test(`${command}: ${expected ? `held, ${expected.source}` : "through"}`, () => {
        const reason = answer(hookName, build(), command);
        if (expected === THROUGH) assert.equal(reason, null);
        else {
          assert.notEqual(reason, null, "went through");
          assert.match(reason, expected);
        }
      });
  });

test("every state with a through case holds one too, and every case's state exists", () => {
  for (const [state] of CASES) assert.ok(STATES[state], state);
  for (const name of Object.keys(STATES)) {
    const expected = CASES.filter(([state]) => state === name).map(([, , gist]) => gist);
    assert.ok(expected.length, `${name} has no case`);
    if (expected.includes(THROUGH)) assert.ok(expected.some(Boolean), `${name} holds nothing`);
  }
});

// scratch-gate at a subagent's start: it makes the agent's folder and
// names it; the main session's calls (no agent_id), and a session with no
// scratchpad, go through
test("scratch-gate: a subagent's folder, made and named at its start; the main session's calls through", () => {
  const root = scratchDir();
  const run = (input) => runHook("scratch-gate", input).stdout;
  const own = join(root, "agents", AGENT);
  const started = JSON.parse(run({ hook_event_name: "SubagentStart", agent_id: AGENT, scratchpad_dir: root }));
  assert.equal(started.hookSpecificOutput.hookEventName, "SubagentStart");
  assert.match(started.hookSpecificOutput.additionalContext, new RegExp(`^Your own scratch folder is ${own}\\.`));
  assert.ok(existsSync(own));
  const write = { hook_event_name: "PreToolUse", tool_input: { file_path: join(root, "x.log"), content: "x" } };
  assert.equal(run({ ...write, scratchpad_dir: root }), "");
  assert.equal(run({ ...write, agent_id: AGENT }), "");
  assert.notEqual(run({ ...write, agent_id: AGENT, scratchpad_dir: root }), ""); // the same call, held in a subagent
});

// reviewer-gate holds only the agent types in its HELD table: the same
// calls from the main session or another agent go through
test("reviewer-gate: other callers' calls through", () => {
  const { repo } = scratchRepo();
  const run = (input) => runHook("reviewer-gate", { cwd: repo, ...input }).stdout;
  for (const tool_input of [{ command: "pnpm test:change" }, { file_path: join(repo, "b.txt"), content: "x" }]) {
    assert.notEqual(run({ tool_input, agent_id: AGENT, agent_type: "change-reviewer" }), ""); // held for the reviewer
    assert.equal(run({ tool_input }), "");
    assert.equal(run({ tool_input, agent_id: AGENT, agent_type: "general-purpose" }), "");
  }
});

// reviewer-gate holds the curator as it holds the change-reviewer: it
// writes only under ~/.claude/process/curator, and runs only readers (the
// old gate let every curator call through: red on it)
test("reviewer-gate: the curator writes only its output, and runs only readers", () => {
  const home = scratchDir();
  const run = (tool_input) => {
    const ran = runHook("reviewer-gate", { cwd: home, agent_id: AGENT, agent_type: "curator", tool_input }, { env: { ...process.env, HOME: home } });
    return ran.stdout.trim() ? JSON.parse(ran.stdout).hookSpecificOutput.permissionDecisionReason : "";
  };
  assert.equal(run({ file_path: join(home, ".claude/process/curator/history-2026-11-19.md"), content: "x" }), "");
  for (const path of [".claude/process/inbox.jsonl", ".claude/process/curator-x.md", ".dotfiles/docs/process-log.md", ".claude/CLAUDE.md"])
    assert.match(run({ file_path: join(home, path), content: "x" }), /^The curator writes only its output: the path you were given, under .*\.claude\/process\/curator\. /, path);
  assert.equal(run({ command: "git log --oneline -5" }), "");
  assert.match(run({ command: "pnpm test" }), /^The curator runs only commands that read: /);
});

// reviewer-gate holds the ux-reviewer to its review: a ux-review-*.md in
// a git dir's claude/ folder, which needn't exist yet (a prototype's
// branch has no survey), and nothing else (the old gate let every call
// through: red on it)
test("reviewer-gate: the ux-reviewer writes only a ux-review file in a git dir's claude/ folder", () => {
  const { repo } = scratchRepo();
  const gitDir = git(repo, "rev-parse", "--path-format=absolute", "--git-dir");
  assert.ok(!existsSync(join(gitDir, "claude")));
  const run = (file_path) => {
    const ran = runHook("reviewer-gate", { cwd: repo, agent_id: AGENT, agent_type: "ux-reviewer", tool_input: { file_path, content: "x" } });
    return ran.stdout.trim() ? JSON.parse(ran.stdout).hookSpecificOutput.permissionDecisionReason : "";
  };
  assert.equal(run(join(gitDir, "claude/ux-review-feature.md")), "");
  for (const path of [join(repo, "claude/ux-review-x.md"), join(gitDir, "claude/review-x.md"), join(repo, "b.txt")])
    assert.match(run(path), /^The ux-reviewer writes only its review: the output path you were given, a ux-review-<branch>\.md in the git dir's claude\/ folder\. /, path);
});

// capture.mjs writes one raw signal to ~/.claude/process/inbox.jsonl, with
// its id, the session Claude Code sets, and the checkout's folder; a kind
// it doesn't know, or nothing said, writes nothing
test("capture: one signal to the inbox, and nothing for a bad call", () => {
  const home = scratchDir();
  const { repo } = scratchRepo();
  const inbox = join(home, ".claude/process/inbox.jsonl");
  const capture = (text, ...args) => runHook("capture", undefined, { args, input: text, cwd: repo, env: { ...process.env, HOME: home, CLAUDE_CODE_SESSION_ID: "s1" } });
  // the user's words as written: a backtick span and a $ the shell would
  // have run and expanded in a double-quoted flag, an apostrophe, two lines
  const said = "no, run `date +%Y` first and keep $HOME out\nit's global";
  const ran = capture(`said: ${said}\nproposed: a repo rule\n`, "--kind", "correction");
  assert.equal(ran.status, 0, ran.stderr);
  const [signal, ...more] = readFileSync(inbox, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  assert.equal(more.length, 0);
  assert.match(signal.id, /^[0-9a-f]{8}$/);
  assert.match(ran.stdout, new RegExp(`^captured correction signal ${signal.id} in `));
  assert.deepEqual({ ...signal, id: 0, at: 0 }, { id: 0, at: 0, session: "s1", project: basename(repo), source: "capture", kind: "correction", said, proposed: "a repo rule", note: "" });
  for (const [text, ...args] of [["said: x", "--kind", "gripe"], ["proposed: x", "--kind", "important"], ["", "--kind", "important"], ["note: x", "--kind", "cost", "--source", "pass"], ["said: x", "--kind", "cost", "--said", "x"]]) {
    const bad = capture(text, ...args);
    assert.equal(bad.status, 1, args.join(" "));
    assert.match(bad.stderr, /^capture: /);
  }
  assert.equal(readFileSync(inbox, "utf8").split("\n").filter(Boolean).length, 1);
});

// user-words.mjs gives a starting ux-reviewer the user's own words from
// the inbox: this project's, of the last 14 days, correction, decision or
// important, `said` alone, in a file its context names; other agents, other
// projects, old signals and Claude's own fields stay out
test("user-words: the user's recent words, said alone, for a ux-reviewer", () => {
  const home = scratchDir();
  const root = scratchDir();
  const { repo } = scratchRepo();
  const inbox = join(home, ".claude/process/inbox.jsonl");
  mkdirSync(dirname(inbox), { recursive: true });
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 20 * 86400000).toISOString();
  const signal = (id, fields) => JSON.stringify({ id, at: now, session: "s", project: basename(repo), source: "capture", kind: "correction", said: `said ${id}`, proposed: "PROPOSED", note: "NOTE", ...fields });
  writeFileSync(
    inbox,
    [
      signal("a1", {}),
      signal("a2", { kind: "decision", said: "two\nlines" }),
      signal("b1", { project: "elsewhere" }),
      signal("b2", { at: old }),
      signal("b3", { kind: "cost" }),
      signal("b4", { source: "lessons" }),
      signal("b5", { said: "" }),
      "not json",
    ].join("\n") + "\n",
  );
  const run = (agent_type) => runHook("user-words", { hook_event_name: "SubagentStart", agent_id: AGENT, agent_type, scratchpad_dir: root, cwd: repo }, { env: { ...process.env, HOME: home } }).stdout;
  assert.equal(run("change-reviewer"), "");
  const said = JSON.parse(run("ux-reviewer")).hookSpecificOutput.additionalContext;
  const file = join(root, "agents", AGENT, "user-words.txt");
  assert.match(said, new RegExp(`2 signals, their own words only\\): ${file}\\.`));
  assert.deepEqual(lines(readFileSync(file, "utf8")), [`a1 (${now.slice(0, 10)}, correction): said a1`, `a2 (${now.slice(0, 10)}, decision): two lines`]);
});

// from the lessons skill, capture also writes the cost's line to the
// branch's lessons file, the record review-gate reads, so the file is the
// command's output rather than a hand copy of the inbox
test("capture: a lessons signal adds its line to the branch's lessons file", () => {
  const home = scratchDir();
  const { repo } = scratchRepo({ review: true });
  const capture = (text) => runHook("capture", undefined, { args: ["--source", "lessons", "--kind", "cost"], input: text, cwd: repo, env: { ...process.env, HOME: home } });
  for (const note of ["F1 a missed copy", "CI red:\n a lint"]) assert.equal(capture(`note: ${note}\n`).status, 0);
  const ids = readFileSync(join(home, ".claude/process/inbox.jsonl"), "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line).id);
  assert.equal(readFileSync(stateFile(repo, "lessons", BRANCH), "utf8"), `Signals for ${BRANCH}:\n- F1 a missed copy → inbox ${ids[0]}\n- CI red: a lint → inbox ${ids[1]}\n`);
  const ran = runHook("review-gate", { tool_input: { command: "gh pr ready" }, cwd: repo, session_id: "s" });
  assert.equal(ran.stdout.trim(), "", "the gate takes capture's file");
});

// on main, a checkout whose origin is on GitHub takes no edits: a change
// there reaches main by PR, so the gate says to branch first, whatever
// survey there is (the old gate let a surveyed change through on main:
// red on it), and change-check says so too. With no origin, or one off
// GitHub, main's survey is the session's, as before
test("survey-gate on main: branch first where origin is on GitHub; elsewhere the session's survey", () => {
  const run = (hook, repo) => {
    const ran = runHook(hook, { tool_input: { file_path: join(repo, "b.txt"), content: "x\n" }, cwd: repo, session_id: "s" });
    assert.equal(ran.status, 0, ran.stderr);
    return ran.stdout.trim() ? JSON.parse(ran.stdout) : null;
  };
  const edit = (repo) => run("survey-gate", repo)?.hookSpecificOutput.permissionDecisionReason ?? null;
  const onMain = () => {
    const repo = scratchDir();
    git(repo, "init", "-qb", "main");
    commit(repo, "b.txt", "b\n");
    return repo;
  };
  // a reviewed survey for the work checked out
  const surveyed = (repo) => {
    const { key } = workOf(repo, { session_id: "s" });
    writeFileSync(stateFile(repo, "survey", key), "Change: b.\nFiles: b.txt\n");
    writeFileSync(stateFile(repo, "plan-review", key), "# Change review: plan\n");
  };
  const BRANCH_FIRST =
    /^This edit is turned down: branch first: main takes no edits in a checkout whose origin is on GitHub \(o\/r\), where a change reaches main by PR; .*`git worktree add -b <name> <path> origin\/main`/;

  const github = onMain();
  withOrigin(github);
  assert.match(edit(github) ?? "", BRANCH_FIRST, "no survey");
  surveyed(github);
  assert.match(edit(github) ?? "", BRANCH_FIRST, "a surveyed change on main");
  writeFileSync(join(github, "b.txt"), "x\n");
  assert.match(run("change-check", github)?.systemMessage ?? "", /^Branch main changes 1 files, but branch first: /);
  git(github, "switch", "-qc", BRANCH);
  assert.match(edit(github) ?? "", NO_SURVEY, "a branch takes the usual flow");
  surveyed(github);
  assert.equal(edit(github), null);

  const local = onMain();
  assert.equal(workOf(local, { session_id: "s" }).key, "main-s");
  assert.match(edit(local) ?? "", /there is no survey for main/);
  surveyed(local);
  assert.equal(edit(local), null, "no origin: the session's survey, as before");

  const elsewhere = onMain();
  git(elsewhere, "remote", "add", "origin", join(scratchDir(), "elsewhere.git"));
  surveyed(elsewhere);
  assert.equal(edit(elsewhere), null, "an origin off GitHub: the same");
});

// a git-ignored file on main reaches no commit or PR (a checkout's own
// .claude/settings.local.json configures only that checkout's sessions),
// so branch-first leaves it the flow it had: the session's survey, or a
// dictated one (review round 1 F7: branch-first turned it down, red on
// it); a tracked file there, or a new one nothing ignores, still branches
// first. The ignore is the global one, home.nix's `programs.git.ignores`
// (Home Manager writes it to ~/.config/git/ignore, git's default
// core.excludesFile), not the checkout's .gitignore, which most of the
// user's checkouts lack (review round 2 F7): the test reads that list from
// home.nix and hands it to git as core.excludesFile
test("survey-gate on main: a git-ignored file keeps the session's flow; a tracked one still branches first", () => {
  const SAID = "add a deny rule for Bash(rm *) here";
  const repo = scratchDir();
  git(repo, "init", "-qb", "main");
  const ignores = readFileSync(join(HOOKS, "../../../home.nix"), "utf8").match(/^\s*ignores = \[([^\]]*)\];/m)?.[1].match(/"[^"]*"/g)?.map((name) => JSON.parse(name)) ?? [];
  const excludes = join(scratchDir(), "ignore");
  writeFileSync(excludes, ignores.map((name) => `${name}\n`).join(""));
  git(repo, "config", "core.excludesFile", excludes);
  commit(repo, "b.txt", "b\n");
  withOrigin(repo);
  mkdirSync(join(repo, ".claude"));
  const local = join(repo, ".claude/settings.local.json");
  writeFileSync(local, "{}\n");
  const transcript = join(scratchDir(), "t.jsonl");
  writeFileSync(transcript, `${JSON.stringify({ type: "user", origin: { kind: "human" }, message: { role: "user", content: SAID } })}\n`);
  const edit = (file_path, content) => {
    const ran = runHook("survey-gate", { tool_input: { file_path, content }, cwd: repo, session_id: "s", transcript_path: transcript });
    assert.equal(ran.status, 0, ran.stderr);
    return ran.stdout.trim() ? JSON.parse(ran.stdout).hookSpecificOutput.permissionDecisionReason : null;
  };
  const denied = `${JSON.stringify({ permissions: { deny: ["Bash(rm *)"] } }, null, 2)}\n`;
  const BRANCH_FIRST = /^This edit is turned down: branch first: /;
  assert.match(edit(local, denied) ?? "", /^Before this edit, there is no survey for main: /, "no survey: the usual turn-down");
  writeFileSync(stateFile(repo, "survey", "main-s"), `dictated: "${SAID}" .claude/settings.local.json\n`);
  assert.equal(edit(local, denied), null, "a dictated edit of the ignored file");
  assert.match(edit(join(repo, "b.txt"), "x\n") ?? "", BRANCH_FIRST, "a tracked file");
  assert.match(edit(join(repo, "c.txt"), "x\n") ?? "", BRANCH_FIRST, "a new file nothing ignores");
});

// review-gate's merge rule: in a checkout of CristianCrane/.dotfiles, `gh
// pr merge` goes through only naming the PR by its number alone, and only
// when a message the user typed in this session asks to merge that number
// (the old gate let every merge through: red on it); another repo's
// merges aren't its business
test("review-gate: a dotfiles PR merges only when the user asked to merge that number", () => {
  const { repo: dotfiles } = scratchRepo();
  git(dotfiles, "remote", "add", "origin", "git@github.com:CristianCrane/.dotfiles.git");
  const { repo: other } = scratchRepo();
  git(other, "remote", "add", "origin", "https://github.com/o/r");
  const transcript = join(scratchDir(), "t.jsonl");
  const said = (...entries) => writeFileSync(transcript, entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n");
  const human = (content) => ({ type: "user", origin: { kind: "human" }, message: { role: "user", content } });
  const merge = (cwd, command) => {
    const ran = runHook("review-gate", { tool_input: { command }, cwd, session_id: "s", transcript_path: transcript });
    assert.equal(ran.status, 0, ran.stderr);
    return ran.stdout.trim() ? JSON.parse(ran.stdout).hookSpecificOutput.permissionDecisionReason : null;
  };
  const NOT_ASKED = (n) =>
    new RegExp(String.raw`^Only the user merges a CristianCrane/\.dotfiles PR: no message the user typed in this session asks to merge #${n} \(a relay or your own words don't count\)`);
  const ONE_WAY = /^Run `gh pr merge <number>` from a checkout of CristianCrane\/\.dotfiles, the PR named by its number alone/;

  said(human("hi"), human("looks right, merge #12 please"), { type: "user", origin: { kind: "peer", from: "a1" }, isMeta: true, message: { content: "merge 13" } });
  assert.equal(merge(dotfiles, "gh pr merge 12 --squash --delete-branch"), null);
  assert.equal(merge(dotfiles, 'gh pr merge --squash -t "fix 13" 12'), null, "a number in the subject isn't the PR's");
  assert.equal(merge(dotfiles, "gh pr merge > /dev/null 2>&1 12"), null, "a redirect's target isn't the PR");
  assert.match(merge(dotfiles, "gh pr merge 13") ?? "", NOT_ASKED(13), "an agent's relay asked for 13");
  assert.match(merge(dotfiles, "gh pr merge 1") ?? "", NOT_ASKED(1), "1 isn't 12");
  assert.match(merge(dotfiles, "gh pr merge 2") ?? "", NOT_ASKED(2), "nor is 2");
  // after a wrapper or a shell keyword (lib's prStep, from #27)
  for (const command of ["if gh pr merge 13; then :; fi", "timeout 60 gh pr merge 13", "until gh pr merge 13; do sleep 5; done"])
    assert.match(merge(dotfiles, command) ?? "", NOT_ASKED(13), command);
  for (const command of [
    "gh pr merge",
    "gh pr merge pr-flow",
    "gh pr merge https://github.com/CristianCrane/.dotfiles/pull/12",
    "gh pr merge -R CristianCrane/.dotfiles 12",
    "gh pr merge --repo=CristianCrane/.dotfiles 12",
    "gh pr merge 12 -Ro/r",
    "gh -R CristianCrane/.dotfiles pr merge 12",
    "GH_REPO=CristianCrane/.dotfiles gh pr merge 12",
    "GH_HOST=github.com gh pr merge 12",
    "gh pr merge 12 13",
  ])
    assert.match(merge(dotfiles, command) ?? "", ONE_WAY, command);
  // from another checkout: a command naming the dotfiles anywhere (it may be
  // theirs, by a route the gate doesn't know), or cd-ing into one
  assert.match(merge(other, "gh pr merge -R cristiancrane/.dotfiles 12") ?? "", ONE_WAY);
  assert.match(merge(other, "gh pr merge -RCristianCrane/.dotfiles 12") ?? "", ONE_WAY);
  assert.match(merge(other, 'gh pr merge 12 -t "for CristianCrane/.dotfiles"') ?? "", ONE_WAY);
  assert.equal(merge(other, `cd ${dotfiles} && gh pr merge 12`), null);
  assert.match(merge(other, `cd ${dotfiles} && gh pr merge 13`) ?? "", NOT_ASKED(13));
  // another repo's merges, whatever the transcript
  for (const command of ["gh pr merge", "gh pr merge 13 --squash", "gh pr merge -R o/r 13"]) assert.equal(merge(other, command), null, command);
  // a message that names the number but asks no merge
  said(human("12 looks fine"));
  assert.match(merge(dotfiles, "gh pr merge 12") ?? "", NOT_ASKED(12));
});

// a process batch's PR (the dotfiles' docs/process.md, Landing) merges by
// the agent, bare from its own checkout, when its log is the approval: the
// first commit adds the verdicts, every later one names a yes or an edit,
// and the review leaves nothing open. Its name alone isn't the key (the
// old gate turned every bare merge down: red on it)
test("review-gate: a process batch merges by the agent once its log approves every change", () => {
  const BATCH = "process-batch-2026-11-19-history";
  const transcript = join(scratchDir(), "t.jsonl");
  writeFileSync(transcript, "");
  const batch = ({ log = "- L1 yes · rule line → global CLAUDE.md · global · recommended yes\n- L2 no · hook → dotfiles · global · recommended yes\n", changes = ["Change: the vendor-guide line, L1"], header = "round 1, 0 to recheck" } = {}) => {
    const repo = scratchDir();
    git(repo, "init", "-qb", "main");
    git(repo, "remote", "add", "origin", "git@github.com:CristianCrane/.dotfiles.git");
    commit(repo, "a.txt", "a\n");
    git(repo, "switch", "-qc", BATCH);
    mkdirSync(join(repo, "docs"));
    commit(repo, "docs/process-log.md", log);
    changes.forEach((message, at) => {
      writeFileSync(join(repo, `c${at}.txt`), message);
      git(repo, "add", ".");
      git(repo, "commit", "-qm", message);
    });
    const head = git(repo, "rev-parse", "--short", "HEAD");
    writeFileSync(stateFile(repo, "review", BATCH), `# Change review: ${BATCH} @ ${head}, ${header}\n`);
    return repo;
  };
  const merge = (cwd, command = "gh pr merge --squash --delete-branch") => {
    const ran = runHook("review-gate", { tool_input: { command }, cwd, session_id: "s", transcript_path: transcript });
    assert.equal(ran.status, 0, ran.stderr);
    return ran.stdout.trim() ? JSON.parse(ran.stdout).hookSpecificOutput.permissionDecisionReason : null;
  };
  const NOT_APPROVED = (why) => new RegExp(String.raw`^A process batch merges by the agent only when the user's verdicts in its log approve every change .*: ${why}`);

  assert.equal(merge(batch()), null);
  assert.equal(merge(batch({ changes: ["Change: one, L1", "Cleanup: its stale line, L1"] })), null);
  assert.match(merge(batch({ changes: ["Change: the hook, L2"] })) ?? "", NOT_APPROVED("commit [0-9a-f]{7} names L2, which the log doesn't add with a yes or edit"));
  assert.match(merge(batch({ changes: ["Change: something else"] })) ?? "", NOT_APPROVED(String.raw`commit [0-9a-f]{7} names no log entry \(L<n>\)`));
  // the log commit alone: a repo's batch, whose changes are in the repo
  assert.equal(merge(batch({ changes: [] })), null);
  assert.match(merge(batch({ header: "round 1, 2 to recheck" })) ?? "", NOT_APPROVED("its review has 2 to recheck"));
  // a commit after the review: no reviewer has read what would merge
  const later = batch();
  commit(later, "d.txt", "Change: more, L1");
  assert.match(merge(later) ?? "", NOT_APPROVED("its review is of [0-9a-f]+, and commits since change more than comment lines"));
  // a first commit that does more than add the log's entries
  const mixed = batch();
  git(mixed, "reset", "-q", "--soft", "HEAD~2");
  writeFileSync(join(mixed, "x.txt"), "x");
  git(mixed, "add", ".");
  git(mixed, "commit", "-qm", "log and a change, L1");
  commit(mixed, "y.txt", "Change: L1");
  writeFileSync(stateFile(mixed, "review", BATCH), `# Change review: ${BATCH} @ ${git(mixed, "rev-parse", "--short", "HEAD")}, round 1, 0 to recheck\n`);
  assert.match(merge(mixed) ?? "", NOT_APPROVED("its first commit .* must add the run's entries to docs/process-log.md and nothing else"));
  // a first commit that rewrites a past verdict, no to yes: only adds count
  const rewrite = batch();
  git(rewrite, "switch", "-q", "main");
  git(rewrite, "branch", "-qD", BATCH);
  mkdirSync(join(rewrite, "docs"), { recursive: true });
  commit(rewrite, "docs/process-log.md", "- L3 no · hook → dotfiles · global · recommended yes\n");
  git(rewrite, "switch", "-qc", BATCH);
  commit(rewrite, "docs/process-log.md", "- L3 yes · hook → dotfiles · global · recommended yes\n");
  commit(rewrite, "c.txt", "Change: the hook, L3");
  writeFileSync(stateFile(rewrite, "review", BATCH), `# Change review: ${BATCH} @ ${git(rewrite, "rev-parse", "--short", "HEAD")}, round 1, 0 to recheck\n`);
  assert.match(merge(rewrite) ?? "", NOT_APPROVED("its first commit .* must add the run's entries to docs/process-log.md and nothing else"));
  // named any other way, it's the user's merge as before
  for (const command of ["gh pr merge 12", "gh pr merge -R CristianCrane/.dotfiles", `gh pr merge ${BATCH}`])
    assert.match(merge(batch(), command) ?? "", /^(?:Only the user merges|Run `gh pr merge <number>`)/, command);
});

// a Monitor runs a shell command as Bash does, so review-gate's rules hold
// there too: settings.json registers it on a matcher that matches both,
// and the gate reads a Monitor's command (review round 4 F11: it was
// registered for Bash alone, so `gh pr merge` in a Monitor skipped it)
test("review-gate: a Monitor's gh pr merge is gated as Bash's is", () => {
  const settings = JSON.parse(readFileSync(join(HOOKS, "../settings.json"), "utf8"));
  const groups = settings.hooks.PreToolUse.filter((group) => group.hooks.some((hook) => /\/review-gate\.mjs\b/.test(hook.command ?? "")));
  assert.equal(groups.length, 1, "review-gate is registered once");
  const matches = (tool) => new RegExp(`^(?:${groups[0].matcher})$`).test(tool);
  assert.ok(matches("Bash") && matches("Monitor"), `review-gate's matcher ${groups[0].matcher} matches Bash and Monitor`);
  const { repo } = scratchRepo();
  git(repo, "remote", "add", "origin", "git@github.com:CristianCrane/.dotfiles.git");
  const transcript = join(scratchDir(), "t.jsonl");
  writeFileSync(transcript, `${JSON.stringify({ type: "user", origin: { kind: "human" }, message: { role: "user", content: "hi" } })}\n`);
  const ran = runHook("review-gate", { tool_name: "Monitor", tool_input: { command: "gh pr merge 13", description: "merge" }, cwd: repo, session_id: "s", transcript_path: transcript });
  assert.equal(ran.status, 0, ran.stderr);
  assert.match(JSON.parse(ran.stdout || "{}").hookSpecificOutput?.permissionDecisionReason ?? "", /^Only the user merges a CristianCrane\/\.dotfiles PR: no message the user typed in this session asks to merge #13/);
});

// a dictated settings change (the change skill's rule): its one-line
// survey skips the plan review and the review only while the user typed
// its quote and the change is the one settings file it names, and only
// makes Claude ask or refuse more (an allow rule removed, a deny or ask
// rule added) or sets the model or theme, each entry named whole in the
// quote, five at most; plugins and widenings take the full flow (the old
// gate asked for a plan review: red on it)
test("dictated: a settings change the user typed out skips the reviews, and nothing wider does", () => {
  const SAID = "add a deny rule for Skill(x:pr) please, and ask for Skill(y:z), not Bash(rm *)";
  const settings = { permissions: { deny: ["Bash(rm *)"] }, hooks: { PreToolUse: [{ matcher: "Edit|Write", hooks: [] }] } };
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  // a branch at main, whose settings file is in it; the survey and a transcript
  // where `said` came as `origin`
  const setUp = ({ survey = `dictated: "${SAID}" .claude/settings.json\n`, origin = { kind: "human" }, isMeta = false } = {}) => {
    const { repo } = scratchRepo();
    git(repo, "switch", "-q", "main");
    mkdirSync(join(repo, ".claude"));
    commit(repo, ".claude/settings.json", json(settings));
    git(repo, "switch", "-q", BRANCH);
    git(repo, "reset", "-q", "--hard", "main"); // nothing else on the branch
    write(repo, "survey", survey);
    const transcript = join(scratchDir(), "t.jsonl");
    const entries = [
      { type: "user", origin: { kind: "human" }, message: { role: "user", content: "hi" } },
      { type: "user", origin, isMeta, message: { role: "user", content: `well: ${SAID.replace(/ /g, "\n ")}` } },
    ];
    writeFileSync(transcript, entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n");
    return { repo, transcript };
  };
  const run = (hook, { repo, transcript }, tool_input) => {
    const ran = runHook(hook, { tool_input, cwd: repo, session_id: "s", transcript_path: transcript });
    return ran.stdout.trim() ? JSON.parse(ran.stdout).hookSpecificOutput.permissionDecisionReason : null;
  };
  const editTo = (state, value, file = ".claude/settings.json") =>
    run("survey-gate", state, { file_path: join(state.repo, file), content: json(value) });
  const deny = (...rules) => ({ ...settings, permissions: { deny: [...settings.permissions.deny, ...rules] } });

  const plain = setUp();
  assert.equal(editTo(plain, deny("Skill(x:pr)")), null, "a dictated deny rule waits for no plan review");
  assert.match(editTo(plain, { ...settings, hooks: { PreToolUse: [{ matcher: "Write", hooks: [] }] } }), /is dictated, but it changes `hooks\.PreToolUse\[/);
  assert.match(editTo(plain, deny("a", "b", "c", "d", "e", "f")), /is dictated, but it changes 6 entries, more than 5/);
  // F7, F10: each entry the change makes is named in the user's words, as a
  // whole (a bare Bash inside Bash(rm *) names nothing)
  assert.match(editTo(plain, deny("Bash(*)")), /is dictated, but the user's quote doesn't name `permissions\.deny\["Bash\(\*\)"\]`'s entry/);
  assert.equal(editTo(plain, deny("Skill(x:pr)", "Skill(y:z)")), null, "two rules, both named");
  assert.match(editTo(plain, deny("Bash")), /the user's quote doesn't name `permissions\.deny\["Bash"\]`'s entry/);
  // F11: only what makes Claude ask or refuse more; a widening or a plugin
  // takes the full flow, whatever the quote says
  const allow = { ...settings, permissions: { ...settings.permissions, allow: ["Skill(x:pr)"] } };
  assert.match(editTo(plain, allow), /it changes `permissions\.allow\["Skill\(x:pr\)"\]`: only an allow rule removed/);
  assert.match(editTo(plain, { ...settings, permissions: { deny: [] } }), /it changes `permissions\.deny\["Bash\(rm \*\)"\]`: only/);
  assert.match(editTo(plain, { ...settings, enabledPlugins: { "Skill(x:pr)": true } }), /it changes `enabledPlugins\.Skill\(x:pr\)`: only/);
  // F12: a model is set only to a value the quote names whole
  const model = setUp({ survey: `dictated: "set the model to sonnet[1m] please" .claude/settings.json\n` });
  writeFileSync(model.transcript, `${JSON.stringify({ type: "user", origin: { kind: "human" }, message: { content: "set the model to sonnet[1m] please" } })}\n`);
  assert.match(editTo(model, { ...settings, model: "sonnet" }), /the user's quote doesn't name `model`'s entry/);
  assert.equal(editTo(model, { ...settings, model: "sonnet[1m]" }), null, "the model the user named");
  assert.match(editTo(setUp({ survey: `dictated: "${SAID}" a.txt\n` }), deny("Skill(x:pr)")), /is dictated, but a\.txt isn't a Claude settings file/);
  assert.match(editTo(setUp({ survey: `dictated: "${SAID}" a.txt .claude/settings.json\n` }), deny("Skill(x:pr)")), /is dictated, but it doesn't name exactly one file/);
  assert.match(editTo(plain, { a: 1 }, ".claude/other.json"), /is dictated, but the change goes past \.claude\/settings\.json/);
  assert.match(editTo(setUp({ origin: { kind: "peer", from: "a1" }, isMeta: true }), deny("Skill(x:pr)")), /isn't in a message the user typed/);
  assert.match(editTo(setUp({ survey: `dictated: "${SAID}" .claude/settings.json\nPlan: none\n` }), deny("Skill(x:pr)")), /has no plan review/);

  // committed, it needs no review to leave draft, only its lessons
  writeFileSync(join(plain.repo, ".claude/settings.json"), json(deny("Skill(x:pr)")));
  git(plain.repo, "commit", "-qam", "deny");
  write(plain.repo, "lessons", "None: dictated\n");
  assert.equal(run("review-gate", plain, { command: "gh pr ready" }), null, "a dictated change has no review to wait for");
  writeFileSync(join(plain.repo, ".claude/settings.json"), json({ ...deny("Skill(x:pr)"), env: { A: "1" } }));
  git(plain.repo, "commit", "-qam", "env");
  assert.match(run("review-gate", plain, { command: "gh pr ready" }), /its survey is dictated, but it changes `env\.A`/);
});

// a prototype branch (the change skill's rule) skips the survey and the
// plan review: its edits go through, and change-check, which nags a
// branch with no survey, says nothing (the gate asked for a survey: red
// on it). Its PR is held by review-gate's rows above
test("prototype: a prototype-<name> branch's edits wait for nothing", () => {
  const edit = (repo, hook) => {
    const ran = runHook(hook, { tool_input: { file_path: join(repo, "b.txt"), content: "x\n" }, cwd: repo, session_id: "s" });
    assert.equal(ran.status, 0, ran.stderr);
    return ran.stdout.trim();
  };
  const { repo } = scratchRepo();
  assert.match(edit(repo, "survey-gate"), NO_SURVEY, "a feature branch waits for its survey");
  writeFileSync(join(repo, "b.txt"), "x\n");
  assert.match(edit(repo, "change-check"), /there is no survey for feature/, "change-check nags a feature branch");
  git(repo, "switch", "-qc", PROTOTYPE_BRANCH);
  assert.equal(edit(repo, "survey-gate"), "");
  assert.equal(edit(repo, "change-check"), "");
  git(repo, "switch", "-qc", "prototypes-later");
  assert.match(edit(repo, "survey-gate"), /there is no survey for prototypes-later/, "only prototype-<name>");
});

// a shell command's checkout is where its last cd leaves it, a cd in quoted
// text not counting; an edit's, its file's
test("cwdFor: a command's last cd, an edit's file", () => {
  const { repo } = scratchRepo();
  const outside = scratchDir();
  const bash = (command) => cwdFor({ tool_input: { command }, cwd: outside });
  assert.equal(bash(`cd ${repo} && git status`), repo);
  assert.equal(bash(`cd /tmp; cd ${repo}`), repo);
  assert.equal(bash(`echo "cd ${repo}"`), outside);
  assert.equal(bash("git status"), outside);
  assert.equal(bash(`cd /tmp 2>&1; cd ${repo} 2>/dev/null && git status`), repo);
  assert.equal(bash(`cd ${repo}; echo "$(cd /tmp)" && git status`), repo);
  assert.equal(bash(`cd ${repo}; diff <(cd /tmp && ls) b`), repo);
  assert.equal(bash(`cd '${repo}' && git status`), repo);
  assert.equal(cwdFor({ tool_input: { file_path: join(repo, "b.txt") }, cwd: outside }), repo);
});

// the substitutions the shell runs, wherever it runs them: in double
// quotes and unquoted heredocs too (masked() blanks those), never in
// single quotes or a quoted-tag heredoc
test("substitutions: each the shell runs, outermost first", () => {
  const inner = (command) => substitutions(command).map((found) => found.inner);
  assert.deepEqual(inner('echo "$(pnpm test)"'), ["pnpm test"]);
  assert.deepEqual(inner("cat <<EOF\n$(pnpm test)\nEOF"), ["pnpm test"]);
  assert.deepEqual(inner("cat <<'EOF'\n$(pnpm test) `x`\nEOF"), []);
  assert.deepEqual(inner("rg -n '$(x)|`y`' ."), []);
  assert.deepEqual(inner('rg x "`node -e 1`"'), ["node -e 1"]);
  assert.deepEqual(inner("diff <(git show a) >(tee out)"), ["git show a", "tee out"]);
  assert.deepEqual(inner('rg "Promise<(A|B)>"'), []); // plain text in double quotes
  assert.deepEqual(inner("git diff $(git merge-base HEAD $(git rev-parse x))..HEAD"), ["git merge-base HEAD $(git rev-parse x)"]);
  assert.deepEqual(inner(`echo "it's $(a ")")"`), ['a ")"']);
  assert.deepEqual(inner("echo $(a"), ["a"]);
  const [found] = substitutions("x $(a) y");
  assert.deepEqual([found.start, found.end], [2, 6]);
});

// prune-merged.mjs, run by hand and as the SessionStart hook, on a scratch
// repo whose origin stands for GitHub (a bare repo, reached from a
// github.com URL by insteadOf) and a fake `gh` first on PATH, answering
// with the scratch repo's PRs
describe("prune-merged", () => {
  const sleepers = [];
  after(() => sleepers.forEach((sleeper) => sleeper.kill()));

  // a fake gh's folder: it answers with the repo and its PRs, or, `down`,
  // the error gh gives offline
  const prsGh = (prs, down = false) => {
    const bin = scratchDir();
    writeFileSync(join(bin, "prs.json"), JSON.stringify(prs));
    const repo = JSON.stringify({ data: { viewer: { login: "me" }, repository: { defaultBranchRef: { name: "main" } } } });
    return fakeCommand(
      "gh",
      down ? `echo "error connecting to api.github.com" >&2; exit 1` : `if [ "$1" = api ]; then echo '${repo}'; else cat "${join(bin, "prs.json")}"; fi`,
      bin,
    ).bin;
  };

  // a main checkout and its origin, with a branch for each way a worktree
  // or branch goes or stays; `only` builds just the branches it names
  const scratch = (only) => {
    const dir = scratchDir();
    const main = join(dir, "main");
    git(dir, "init", "-q", "-b", "main", main);
    commit(main, "a.txt", "a\n");
    withOrigin(main, dir);
    const prs = [];
    // a branch off main with a commit of its own, in a worktree at
    // ../<name> (removed again unless `worktree`), pushed unless `local`,
    // with a PR in `state` by `author` unless null
    const branch = (name, state, { worktree = true, local = false, author = "me" } = {}) => {
      if (only && !only.includes(name)) return;
      const path = join(dir, name);
      git(main, "worktree", "add", "-q", "-b", name, path, "main");
      commit(path, `${name}.txt`, `${name}\n`);
      if (!local) git(path, "push", "-q", "origin", name);
      const headRefOid = git(path, "rev-parse", "HEAD");
      if (state) prs.push({ number: prs.length + 1, state, headRefName: name, headRefOid, isCrossRepository: false, author: { login: author } });
      if (!worktree) git(main, "worktree", "remove", path);
      return path;
    };
    branch("done", "MERGED");
    branch("live", "OPEN");
    const dirty = branch("dirty", "MERGED");
    if (dirty) writeFileSync(join(dirty, "notes.txt"), "not yet\n");
    const busy = branch("busy", "MERGED");
    if (busy) sleepers.push(spawn("sleep", ["60"], { cwd: busy, stdio: "ignore" }));
    // merged, then a commit more, never pushed
    if (branch("later", "MERGED", { worktree: true })) {
      commit(join(dir, "later"), "more.txt", "more\n");
      git(main, "worktree", "remove", join(dir, "later"));
    }
    branch("closed", "CLOSED", { worktree: false });
    branch("theirs", "MERGED", { worktree: false, author: "them" });
    const proto = branch("proto", null, { worktree: false });
    // a fork's merged PR from a branch of the same name counts for nothing
    if (proto !== undefined)
      prs.push({ number: 99, state: "MERGED", headRefName: "proto", headRefOid: git(main, "rev-parse", "proto"), isCrossRepository: true });
    branch("mine", null, { worktree: false, local: true });
    if (!only || only.includes("in-main")) git(main, "worktree", "add", "-q", "--detach", join(dir, "in-main"), "main");
    if (!only || only.includes("off-main")) {
      git(main, "worktree", "add", "-q", "--detach", join(dir, "off-main"), "main");
      commit(join(dir, "off-main"), "off.txt", "off\n");
    }
    age(main);
    branch("fresh", "MERGED");
    return { dir, main, bin: prsGh(prs) };
  };

  // every worktree there is last used 7 hours ago
  const age = (main) => {
    const then = new Date(Date.now() - 7 * 60 * 60 * 1000);
    for (const line of lines(git(main, "worktree", "list", "--porcelain"))) {
      const path = line.slice("worktree ".length);
      if (!line.startsWith("worktree ") || !existsSync(path)) continue;
      const gitDir = git(path, "rev-parse", "--absolute-git-dir");
      for (const file of ["HEAD", "logs/HEAD"]) utimesSync(join(gitDir, file), then, then);
    }
  };

  const prune = (bin, cwd, ...args) =>
    runHook("prune-merged", args.includes("--hook") ? { hook_event_name: "SessionStart", cwd, session_id: "s" } : undefined, {
      args,
      cwd,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });
  const worktreeNames = (main) =>
    lines(git(main, "worktree", "list", "--porcelain"))
      .filter((line) => line.startsWith("worktree "))
      .map((line) => line.split("/").at(-1));
  const branches = (main, prefix) => lines(git(main, "for-each-ref", "--format=%(refname:lstrip=2)", prefix)).sort();
  const remote = (main) => lines(git(main, "ls-remote", "--heads", "origin")).map((line) => line.split("refs/heads/")[1]).sort();

  test("by hand: removes merged work, and lists what it keeps and why", () => {
    const { main, bin } = scratch();
    const ran = prune(bin, main);
    assert.equal(ran.status, 0, ran.stderr);
    assert.match(ran.stdout, /^Removed 2 worktrees:\n {2}\.\.\/done \(done, PR #1 merged\)\n {2}\.\.\/in-main \(detached, in origin\/main\)$/m);
    assert.match(ran.stdout, /^ {2}\.\.\/live \(live\): open PR #2$/m);
    assert.match(ran.stdout, /^ {2}\.\.\/dirty \(dirty\): uncommitted or untracked changes$/m);
    assert.match(ran.stdout, /^ {2}\.\.\/busy \(busy\): a process works in it \(pid \d+\)$/m);
    assert.match(ran.stdout, /^ {2}\.\.\/off-main \(detached\): detached, at a commit not in origin\/main$/m);
    assert.match(ran.stdout, /^ {2}\.\.\/fresh \(fresh\): used 0 min ago$/m);
    assert.match(ran.stdout, /^ {2}merged, not your PR \(on origin\) \(1\): theirs$/m);
    assert.match(ran.stdout, /^ {2}commits its merged PR doesn't have \(1\): later$/m);
    assert.match(ran.stdout, /^ {2}its PR closed unmerged \(1\): closed$/m);
    assert.match(ran.stdout, /^ {2}no PR \(2\): (?=.*\bproto\b)(?=.*\bmine \(local only\))/m);
    assert.deepEqual(worktreeNames(main).sort(), ["busy", "dirty", "fresh", "live", "main", "off-main"]);
    // later: its local copy has a commit more and stays; origin's is its PR's
    // head. theirs: its local copy goes; origin's is another author's
    assert.deepEqual(branches(main, "refs/heads/"), ["busy", "closed", "dirty", "fresh", "later", "live", "main", "mine", "proto"]);
    assert.deepEqual(remote(main), ["busy", "closed", "dirty", "fresh", "live", "main", "proto", "theirs"]);
    assert.ok(!existsSync(join(main, ".git/claude/pruned")) || !readdirSync(join(main, ".git/claude/pruned")).length);
  });

  test("--dry-run: says what would go, and removes nothing", () => {
    const { main, bin } = scratch();
    const before = [worktreeNames(main), branches(main, "refs/heads/"), remote(main)];
    const ran = prune(bin, main, "--dry-run");
    assert.equal(ran.status, 0, ran.stderr);
    assert.match(ran.stdout, /^Would remove 2 worktrees:/m);
    assert.match(ran.stdout, /^Would delete 2 local branches: done, theirs$/m);
    assert.deepEqual([worktreeNames(main), branches(main, "refs/heads/"), remote(main)], before);
  });

  // a mistyped flag once ran a real prune: it was ignored, not refused
  test("a flag it doesn't know: says how it runs, and removes nothing", () => {
    const { main, bin } = scratch();
    const before = [worktreeNames(main), branches(main, "refs/heads/"), remote(main)];
    const ran = prune(bin, main, "--dryrun");
    assert.equal(ran.status, 1);
    assert.match(ran.stderr, /^prune-merged: .*'--dryrun'.*\nUsage: node ~\/\.claude\/hooks\/prune-merged\.mjs \[--dry-run\]$/m);
    assert.deepEqual([worktreeNames(main), branches(main, "refs/heads/"), remote(main)], before);
  });

  // by hand, a repo whose origin is off GitHub: it names the origin it read
  test("by hand, an origin off GitHub: says so, naming it, and removes nothing", () => {
    const { repo } = scratchRepo();
    const elsewhere = join(scratchDir(), "elsewhere.git");
    git(repo, "remote", "add", "origin", elsewhere);
    const ran = runHook("prune-merged", undefined, { cwd: repo });
    assert.equal(ran.status, 1);
    assert.equal(ran.stderr, `prune-merged: origin isn't on GitHub (${elsewhere})\n`);
    assert.equal(git(repo, "branch", "--show-current"), BRANCH);
  });

  test("--hook in the main checkout: one line on what went and what merged stayed", () => {
    const { dir, main, bin } = scratch();
    // a process in a worktree used just now: an agent at work
    sleepers.push(spawn("sleep", ["60"], { cwd: join(dir, "fresh"), stdio: "ignore" }));
    const ran = prune(bin, main, "--hook");
    assert.equal(ran.status, 0, ran.stderr);
    const { systemMessage } = JSON.parse(ran.stdout);
    assert.match(systemMessage, /^Pruned merged work: 2 worktrees, 2 local branches, 2 branches on origin\./);
    assert.match(systemMessage, /Kept \.\.\/dirty, merged but: uncommitted or untracked changes\./);
    // a process in a worktree unused for hours may never end, so it's said;
    // in one used just now it's an agent at work, unsaid
    assert.match(systemMessage, /Kept \.\.\/busy, merged but: a process works in it/);
    assert.doesNotMatch(systemMessage, /live|proto|fresh|theirs/);
  });

  test("--hook: silent with nothing to do, outside the main checkout, and offline", () => {
    const quiet = scratch(["live", "proto"]);
    assert.equal(prune(quiet.bin, quiet.main, "--hook").stdout, "");
    const { dir, main, bin } = scratch(["done", "live"]);
    const fromWorktree = prune(bin, join(dir, "live"), "--hook");
    assert.equal(fromWorktree.status, 0);
    assert.equal(fromWorktree.stdout, "");
    const offline = prsGh([], true);
    const hooked = prune(offline, main, "--hook");
    assert.equal(hooked.status, 0);
    assert.equal(hooked.stdout, "");
    assert.deepEqual(worktreeNames(main).sort(), ["done", "live", "main"]);
    // by hand, it says why it couldn't run
    const byHand = prune(offline, main);
    assert.equal(byHand.status, 1);
    assert.match(byHand.stderr, /^prune-merged: error connecting to api\.github\.com$/m);
  });
  // a branch brought into main with no PR (a repo whose changes land on
  // main, round 1 F8) goes like a merged one; an unmerged worktree moved by `mv` keeps
  // its entry, so `git worktree repair` can still find it (round 1 F7)
  test("a branch in main with no PR goes; another worktree's entry stays", () => {
    const { dir, main, bin } = scratch(["live"]);
    const ff = join(dir, "ff");
    git(main, "worktree", "add", "-q", "-b", "ff", ff, "main");
    commit(ff, "ff.txt", "ff\n");
    git(main, "merge", "-q", "--ff-only", "ff");
    git(main, "push", "-q", "origin", "main");
    const wip = join(dir, "wip");
    git(main, "worktree", "add", "-q", "-b", "wip", wip, "main");
    commit(wip, "wip.txt", "wip\n");
    renameSync(wip, join(dir, "wip-moved"));
    age(main);
    const ran = prune(bin, main);
    assert.equal(ran.status, 0, ran.stderr);
    assert.match(ran.stdout, /^Removed 1 worktree:\n {2}\.\.\/ff \(ff, in origin\/main\)$/m);
    assert.match(ran.stdout, /^Deleted 1 local branch: ff$/m);
    assert.ok(existsSync(join(main, ".git/worktrees/wip")));
    git(main, "worktree", "repair", join(dir, "wip-moved"));
    assert.equal(git(join(dir, "wip-moved"), "branch", "--show-current"), "wip");
  });

  // round 1 F6: a run never sweeps a tree another live run moved aside
  test("one run at a time: a live run's lock holds, a dead run's is taken over", () => {
    const { dir, main, bin } = scratch(["done"]);
    age(main);
    const held = join(main, ".git/claude/prune-merged.lock");
    mkdirSync(held, { recursive: true });
    writeFileSync(join(held, "pid"), String(process.pid));
    assert.match(prune(bin, main).stdout, /^Another prune-merged run has this repo/);
    assert.equal(prune(bin, main, "--hook").stdout, "");
    assert.ok(existsSync(join(dir, "done")));
    writeFileSync(join(held, "pid"), String(spawnSync("true").pid));
    assert.match(prune(bin, main).stdout, /^Removed 1 worktree:/);
    assert.ok(!existsSync(held));
  });

  // what a killed run left: a folder whose entry went was checked, and is
  // deleted; one whose entry stands is checked now, and with changes kept
  test("a killed run's leftovers: a checked one goes, one with changes is kept", () => {
    const { dir, main, bin } = scratch(["done"]);
    age(main);
    const trash = join(main, ".git/claude/pruned");
    mkdirSync(join(trash, "old-1"), { recursive: true });
    writeFileSync(join(trash, "old-1/x.txt"), "x\n");
    renameSync(join(dir, "done"), join(trash, "done-2"));
    writeFileSync(join(trash, "done-2/notes.txt"), "not yet\n");
    const ran = prune(bin, main);
    assert.equal(ran.status, 0, ran.stderr);
    assert.match(ran.stdout, /^ {2}\.git\/claude\/pruned-kept\/done-2: changes turned up as it was removed$/m);
    assert.deepEqual(readdirSync(trash), []);
    assert.ok(existsSync(join(main, ".git/claude/pruned-kept/done-2/notes.txt")));
    assert.ok(existsSync(join(main, ".git/worktrees/done")));
  });

  // round 2 F10: a leftover whose entry went, its name since given to a new
  // worktree, is deleted, and the new worktree's entry stays
  test("a killed run's leftover never takes a new worktree's entry of the same name", () => {
    const { dir, main, bin } = scratch(["live"]);
    const base = join(dir, "base");
    const trash = join(main, ".git/claude/pruned");
    git(main, "worktree", "add", "-q", "--detach", base, "main");
    mkdirSync(trash, { recursive: true });
    renameSync(base, join(trash, "base-1"));
    rmSync(join(main, ".git/worktrees/base"), { recursive: true });
    git(main, "worktree", "add", "-q", "--detach", base, "main");
    git(main, "worktree", "lock", base);
    const ran = prune(bin, main);
    assert.equal(ran.status, 0, ran.stderr);
    assert.deepEqual(readdirSync(trash), []);
    assert.match(ran.stdout, /^ {2}\.\.\/base \(detached\): locked$/m);
    assert.equal(git(base, "status", "--porcelain"), "");
  });
});

// red-checks.mjs, run by hand and as the SessionStart hook, in a scratch
// repo whose origin is a github.com URL, with a fake `gh` first on PATH
// answering the repo's open PRs and its default branch's runs
describe("red-checks", () => {
  // a checkout whose origin is on GitHub (never fetched: red-checks asks gh)
  const checkout = () => {
    const repo = scratchDir();
    git(repo, "init", "-q", "-b", "main");
    git(repo, "remote", "add", "origin", "https://github.com/o/r");
    return repo;
  };

  // a fake gh's folder: `api` answers the open PRs, each [number, its
  // check rollup's state], and `run list` the runs, newest first; `down`,
  // the error gh gives offline
  const redGh = ({ prs = [], runs = [], down = false } = {}) => {
    const bin = scratchDir();
    const repository = {
      defaultBranchRef: { name: "main" },
      pullRequests: { nodes: prs.map(([number, state]) => ({ number, commits: { nodes: [{ commit: { statusCheckRollup: state && { state } } }] } })) },
    };
    writeFileSync(join(bin, "api.json"), JSON.stringify({ data: { repository } }));
    writeFileSync(join(bin, "runs.json"), JSON.stringify(runs.map(([workflowName, conclusion]) => ({ workflowName, conclusion, url: `https://github.com/o/r/actions/runs/${workflowName}-${conclusion}` }))));
    return fakeCommand(
      "gh",
      down
        ? `echo "error connecting to api.github.com" >&2; exit 1`
        : `if [ "$1" = api ]; then cat "${join(bin, "api.json")}"; else cat "${join(bin, "runs.json")}"; fi`,
      bin,
    );
  };

  const check = ({ bin }, cwd, hook = false) =>
    runHook("red-checks", hook ? { hook_event_name: "SessionStart", cwd, session_id: "s" } : undefined, {
      args: hook ? ["--hook"] : [],
      cwd,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });

  test("names each open PR whose checks failed and each workflow whose latest finished run on main failed", () => {
    const repo = checkout();
    const gh = redGh({
      prs: [[3, "FAILURE"], [4, "SUCCESS"], [5, "ERROR"], [6, "PENDING"], [7, null]],
      runs: [
        ["CI", "success"],
        ["CI", "failure"],
        ["Nightly", "cancelled"],
        ["Nightly", "timed_out"],
        ["Deploy", "skipped"],
        ["Deploy", "success"],
      ],
    });
    const ran = check(gh, repo, true);
    assert.equal(ran.status, 0, ran.stderr);
    assert.deepEqual(JSON.parse(ran.stdout), {
      systemMessage:
        'Red in o/r: open PR #3, #5 failed checks; main\'s latest Nightly run failed (https://github.com/o/r/actions/runs/Nightly-timed_out). "No red tests" (the global CLAUDE.md, Working with me) and "While an open PR in a repo is red" (the main-session message) apply.',
    });
    // the default branch's finished runs, from the repo origin names
    assert.match(readFileSync(gh.log, "utf8"), /^run list -R o\/r --branch main --status completed --limit 100 --json workflowName,conclusion,url$/m);
  });

  test("says nothing at session start when all is green, and so by hand", () => {
    const repo = checkout();
    const gh = redGh({ prs: [[4, "SUCCESS"]], runs: [["CI", "success"], ["CI", "failure"]] });
    const hooked = check(gh, repo, true);
    assert.equal(hooked.status, 0, hooked.stderr);
    assert.equal(hooked.stdout, "");
    assert.equal(check(gh, repo).stdout, "Nothing red in o/r.\n");
  });

  test("says nothing at session start when it can't ask GitHub, and why by hand", () => {
    const repo = checkout();
    const gh = redGh({ down: true });
    assert.equal(check(gh, repo, true).stdout, "");
    const byHand = check(gh, repo);
    assert.equal(byHand.status, 1);
    assert.equal(byHand.stderr, "red-checks: error connecting to api.github.com\n");
    // origin elsewhere: gh isn't asked
    const elsewhere = checkout();
    git(elsewhere, "remote", "set-url", "origin", "https://gitlab.com/o/r");
    const quiet = redGh({ prs: [[3, "FAILURE"]] });
    assert.equal(check(quiet, elsewhere, true).stdout, "");
    assert.equal(check(quiet, elsewhere).stderr, "red-checks: origin isn't on GitHub\n");
    assert.equal(existsSync(quiet.log), false);
  });
});

// catch-up.mjs at a session's start, in a scratch HOME (live())
describe("catch-up", () => {
  // the hook's run from a session in another folder, with `env` over the
  // test's; what it said (its systemMessage, or "")
  const start = ({ home }, env = {}) => {
    const ran = runHook("catch-up", { hook_event_name: "SessionStart", session_id: "s", cwd: scratchDir(), source: "startup" }, {
      env: { ...process.env, HOME: home, ...env },
    });
    assert.equal(ran.status, 0, ran.stderr);
    return ran.stdout.trim() ? JSON.parse(ran.stdout).systemMessage : "";
  };
  const head = (repo) => git(repo, "rev-parse", "HEAD");
  const status = (repo) => git(repo, "status", "--porcelain");
  const read = (repo, file) => readFileSync(join(repo, file), "utf8");
  const LEFT = (n) => new RegExp(String.raw`^~/\.dotfiles is ${n} commits? behind origin/main and was left as it is: `);

  test("behind: fast-forwards, and says so in one line; nothing to do: silent", () => {
    const state = live();
    const was = head(state.repo);
    state.merged("b.txt", "b2\n");
    const tip = state.merged("c.txt", "c\n");
    assert.equal(start(state), `~/.dotfiles caught up with origin/main: 2 commits, ${was.slice(0, 7)}..${tip.slice(0, 7)}.`);
    assert.equal(head(state.repo), tip);
    assert.equal(read(state.repo, "c.txt"), "c\n");
    assert.equal(status(state.repo), "");
    assert.equal(start(state), "", "nothing more to do");
  });

  // a machine stop soon after a merge left its files empty (2026-11-23),
  // as git flushes no working file: the merge's filesystem is synced once
  // it's done, and a sync that fails changes nothing else
  test("a merge is synced to disk (`sync -f` on ~/.dotfiles); nothing to do: no sync; a failing sync: still caught up", () => {
    const state = live();
    const { bin, log } = fakeCommand("sync", "");
    const PATH = `${bin}:${process.env.PATH}`;
    assert.equal(start(state, { PATH }), "");
    assert.ok(!existsSync(log), "nothing merged, nothing synced");
    state.merged("c.txt", "c\n");
    assert.match(start(state, { PATH }), /^~\/\.dotfiles caught up with origin\/main: 1 commit, /);
    assert.equal(readFileSync(log, "utf8"), `-f ${git(state.repo, "rev-parse", "--show-toplevel")}\n`);
    const tip = state.merged("d.txt", "d\n");
    const failing = fakeCommand("sync", "echo 'sync: error syncing' >&2; exit 1");
    assert.match(start(state, { PATH: `${failing.bin}:${process.env.PATH}` }), /^~\/\.dotfiles caught up with origin\/main: 1 commit, /);
    assert.equal(head(state.repo), tip);
  });

  // the catch-up makes home/.claude live, but a change to the Nix config
  // waits for `rebuild`, which the user may run long after the merge on
  // GitHub (review round 3 F9): the line names it when the range touches a
  // .nix file or flake.lock, and not otherwise
  test("a range touching the Nix config names `rebuild`; one touching only home/.claude doesn't", () => {
    const nix = live();
    const was = head(nix.repo);
    nix.merged("home.nix", "{ }\n");
    const tip = nix.merged("flake.lock", "{}\n");
    assert.equal(start(nix), `~/.dotfiles caught up with origin/main: 2 commits, ${was.slice(0, 7)}..${tip.slice(0, 7)}; flake.lock, home.nix changed: run \`rebuild\` to apply them.`);
    const claude = live();
    const before = head(claude.repo);
    mkdirSync(join(claude.dir, "other/home/.claude"), { recursive: true });
    const after = claude.merged("home/.claude/CLAUDE.md", "rules\n");
    assert.equal(start(claude), `~/.dotfiles caught up with origin/main: 1 commit, ${before.slice(0, 7)}..${after.slice(0, 7)}.`);
  });

  test("a skill folder added or removed names `rebuild`; an edit to one doesn't", () => {
    const state = live();
    const was = head(state.repo);
    mkdirSync(join(state.dir, "other/home/.claude/skills/old"), { recursive: true });
    const old = state.merged("home/.claude/skills/old/SKILL.md", "old\n");
    assert.equal(start(state), `~/.dotfiles caught up with origin/main: 1 commit, ${was.slice(0, 7)}..${old.slice(0, 7)}; home/.claude/skills/old added or removed: run \`rebuild\` to apply it.`);
    const edited = state.merged("home/.claude/skills/old/SKILL.md", "old, edited\n");
    assert.equal(start(state), `~/.dotfiles caught up with origin/main: 1 commit, ${old.slice(0, 7)}..${edited.slice(0, 7)}.`);
    mkdirSync(join(state.dir, "other/home/.claude/skills/new"), { recursive: true });
    state.merged("home/.claude/skills/new/SKILL.md", "new\n");
    state.merged("home/.claude/skills/old/SKILL.md", null);
    const tip = state.merged("home.nix", "{ }\n");
    assert.equal(start(state), `~/.dotfiles caught up with origin/main: 3 commits, ${edited.slice(0, 7)}..${tip.slice(0, 7)}; home.nix changed, and home/.claude/skills/new, home/.claude/skills/old added or removed: run \`rebuild\` to apply them.`);
  });

  // the user's own save (/model) that a PR then landed: git refuses a
  // fast-forward over a dirty file even when it equals the incoming one
  test("a dirty file equal to origin's, an untracked one origin adds, and one origin deletes: staged, then fast-forwarded", () => {
    const state = live();
    state.merged("b.txt", "b2\n");
    state.merged("new.txt", "new\n");
    const tip = state.merged("a.txt", null);
    writeFileSync(join(state.repo, "b.txt"), "b2\n");
    writeFileSync(join(state.repo, "new.txt"), "new\n");
    rmSync(join(state.repo, "a.txt"));
    writeFileSync(join(state.repo, "mine.txt"), "mine\n"); // the user's, which origin knows nothing of
    assert.match(start(state), /^~\/\.dotfiles caught up with origin\/main: 3 commits, \w{7}\.\.\w{7} \(3 uncommitted files there already matched it\)\.$/);
    assert.equal(head(state.repo), tip);
    assert.equal(status(state.repo), "?? mine.txt");
  });

  // one file in the way leaves all of it: nothing staged, nothing moved
  test("a dirty file that differs from origin's: everything left as it was, and named", () => {
    const state = live();
    state.merged("a.txt", "a2\n");
    state.merged("b.txt", "b2\n");
    const was = head(state.repo);
    writeFileSync(join(state.repo, "a.txt"), "a2\n"); // equal
    writeFileSync(join(state.repo, "b.txt"), "mine\n"); // differs
    assert.match(start(state), new RegExp(LEFT(2).source + "b\\.txt changed here and on origin/main differently"));
    assert.equal(head(state.repo), was);
    assert.equal(read(state.repo, "b.txt"), "mine\n");
    assert.equal(git(state.repo, "diff", "--cached", "--name-only"), "", "nothing staged");
    assert.equal(git(state.repo, "diff", "--name-only"), "a.txt\nb.txt");
  });

  // staging the working file would lose a third version, staged on purpose
  test("a staged version that's neither HEAD's nor origin's: left as it was, and named", () => {
    const state = live();
    state.merged("b.txt", "b2\n");
    writeFileSync(join(state.repo, "b.txt"), "staged\n");
    git(state.repo, "add", "b.txt");
    writeFileSync(join(state.repo, "b.txt"), "b2\n");
    assert.match(start(state), new RegExp(LEFT(1).source + "b\\.txt changed here"));
    assert.equal(git(state.repo, "show", ":b.txt"), "staged");
    // staged, its working copy then put back as HEAD has it
    writeFileSync(join(state.repo, "b.txt"), "b\n");
    assert.match(start(state), new RegExp(LEFT(1).source + "b\\.txt changed here"));
    assert.equal(git(state.repo, "show", ":b.txt"), "staged");
  });

  test("off main, or diverged: left as it is, and named", () => {
    const off = live();
    git(off.repo, "switch", "-qc", "other");
    const was = head(off.repo);
    off.merged("c.txt", "c\n");
    assert.match(start(off), new RegExp(LEFT(1).source + "it's on other, not main"));
    assert.equal(head(off.repo), was);
    git(off.repo, "switch", "-q", "--detach");
    assert.match(start(off), /it's on a detached HEAD, not main/);

    const diverged = live();
    commit(diverged.repo, "d.txt", "d\n");
    const mine = head(diverged.repo);
    diverged.merged("c.txt", "c\n");
    assert.match(start(diverged), new RegExp(LEFT(1).source + "it has 1 commit origin/main lacks"));
    assert.equal(head(diverged.repo), mine);
  });

  test("no ~/.dotfiles: silent", () => {
    const state = live({ dotfiles: false });
    state.merged("c.txt", "c\n");
    assert.equal(start(state), "");
  });

  // offline (or a fetch beside prune-merged's): it catches up to what an
  // earlier fetch brought, as far as that goes
  test("a fetch that fails: catches up to what was fetched before", () => {
    const state = live();
    const tip = state.merged("c.txt", "c\n");
    git(state.repo, "fetch", "-q", "origin");
    renameSync(state.origin, `${state.origin}-gone`);
    assert.match(start(state), /^~\/\.dotfiles caught up with origin\/main: 1 commit, /);
    assert.equal(head(state.repo), tip);
  });

  // two session starts at once: the second leaves it to the first; a dead
  // run's lock is taken over
  test("one run at a time: a live run's lock holds, a dead run's is taken over", () => {
    const state = live();
    const was = head(state.repo);
    state.merged("c.txt", "c\n");
    const held = join(state.repo, ".git/claude/catch-up.lock");
    mkdirSync(held, { recursive: true });
    writeFileSync(join(held, "pid"), String(process.pid));
    assert.equal(start(state), "");
    assert.equal(head(state.repo), was);
    writeFileSync(join(held, "pid"), String(spawnSync("true").pid));
    assert.match(start(state), /caught up/);
    assert.ok(!existsSync(held));
  });

  // what a merge killed partway leaves (Claude Code kills an async hook at
  // its timeout): git's index.lock and a tree half new, or (killed after
  // the index was written, before the ref moved) the new tree and index
  // with HEAD unmoved. The first is named and left; once the lock is gone,
  // and in the second, the next run finishes the fast-forward
  test("a merge cut short: a stale index.lock is named and left; the next run finishes it", () => {
    const locked = live();
    const was = head(locked.repo);
    const tip = locked.merged("b.txt", "b2\n");
    git(locked.repo, "fetch", "-q", "origin");
    writeFileSync(join(locked.repo, "b.txt"), "b2\n"); // written before the kill
    const lockFile = join(locked.repo, ".git/index.lock");
    writeFileSync(lockFile, "");
    assert.match(start(locked), new RegExp(LEFT(1).source + `${lockFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} is there`));
    assert.ok(existsSync(lockFile));
    assert.equal(head(locked.repo), was);
    rmSync(lockFile);
    assert.match(start(locked), /caught up/);
    assert.equal(head(locked.repo), tip);
    assert.equal(status(locked.repo), "");

    const indexed = live();
    const tip2 = indexed.merged("c.txt", "c\n");
    git(indexed.repo, "fetch", "-q", "origin");
    git(indexed.repo, "read-tree", "-m", "-u", "HEAD", "origin/main");
    assert.match(start(indexed), /caught up/);
    assert.equal(head(indexed.repo), tip2);
    assert.equal(status(indexed.repo), "");
  });
});

// usage.mjs: the ledger of tokens spent, recorded at each stop (in a
// scratch HOME), and its reports
describe("usage", () => {
  const now = new Date().toISOString();
  // an assistant message's lines: one per content block, the same id and usage
  const said = (id, cacheRead, { blocks = 1, model = "claude-opus-5-5" } = {}) =>
    Array.from({ length: blocks }, () => ({
      type: "assistant",
      timestamp: now,
      message: { id, model, usage: { input_tokens: 1, cache_read_input_tokens: cacheRead, cache_creation_input_tokens: 10, output_tokens: 5 } },
    }));
  const jsonl = (entries) => entries.map((entry) => JSON.stringify(entry) + "\n").join("");
  const scratch = () => {
    const home = scratchDir();
    const project = join(home, ".claude/projects/p");
    mkdirSync(join(project, "s1/subagents"), { recursive: true });
    const run = (args, input, options) => runHook("usage", input, { args, env: { ...process.env, HOME: home }, ...options });
    const ledger = () => lines(readFileSync(join(home, ".claude/usage/ledger.jsonl"), "utf8")).map((line) => JSON.parse(line));
    // --agent's first line; the breakdown after it has a test of its own
    const tokensOf = (id) => run(["--agent", id]).stdout.split("\n")[0];
    // an agent's transcript and meta.json, and its stop
    const agent = (id, entries, meta, type = "general-purpose") => {
      const transcript = join(project, `s1/subagents/agent-${id}.jsonl`);
      appendFileSync(transcript, typeof entries === "string" ? entries : jsonl(entries));
      if (meta) writeFileSync(transcript.replace(/\.jsonl$/, ".meta.json"), JSON.stringify(meta));
      return run(["--hook"], {
        hook_event_name: "SubagentStop",
        session_id: "s1",
        cwd: "/w/repo",
        agent_id: id,
        agent_type: type,
        agent_transcript_path: transcript,
        effort: { level: "high" },
        last_assistant_message: "a reply the ledger never keeps",
      });
    };
    const session = (id, entries) => {
      const transcript = join(project, `${id}.jsonl`);
      appendFileSync(transcript, typeof entries === "string" ? entries : jsonl(entries));
      return run(["--hook"], { hook_event_name: "Stop", session_id: id, cwd: "/w/repo", transcript_path: transcript });
    };
    // the plan's windows as a status line's input gives them: each window's
    // used % and when it resets, in hours from the suite's `now`, so two
    // readings of one window give the same second
    const windows = (week, fiveHour) => {
      const window = ([used_percentage, hours]) => ({ used_percentage, resets_at: Math.round(Date.parse(now) / 1000 + hours * 3600) });
      return run(["--status"], { rate_limits: { ...(week && { seven_day: window(week) }), ...(fiveHour && { five_hour: window(fiveHour) }) } });
    };
    const readings = () => {
      const file = join(home, ".claude/usage/windows.jsonl");
      return existsSync(file) ? lines(readFileSync(file, "utf8")).map((line) => JSON.parse(line)) : [];
    };
    // gh on PATH (fakeCommand, in HOME/bin), then a run of usage
    const gh = (body) => {
      const { bin } = fakeCommand("gh", body, join(home, "bin"));
      return (args) => run(args, undefined, { env: { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}` } });
    };
    return { home, run, ledger, tokensOf, agent, session, windows, readings, gh };
  };

  test("--hook: a row per message once, only what's new at each stop, and the agent's place", () => {
    const { ledger, agent } = scratch();
    const meta = { agentType: "general-purpose", description: "Fix issue 1", spawnDepth: 1 };
    assert.equal(agent("a1", [{ type: "user", message: { content: "a prompt the ledger never keeps" } }, ...said("m1", 100, { blocks: 3 })], meta).status, 0);
    // stopped again: m2, and m3's first line half written
    const half = JSON.stringify(said("m3", 300)[0]);
    agent("a1", jsonl(said("m2", 200)) + half.slice(0, 20));
    // done: the rest of m3's line
    agent("a1", half.slice(20) + "\n");
    const rows = ledger();
    assert.deepEqual(
      rows.filter((row) => row.kind === "message").map((row) => [row.id, row.agent, row.cacheRead]),
      [["m1", "a1", 100], ["m2", "a1", 200], ["m3", "a1", 300]],
    );
    const stops = rows.filter((row) => row.kind === "agent");
    assert.equal(stops.length, 3);
    assert.deepEqual(
      { ...stops[0], at: undefined, load: undefined },
      { kind: "agent", at: undefined, session: "s1", agent: "a1", parent: null, depth: 1, type: "general-purpose", description: "Fix issue 1", effort: "high", cwd: "/w/repo", load: undefined },
    );
    // the machine's load at each stop, and the agent's whole profile so far
    assert.ok(stops.every((stop) => typeof stop.load === "number"));
    assert.deepEqual(
      rows.filter((row) => row.kind === "steps").map((row) => [row.agent, row.steps]),
      [["a1", 1], ["a1", 2], ["a1", 3]],
    );
    assert.doesNotMatch(JSON.stringify(rows), /never keeps/);
  });

  // plan review F10: session 3d4158ee's transcript gained a line of 2,030
  // NULs (2026-11-23), and every stop after it failed on that line
  test("--hook: a line it can't read is skipped and counted, and the stops after it record", () => {
    const { ledger, agent, session } = scratch();
    session("s1", said("m1", 100));
    const nul = "\0".repeat(2030) + "\n";
    session("s1", nul + jsonl(said("m2", 200)));
    session("s1", said("m3", 300));
    agent("a1", nul + jsonl(said("m4", 400)), { description: "Fix issue 1", spawnDepth: 1 });
    const rows = ledger();
    assert.deepEqual(rows.filter((row) => row.kind === "message").map((row) => row.id), ["m1", "m2", "m3", "m4"]);
    assert.deepEqual(
      rows.filter((row) => row.kind === "agent" || row.kind === "session").map((row) => [row.kind, row.unreadable]),
      [["session", undefined], ["session", 1], ["session", undefined], ["agent", 1]],
    );
  });

  // a builder's tree: its steps `minutes` from now, each rereading
  // `cacheRead` tokens and calling one tool; its stops come after them all
  const minutes = (n) => new Date(Date.now() + n * 60_000).toISOString();
  const stepped = (id, minute, cacheRead, call) => ({
    type: "assistant",
    timestamp: minutes(minute),
    message: {
      id,
      model: "claude-opus-5-5",
      usage: { input_tokens: 0, cache_read_input_tokens: cacheRead, cache_creation_input_tokens: 0, output_tokens: 0 },
      content: call ? [{ type: "tool_use", id: `${id}-0`, name: call[0], input: call[1] }] : [{ type: "text", text: "done" }],
    },
  });
  // a1 at 5k a step: a read, a plan review, an edit, round 1, its reply;
  // r1 (10k) began in its plan review and r2 (20k) in its review; x1 has
  // no steps row
  const tree = () => {
    const ran = scratch();
    const reviewer = { subagent_type: "change-reviewer" };
    ran.agent("r1", [stepped("r1m", -28, 200_000)], { description: "Plan review", spawnDepth: 2, parentAgentId: "a1" }, "change-reviewer");
    ran.agent("r2", [stepped("r2m", -9, 400_000)], { description: "Round 1 review", spawnDepth: 2, parentAgentId: "a1" }, "change-reviewer");
    ran.agent(
      "a1",
      [
        stepped("m1", -30, 100_000, ["Read", { file_path: "/a" }]),
        stepped("m2", -29, 100_000, ["Agent", reviewer]),
        stepped("m3", -20, 100_000, ["Edit", { file_path: "/repo/x.ts" }]),
        stepped("m4", -10, 100_000, ["Agent", reviewer]),
        stepped("m5", -1, 100_000),
      ],
      { description: "Fix issue 1", spawnDepth: 1 },
      "builder",
    );
    appendFileSync(join(ran.home, ".claude/usage/ledger.jsonl"), JSON.stringify({ kind: "agent", at: now, session: "s1", agent: "x1", parent: "a1", type: "Explore" }) + "\n");
    return ran;
  };

  test("--agent: the Tokens line, then where it went by stage, agent and kind, with the load at its stops", () => {
    const { run } = tree();
    const ran = run(["--agent", "a1"]);
    assert.equal(ran.status, 0, ran.stderr);
    const [tokens, ...where] = ran.stdout.trimEnd().split("\n");
    assert.match(tokens, /^Tokens: .*\(this agent and the 2 it started\)/);
    assert.equal(where[0], "Where it went (this agent and the 3 below it; weighted tokens, as usage.mjs's header says):");
    assert.match(where[1], new RegExp(`^- Time: 29m start to end: the model 1m, tools 0s, waiting 0s, 0 compactions 0s\\. Machine load [\\d.]+ on average, [\\d.]+ at most, on ${availableParallelism()} cores \\(3 stops sampled\\)\\.$`));
    // of 55k: survey 5k, plan review 5k + r1's 10k, build 5k, review 10k + r2's 20k
    assert.deepEqual(where.slice(2), [
      "- By stage: survey 9%, plan review 27%, build 9%, review 55%.",
      "- By agent: itself 45% (5 steps), change-reviewer ×2 55%.",
      "- Its own steps by kind, share of its cost (steps): agents 40% (2), reading 20% (1), edits 20% (1), replies 20% (1).",
      "- Its cost by what it reread or wrote: its start 100%.",
      "- Single reads: 20% of its steps (one call that reads; builders were 47% in the 2026-11-22 usage audit, before the change skill asked for a step's reads in one turn).",
      `${docsRead}none.`,
      "- Not counted: 1 agent below it with no steps recorded (x1).",
    ]);
  });

  const docsRead = "- Docs read (Markdown outside a git dir and /tmp; in, then reread at each later step up to a compaction, share of the cost): ";

  test("--agent: the Markdown it and each type below it read, in, reread and their share of the cost", () => {
    const { run, agent } = scratch();
    const inRepo = (row) => ({ ...row, cwd: "/w/repo" });
    const text = (id, minute, chars) => ({ type: "user", timestamp: minutes(minute), message: { content: [{ type: "tool_result", tool_use_id: `${id}-0`, content: "x".repeat(chars) }] } });
    // r1 greps the log: 27,000 characters, 10k tokens, held 500 of its 10,500
    agent(
      "r1",
      [inRepo(stepped("r1a", -20, 100_000, ["Grep", { pattern: "Home", path: "docs/ux-log.md" }])), text("r1a", -19, 27_000), inRepo(stepped("r1b", -18, 110_000))],
      { description: "UX review", spawnDepth: 2, parentAgentId: "d1" },
      "ux-reviewer",
    );
    // d1 reads ux.md (54,000 characters, held 1,000 at each of 2 steps, of
    // 17,050) and its own survey, which isn't a doc
    agent(
      "d1",
      [
        inRepo(stepped("m1", -30, 100_000, ["Read", { file_path: "/w/repo/docs/ux.md" }])),
        text("m1", -29, 54_000),
        inRepo(stepped("m2", -28, 120_000, ["Read", { file_path: "/w/repo/.git/claude/survey-x.md" }])),
        text("m2", -27, 2_700),
        inRepo(stepped("m3", -26, 121_000)),
      ],
      { description: "Fix issue 1", spawnDepth: 1 },
      "builder",
    );
    const ran = run(["--agent", "d1"]);
    assert.equal(ran.status, 0, ran.stderr);
    assert.ok(
      ran.stdout.split("\n").includes(`${docsRead}itself 54KB in, 108KB reread, 12% (docs/ux.md 54KB); ux-reviewer ×1 27KB in, 27KB reread, 5% (docs/ux-log.md 27KB).`),
      ran.stdout,
    );
  });

  // a finished agent's report reaches the main session by itself: a
  // background agent's on its notification, a foreground one's on its
  // call's return (plan review F5)
  test("--hook in the main session: a finished agent's report on its notification or its call's return, and nothing else", () => {
    const { run } = tree();
    const said = (input) => {
      const ran = run(["--hook"], { session_id: "s1", cwd: "/w/repo", ...input });
      assert.equal(ran.status, 0, ran.stderr);
      return ran.stdout ? JSON.parse(ran.stdout).hookSpecificOutput : null;
    };
    const notified = said({ hook_event_name: "UserPromptSubmit", prompt: "<task-notification>\n<task-id>a1</task-id>\n<status>completed</status>\n</task-notification>" });
    assert.equal(notified.hookEventName, "UserPromptSubmit");
    assert.match(notified.additionalContext, /^Agent a1 finished \(Fix issue 1\)\. Measured by the usage\.mjs hook from its ledger, for the update \(nothing to run\):\nTokens: .*\nWhere it went \(this agent and the 3 below it/);
    const returned = said({ hook_event_name: "PostToolUse", tool_name: "Agent", tool_response: { status: "completed", agentId: "r2", content: [] } });
    assert.equal(returned.hookEventName, "PostToolUse");
    assert.match(returned.additionalContext, /^Agent r2 finished \(Round 1 review\)\. Measured by the usage\.mjs hook from its ledger, for the update \(nothing to run\):\nTokens: .*\nWhere it went \(this agent;/);
    for (const input of [
      // in an agent: its reviewers' reports would sit in its context
      { hook_event_name: "PostToolUse", agent_id: "a1", tool_name: "Agent", tool_response: { status: "completed", agentId: "r2" } },
      // a background agent's launch, and a typed prompt
      { hook_event_name: "PostToolUse", tool_name: "Agent", tool_response: { status: "async_launched", agentId: "r2" } },
      { hook_event_name: "UserPromptSubmit", prompt: "what did <task-id>a1</task-id> cost?" },
      // a shell's notification: no agent of that id
      { hook_event_name: "UserPromptSubmit", prompt: "<task-notification><task-id>b7</task-id></task-notification>" },
    ])
      assert.equal(said(input), null, JSON.stringify(input));
  });

  // each line is what settings.json's jq one-liner printed for that input,
  // run under bash before --status replaced it (2026-11-11)
  test("--status: the status line the jq one-liner printed, input by input", () => {
    const { run } = scratch();
    const context = (used_percentage, total_input_tokens, total_output_tokens) => ({
      model: { id: "claude-opus-5-5", display_name: "Opus 5.5" },
      context_window: { used_percentage, total_input_tokens, total_output_tokens },
    });
    const line = (model, used, tokens) => `\x1b[36m${model}\x1b[0m | ctx: ${used}% | tokens: ${tokens}`;
    for (const [input, stdout, status = 0] of [
      // a real input's fields (Claude Code 2.1.308)
      [
        {
          model: { id: "claude-haiku-5-5", display_name: "Haiku 5.5" },
          context_window: { total_input_tokens: 47233, total_output_tokens: 4, context_window_size: 1000000, used_percentage: 5, remaining_percentage: 95 },
        },
        line("Haiku 5.5", 5, 47237),
      ],
      // a session's first input, before any reply
      [{ model: { display_name: "Haiku 5.5" }, context_window: { total_input_tokens: 0, total_output_tokens: 0, used_percentage: null } }, line("Haiku 5.5", 0, 0)],
      [{ model: {}, context_window: { used_percentage: null } }, line("unknown", 0, 0)],
      [{}, line("unknown", 0, 0)],
      [context(41.7, 1200, 345), line("Opus 5.5", 42, 1545)],
      [context(2.49, 1, 1), line("Opus 5.5", 2, 2)],
      // a half goes to the even number
      [context(0.5, 1, 1), line("Opus 5.5", 0, 2)],
      [context(2.5, 1, 1), line("Opus 5.5", 2, 2)],
      [context(3.5, 1, 1), line("Opus 5.5", 4, 2)],
      [context(100, 1234567, 7654321), line("Opus 5.5", 100, 8888888)],
      ["", line("", 0, ""), 1],
      ["not json", line("", 0, ""), 1],
    ]) {
      // text goes in as it is: stdin that isn't JSON
      const ran = typeof input === "string" ? run(["--status"], undefined, { input }) : run(["--status"], input);
      assert.equal(ran.stdout, stdout, JSON.stringify(input));
      assert.equal(ran.status, status, JSON.stringify(input));
    }
  });

  test("--status: each reading of the plan's windows that differs from the last is kept, and a save that fails still prints", () => {
    const { home, run, readings } = scratch();
    const limits = (used, resets_at = 1794389400) => ({ five_hour: { used_percentage: used, resets_at }, seven_day: { used_percentage: 71, resets_at: 1794740400 } });
    // a session's first input has no windows yet
    run(["--status"], { model: { display_name: "Opus 5.5" } });
    assert.deepEqual(readings(), []);
    run(["--status"], { rate_limits: limits(2) });
    run(["--status"], { rate_limits: limits(2) });
    run(["--status"], { rate_limits: limits(3) });
    run(["--status"], { rate_limits: { five_hour: { used_percentage: 4, resets_at: 1794389400 } } });
    assert.deepEqual(
      readings().map(({ at, ...row }) => row),
      [
        { seven_day: { used: 71, resetsAt: 1794740400 }, five_hour: { used: 2, resetsAt: 1794389400 } },
        { seven_day: { used: 71, resetsAt: 1794740400 }, five_hour: { used: 3, resetsAt: 1794389400 } },
        { five_hour: { used: 4, resetsAt: 1794389400 } },
      ],
    );
    // a last row cut short is no reason to stop keeping them
    appendFileSync(join(home, ".claude/usage/windows.jsonl"), '{"at":"2026-11-11T0\n');
    run(["--status"], { rate_limits: limits(5) });
    assert.equal(lines(readFileSync(join(home, ".claude/usage/windows.jsonl"), "utf8")).length, 5);
    // nowhere to save: the line is printed all the same
    const nowhere = scratchDir();
    writeFileSync(join(nowhere, ".claude"), "a file where the folder would go");
    const ran = runHook("usage", { model: { display_name: "Opus 5.5" }, rate_limits: limits(6) }, { args: ["--status"], env: { ...process.env, HOME: nowhere } });
    assert.equal(ran.stdout, "\x1b[36mOpus 5.5\x1b[0m | ctx: 0% | tokens: 0");
    assert.equal(ran.status, 0, ran.stderr);
  });

  test("--agent: the Tokens line is the workstream's share of each window, by what its tokens cost", () => {
    const { agent, windows, tokensOf } = scratch();
    // a1's workstream: 6M of the 15M cache read, the rest alike message by message
    agent("a1", said("m1", 1_000_000), { description: "Fix issue 1", spawnDepth: 1 });
    agent("r1", said("m2", 2_000_000), { description: "Round 1 review", spawnDepth: 2, parentAgentId: "a1" });
    agent("x1", said("m3", 3_000_000), { description: "Explore", spawnDepth: 3, parentAgentId: "r1" });
    agent("b1", said("m4", 9_000_000), { description: "Fix issue 2", spawnDepth: 1 });
    agent("c1", said("m5", 100), { description: "A look", spawnDepth: 1 });
    windows([50, 100], [20, 2]);
    // an idle session's older reading of the same windows, and one of a week since reset
    windows([40, 100], [10, 2]);
    windows([99, -1]);
    assert.equal(tokensOf("a1"), "Tokens: about 20% of the week, about 8.0% of this 5-hour window (this agent and the 2 it started)");
    assert.equal(tokensOf("b1"), "Tokens: about 30% of the week, about 12% of this 5-hour window (this agent)");
    assert.equal(tokensOf("c1"), "Tokens: under 0.1% of the week, under 0.1% of this 5-hour window (this agent)");
    // a 5-hour window that began after the work
    windows(null, [1, 5.5]);
    assert.equal(tokensOf("a1"), "Tokens: about 20% of the week, none of this 5-hour window (this agent and the 2 it started)");
  });

  test("--agent: a window with no reading, or one that has reset, is left out and the line says why", () => {
    const { agent, windows, tokensOf } = scratch();
    agent("a1", said("m1", 1_000_000), { description: "Fix issue 1", spawnDepth: 1 });
    windows([50, 100]);
    assert.equal(tokensOf("a1"), "Tokens: about 50% of the week (this agent); no reading of this 5-hour window yet");
    windows(null, [20, -1]);
    assert.equal(tokensOf("a1"), "Tokens: about 50% of the week (this agent); this 5-hour window has reset since its last reading");
  });

  test("--agent: with no window to go by, the Tokens line sums the agent and every agent below it, and only them", () => {
    const { run, agent } = scratch();
    agent("a1", said("m1", 1_000_000), { description: "Fix issue 1", spawnDepth: 1 });
    agent("r1", said("m2", 2_000_000), { description: "Round 1 review", spawnDepth: 2, parentAgentId: "a1" });
    agent("x1", said("m3", 3_000_000), { description: "Explore", spawnDepth: 3, parentAgentId: "r1" });
    agent("b1", said("m4", 9_000_000), { description: "Fix issue 2", spawnDepth: 1 });
    // progress summaries (round 2 F12): two while r1 ran, one while only b1 did
    const running = (...ids) => ids.map((id) => ({ id, type: "subagent", status: "running", description: "x" }));
    const fork = (agent_id, background_tasks) =>
      run(["--hook"], { hook_event_name: "SubagentStop", session_id: "s1", agent_id, agent_type: "", agent_transcript_path: "/nowhere", background_tasks });
    fork("f1", [...running("r1", "b1"), { id: "c1", type: "shell", status: "running", description: "a command" }]);
    fork("f2", running("r1"));
    fork("f3", running("b1"));
    const ran = run(["--agent", "a1"]);
    assert.equal(ran.status, 0, ran.stderr);
    assert.equal(
      ran.stdout.split("\n")[0],
      "Tokens: 6.0M cache read, 30 cache write, 15 output, 3 input over 3 turns (this agent and the 2 it started); " +
        "no reading of the week yet; no reading of this 5-hour window yet; " +
        "not counted: up to 2 progress summaries Claude Code forked while it ran",
    );
    assert.match(run(["--agent", "b1"]).stdout, /; not counted: up to 2 progress summaries/);
    assert.match(run(["--agent", "x1"]).stdout, /^Tokens: 3\.0M cache read.* over 1 turn \(this agent\); no reading of the week yet/m);
    const none = run(["--agent", "zz"]);
    assert.equal(none.status, 1);
    assert.equal(none.stdout, "No usage recorded for agent zz.\n");
  });

  // a resumed session's transcript repeats the earlier one's messages
  // a main session's cache write is weighed as 1-hour, an agent's as 5-minute: 81 = 700 × 0.05 + 10 × 2 + 5 × 5 + 1
  test("--since: each workstream and main session, weighted, a message in two transcripts counted once", () => {
    const { run, agent, session } = scratch();
    session("s1", said("m1", 500));
    session("s2", [...said("m1", 500), ...said("m2", 700)]);
    agent("a1", said("m3", 100), { description: "Fix issue 1", spawnDepth: 1 });
    agent("r1", said("m4", 50), { description: "Round 1 review", spawnDepth: 2, parentAgentId: "a1" });
    const ran = run([]);
    assert.equal(ran.status, 0, ran.stderr);
    const table = ran.stdout.split("\n").map((line) => line.split(/\s{2,}/));
    assert.deepEqual(table[1], ["", "turns", "cache read", "cache write", "output", "input", "weighted", "agents"]);
    assert.deepEqual(table[2], ["Fix issue 1", "2", "150", "20", "10", "2", "84.5", "2"]);
    assert.deepEqual(table[3], ["main s2 repo", "1", "700", "10", "5", "1", "81", ""]);
    assert.deepEqual(table[4], ["main s1 repo", "1", "500", "10", "5", "1", "71", ""]);
    assert.deepEqual(table[5], ["total", "4", "1k", "40", "20", "4", "236.5", ""]);
    assert.match(run(["--since", "2999-01-01"]).stdout, /^total {2,}0 /m);
  });

  // round 1 F11: Claude Code's progress summary of a busy background agent
  // stops as an agent with no type and no transcript (seen live)
  test("a progress summary's stop is a fork row, counted apart; a failed recording an error row", () => {
    const { run, ledger } = scratch();
    const stop = { hook_event_name: "SubagentStop", session_id: "s1", agent_transcript_path: "/nowhere/agent-a9.jsonl" };
    run(["--hook"], { ...stop, agent_id: "f1", agent_type: "", last_assistant_message: "Running step 1" });
    run(["--hook"], { ...stop, agent_id: "a9", agent_type: "general-purpose" });
    const [fork, error] = ledger();
    assert.deepEqual({ ...fork, at: undefined }, { kind: "fork", at: undefined, session: "s1", agent: "f1", running: [] });
    assert.deepEqual([error.kind, error.agent, error.event, error.type], ["error", "a9", "SubagentStop", "general-purpose"]);
    assert.match(error.error, /ENOENT/);
    const report = run([]).stdout;
    assert.match(report, /^Not counted: 1 progress summary Claude Code forked from background agents, whose tokens no transcript holds\.$/m);
    assert.match(report, /^1 recording failed: the ledger's "error" rows say why\.$/m);
  });


  // a message with its cache write split between the 5-minute and 1-hour caches
  const wrote = (id, { cacheRead = 0, fiveMinute = 0, oneHour = 0 }) => ({
    type: "assistant",
    timestamp: now,
    message: {
      id,
      model: "claude-opus-5-5",
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: cacheRead,
        cache_creation_input_tokens: fiveMinute + oneHour,
        cache_creation: { ephemeral_5m_input_tokens: fiveMinute, ephemeral_1h_input_tokens: oneHour },
      },
    },
  });
  const compacted = (uuid, trigger, preTokens) => ({ type: "system", subtype: "compact_boundary", uuid, timestamp: now, compactMetadata: { trigger, preTokens } });
  const day = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("sv");
  };

  test("--hook: a message's 1-hour cache write, and a row per compaction", () => {
    const { ledger, session } = scratch();
    session("s1", [wrote("m1", { fiveMinute: 3, oneHour: 7 }), compacted("c1", "auto", 268_000), ...said("m2", 5)]);
    const rows = ledger().filter((row) => row.kind !== "session");
    assert.deepEqual(
      rows.map((row) => [row.kind, row.id, row.cacheWrite, row.cacheWrite1h, row.trigger, row.preTokens]),
      [
        ["message", "m1", 10, 7, undefined, undefined],
        ["compact", "c1", undefined, undefined, "auto", 268_000],
        ["message", "m2", 10, undefined, undefined, undefined],
      ],
    );
  });

  test("--week: the week's measures beside the week before's, each message weighed by its cache", () => {
    const { agent, session, windows, gh, home } = scratch();
    // main: 1M cache read and 100k 1-hour writes, 250k weighted; a1 175k with 5-minute writes; b1's row
    // has no split (recorded before it), so as an agent's its writes are 5-minute: 125k
    session("s1", [wrote("m1", { cacheRead: 1_000_000, oneHour: 100_000 }), compacted("c1", "manual", 100_000)]);
    session("s2", [compacted("c1", "manual", 100_000)]);
    agent("a1", [wrote("m2", { cacheRead: 1_000_000, fiveMinute: 100_000 }), compacted("c2", "auto", 268_000)], { description: "Round 1 review", spawnDepth: 1 }, "change-reviewer");
    agent("b1", [{ ...said("m3", 0)[0], message: { id: "m3", model: "claude-opus-5-5", usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 100_000 } } }, compacted("c3", "auto", 270_000)], { description: "Fix issue 1", spawnDepth: 1 });
    windows([50, 100]);
    const week = gh(`echo '[{"repository":{"nameWithOwner":"o/a"}},{"repository":{"nameWithOwner":"o/a"}},{"repository":{"nameWithOwner":"o/b"}}]'`);
    const ran = week(["--week", "--since", day(-6)]);
    assert.equal(ran.status, 0, ran.stderr);
    const cells = Object.fromEntries(ran.stdout.split("\n").map((line) => line.trim().split(/\s{2,}/)).filter((cells) => cells.length === 3).map(([name, ...rest]) => [name, rest]));
    assert.deepEqual(cells["weighted tokens"], ["550k", "0"]);
    assert.deepEqual(cells["main sessions' share"], ["45.5%", "-"]);
    assert.deepEqual(cells["main context per turn: mean"], ["1.1M", "-"]);
    assert.deepEqual(cells["agents per active day"], ["2.0", "-"]);
    assert.deepEqual(cells["auto-compactions (in agents)"], ["2 (2)", "0 (0)"]);
    assert.deepEqual(cells["context compacted, median"], ["270k", "-"]);
    assert.deepEqual(cells["merged PRs"], ["3", "3"]);
    assert.deepEqual(cells["weighted per merged PR"], ["183k", "0"]);
    assert.match(ran.stdout, /^Merged PRs: o\/a 2, o\/b 1$/m);
    assert.match(ran.stdout, /^ {2}main s1 repo {2,}250k {2,}45\.5%$/m);
    assert.match(ran.stdout, /^ {2}change-reviewer {2,}175k {2,}31\.8% {2,}1$/m);
    // each agent type's steps: a1's one step at 175k, no single read, one compaction, no docs read
    assert.match(ran.stdout, /^ {2}change-reviewer {2,}1 {2,}1 {2,}175k {2,}0\.0% {2,}1\.0 {2,}[\d.]+ {2,}0KB {2,}0\.0%$/m);
    assert.match(ran.stdout, /^ {2}to .*: 50% at .*; 550k weighted by then, about 11k per 1% \(began before the ledger: reads low\)$/m);
    // gh asked for the account's PRs merged in each week, to the second before it ends
    const from = new Date(`${day(-6)}T00:00`);
    const at = (date) => date.toISOString().replace(/\.\d+Z$/, "Z");
    const asked = lines(readFileSync(join(home, "bin", "gh-args"), "utf8"));
    assert.equal(asked[0], `search prs --author=@me --merged-at ${at(from)}..${at(new Date(from.getTime() + 7 * 24 * 3600 * 1000 - 1000))} --limit 1000 --json repository`);
    // gh failing says why, and the rest still prints
    const failing = gh("echo 'not logged in' >&2; exit 1")(["--week", "--since", day(-6)]);
    assert.equal(failing.status, 0, failing.stderr);
    assert.match(failing.stdout, /^Merged PRs: gh couldn't say: not logged in$/m);
    assert.match(failing.stdout, /^weighted per merged PR {2,}- {2,}-$/m);
  });

  // usage.mjs and the modules it imports in a dotfiles-shaped tree, whose
  // docs/token-review.md is the log the hook reads
  test("--hook at SessionStart: says once a week, at a main session's startup, that the review is due", () => {
    const home = scratchDir();
    const tree = scratchDir();
    mkdirSync(join(tree, "home/.claude/hooks"), { recursive: true });
    mkdirSync(join(tree, "docs"));
    for (const name of ["usage", "lib", "steps"]) copyFileSync(join(HOOKS, `${name}.mjs`), join(tree, `home/.claude/hooks/${name}.mjs`));
    const log = join(tree, "docs/token-review.md");
    const offered = join(home, ".claude/usage/review-offered");
    const start = (input = {}) =>
      spawnSync(process.execPath, [join(tree, "home/.claude/hooks/usage.mjs"), "--hook"], {
        input: JSON.stringify({ hook_event_name: "SessionStart", session_id: "s", cwd: tree, source: "startup", ...input }),
        encoding: "utf8",
        env: { ...process.env, HOME: home },
      });
    const said = (ran) => (ran.stdout ? JSON.parse(ran.stdout).hookSpecificOutput.additionalContext : "");
    writeFileSync(log, `# Token review\n\n### ${day(-3)}: a week\n\n### ${day(-10)}: the week before\n`);
    assert.equal(said(start()), "");
    assert.equal(existsSync(offered), false);
    writeFileSync(log, `# Token review\n\n### ${day(-8)}: a week\n\n### ${day(-15)}: the week before\n`);
    for (const source of ["resume", "clear", "compact"]) assert.equal(said(start({ source })), "", source);
    assert.equal(said(start({ agent_id: "a1", agent_type: "general-purpose" })), "");
    assert.equal(said(start({ agent_type: "reviewer" })), "");
    assert.equal(
      said(start()),
      `The weekly token review is due: the last entry in ${log} is from ${day(-8)}. In your first reply, offer the user to run it; on their yes, start the agents that file's "Running a review" names. This is said once a week.`,
    );
    // once: not again until a week after it said so
    assert.equal(said(start()), "");
    writeFileSync(offered, new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString());
    assert.match(said(start()), /is from /);
    rmSync(offered);
    writeFileSync(log, "# Token review\n");
    assert.match(said(start()), /^The weekly token review is due: .*token-review\.md has no entry yet\./);
  });

  test("a flag it doesn't know runs nothing", () => {
    const { run } = scratch();
    const typo = run(["--sinse", "2026-11-10"]);
    assert.equal(typo.status, 1);
    assert.match(typo.stderr, /^usage: .*'--sinse'.*\nUsage: node ~\/\.claude\/hooks\/usage\.mjs \[--agent <id>\] \[--week\] \[--since <YYYY-MM-DD>\]$/m);
    assert.equal(run(["--since", "11/10"]).status, 1);
  });
});

// steps.mjs: one agent's profile from its transcript's rows, by kind of
// step and stage, which usage.mjs records at each stop
describe("steps", () => {
  // a transcript's rows, minute by minute from 10:00: each a user row, an
  // assistant message (one line per content block, the same id and usage),
  // a tool's result or a compaction
  const at = (minute) => new Date(Date.UTC(2026, 10, 25, 10, 0, minute * 60)).toISOString();
  const usage = (context, output = 0) => ({ input_tokens: 0, cache_read_input_tokens: context, cache_creation_input_tokens: 0, output_tokens: output });
  const step = (id, minute, context, calls = [], { output = 0, model = "claude-opus-5-5" } = {}) =>
    (calls.length ? calls : [null]).map((call, i) => ({
      type: "assistant",
      timestamp: at(minute),
      message: {
        id,
        model,
        usage: usage(context, output),
        content: call ? [{ type: "tool_use", id: `${id}-${i}`, name: call[0], input: call[1] }] : [{ type: "text", text: "done" }],
      },
    }));
  const result = (id, minute) => ({ type: "user", timestamp: at(minute), message: { content: [{ type: "tool_result", tool_use_id: id }] } });
  const told = (minute) => ({ type: "user", timestamp: at(minute), message: { content: "<task-notification>" } });
  // weighed as usage.mjs does, cache reads at 0.05 and output at 5
  const cost = (t) => t.cacheRead * 0.05 + t.output * 5 + t.input + t.cacheWrite * 1.25;

  test("reads: the usage audit's rule, word for word", () => {
    for (const [name, input, read] of [
      ["Read", { file_path: "/a" }, true],
      ["Glob", {}, true],
      ["Bash", { command: "rg -n foo src | head" }, true],
      ["Bash", { command: "cd /repo && git log --oneline -3" }, true],
      ["Bash", { command: "gh pr view 12" }, true],
      ["Bash", { command: "cat x; pnpm test" }, false],
      ["Bash", { command: "git status && git commit -m x" }, false],
      ["Bash", { command: "node --test" }, false],
      ["WebFetch", {}, false],
    ])
      assert.equal(steps.reads({ name, input }), read, `${name} ${JSON.stringify(input)}`);
  });

  test("kindOf: a call's kind by its tool, a Bash command's by what it mostly is", () => {
    for (const [name, input, kind] of [
      ["Read", { file_path: "/a" }, "reading"],
      ["Edit", {}, "edits"],
      ["Agent", {}, "agents"],
      ["WebSearch", {}, "web"],
      ["Monitor", {}, "waits"],
      ["LSP", {}, "other tools"],
      ["Bash", { command: "rg -n 'pnpm test' docs" }, "reading"],
      ["Bash", { command: "gh pr checks 12 --watch" }, "CI"],
      ["Bash", { command: "pnpm test:change bills" }, "tests"],
      ["Bash", { command: "until rg -q '^rc=' /tmp/x/log; do sleep 20; done" }, "tests"],
      ["Bash", { command: "until [ -f done ]; do sleep 5; done" }, "waits"],
      ["Bash", { command: "pnpm -r typecheck" }, "checks"],
      ["Bash", { command: "git commit -m x" }, "git"],
      ["Bash", { command: "node - <<'EOF'\nwriteFileSync('a', b)\nEOF" }, "edits"],
      ["Bash", { command: "date" }, "other bash"],
    ])
      assert.equal(steps.kindOf({ name, input }), kind, `${name} ${JSON.stringify(input)}`);
  });

  // plan review F2, F3: the ux-reviewer searches with Grep, and an agent's
  // own survey, reviews and scratch aren't the docs it reads
  test("docsOf: the Markdown a call that reads names, its own files left out", () => {
    for (const [name, input, docs] of [
      ["Read", { file_path: "/r/docs/ux-log.md" }, ["/r/docs/ux-log.md"]],
      ["Read", { file_path: "/r/src/a.ts" }, []],
      ["Grep", { pattern: "Home", path: "docs/ux-log.md" }, ["/r/docs/ux-log.md"]],
      ["Grep", { pattern: "Home", path: "docs", glob: "*.md" }, []],
      ["Grep", { pattern: "Home", path: "docs/ux-log.md", glob: "*.md" }, ["/r/docs/ux-log.md"]],
      ["Grep", { pattern: "Home" }, []],
      ["Bash", { command: "rg -n 'Home|failed' docs/ux-log.md docs/testing-log.md" }, ["/r/docs/ux-log.md", "/r/docs/testing-log.md"]],
      ["Bash", { command: "cd /s && sed -n '1,40p' README.md" }, ["/s/README.md"]],
      ["Bash", { command: "git show origin/main:docs/ux.md | head" }, ["/r/docs/ux.md"]],
      ["Bash", { command: "rg -n x --glob '*.md' docs" }, []],
      ["Read", { file_path: "/r/.git/worktrees/w/claude/survey-x.md" }, []],
      ["Read", { file_path: "/tmp/claude-1000/x/notes.md" }, []],
      ["Edit", { file_path: "/r/docs/ux.md" }, []],
    ])
      assert.deepEqual(steps.docsOf({ name, input }, "/r"), docs, `${name} ${JSON.stringify(input)}`);
  });

  // round 1 F6: a search of a folder names no file, but brings in the rows it matches;
  // round 3 F8: a line with no path is the named files', one with another path no doc's
  test("docsFound: the Markdown a search brought in, by each line of its result", () => {
    const row = "/r/docs/ux-log.md:39:| Client portal > Payment Method | Where does a Client retry a failed charge? |";
    for (const [name, input, text, found] of [
      ["Grep", { pattern: "failed", path: "/r/docs", output_mode: "content" }, `${row}\n${row}\n/r/src/a.ts:3:failed`, { "/r/docs/ux-log.md": 2 * (row.length + 1) }],
      ["Grep", { pattern: "failed", path: "docs", output_mode: "files_with_matches" }, "Found 1 file\n/r/docs/ux-log.md", { "/r/docs/ux-log.md": 17 }],
      ["Bash", { command: "cd /s && rg -n failed docs" }, "docs/ux.md:3:failed", { "/s/docs/ux.md": 19 }],
      // a named file's sed beside a folder search: its lines and its rows the search found
      ["Bash", { command: "sed -n 1,2p docs/ux-log.md; rg -n failed docs" }, "# Log\n| a |\ndocs/ux-log.md:39:failed\ndocs/ux.md:3:failed", { "/r/docs/ux-log.md": 37, "/r/docs/ux.md": 19 }],
      // a named file the search didn't match, beside code it did: no doc's
      ["Bash", { command: "rg -n failed src docs/ux-log.md" }, "src/a.ts:3:failed\nsrc/b.ts:9:failed", {}],
      // a context line (`-C`) is its file's
      ["Grep", { pattern: "failed", path: "docs", "-C": 1 }, "docs/ux-log.md-38-| x |\ndocs/ux-log.md:39:failed\n--\n2026-11-25 x", { "/r/docs/ux-log.md": 49 }],
      ["Grep", { pattern: "x", path: "/r/.git" }, "/r/.git/worktrees/w/claude/survey-x.md:1:x", {}],
      ["Bash", { command: "pnpm test:change" }, "docs/ux.md:3:failed", {}],
    ])
      assert.deepEqual(steps.docsFound({ name, input }, text, "/r"), found, `${name} ${JSON.stringify(input)}`);
  });

  test("profileOf: a step per message id, its time, its kind, and the waits and compactions between", () => {
    const rows = [
      { type: "user", timestamp: at(0), message: { content: "the brief" } },
      // two lines of one message, two calls side by side: its tool time is the longer
      ...step("m1", 1, 1000, [["Read", { file_path: "/a" }], ["Grep", { pattern: "x" }]]),
      result("m1-0", 2),
      result("m1-1", 3),
      ...step("m2", 4, 1200, [["Bash", { command: "pnpm test:change" }]], { output: 10 }),
      result("m2-0", 9),
      // a 20-minute wait on an agent, then Claude Code's own reply, counted nowhere
      told(29),
      ...step("s1", 29, 0, [], { model: "<synthetic>" }),
      { type: "system", subtype: "compact_boundary", timestamp: at(30), compactMetadata: { durationMs: 60_000 } },
      ...step("m3", 31, 800),
    ];
    const profile = steps.profileOf(rows, cost);
    assert.equal(profile.steps, 3);
    assert.equal(profile.to - profile.from, 31 * 60_000);
    assert.equal(profile.waitMs, 20 * 60_000);
    assert.deepEqual([profile.compactions, profile.compactMs], [1, 60_000]);
    // tools: m1's longest call 2 min, m2's 5 min
    assert.equal(profile.toolMs, 7 * 60_000);
    assert.deepEqual(
      Object.fromEntries(Object.entries(profile.kinds).filter(([, group]) => group.steps).map(([kind, group]) => [kind, [group.steps, group.calls, group.toolMs]])),
      { reading: [1, 2, 3 * 60_000], tests: [1, 1, 5 * 60_000], replies: [1, 0, 0] },
    );
    // cost: 1000 × 0.05, 1200 × 0.05 + 10 × 5, 800 × 0.05
    assert.equal(profile.cost, 50 + 110 + 40);
  });

  test("profileOf: rereading the context is put down to the steps that brought it in, its start and a compaction's summary", () => {
    const rows = [
      ...step("m1", 1, 1000, [["Read", { file_path: "/a" }]]),
      ...step("m2", 2, 3000, [["Bash", { command: "pnpm test:change" }]]),
      ...step("m3", 3, 4000),
      { type: "system", subtype: "compact_boundary", timestamp: at(4) },
      ...step("m4", 5, 1500),
    ];
    const { kinds } = steps.profileOf(rows, cost);
    const held = Object.fromEntries(Object.entries(kinds).map(([kind, group]) => [kind, group.held]));
    // m1 50 its start; m2 150: 50 start, 100 the read's; m3 200: 50, 100, and 50 the test's;
    // m4 75: its start 1000 of 1500, the summary the rest
    assert.deepEqual(held, { start: 50 + 50 + 50 + 50, reading: 100 + 100, tests: 50, replies: 0, "compaction summaries": 25 });
  });

  test("profileOf: the docs it read, in and reread up to a compaction, at most what the context grew by", () => {
    const text = (id, minute, chars) => ({ type: "user", timestamp: at(minute), message: { content: [{ type: "tool_result", tool_use_id: id, content: [{ type: "text", text: "x".repeat(chars) }] }] } });
    const rows = [
      // one command, two files: its 540 characters (200 tokens) split between them
      ...step("m1", 1, 1000, [["Bash", { command: "cd /repo && git show origin/main:docs/a.md docs/b.md | head" }]]).map((row) => ({ ...row, cwd: "/w" })),
      text("m1-0", 2, 540),
      ...step("m2", 3, 1200, [["Read", { file_path: "/repo/docs/big.md" }]]),
      // 2,700 characters, but the context grew 500 tokens: 1,350 counted
      text("m2-0", 4, 2700),
      ...step("m3", 5, 1700),
      { type: "system", subtype: "compact_boundary", timestamp: at(6) },
      ...step("m4", 7, 1000),
    ];
    const { docs } = steps.profileOf(rows, cost);
    // held: m2 rereads 1,200 for 60, each 100 of its tokens 5; m3 1,700 for
    // 85, each 100 tokens 5 and big.md's 500 25; m4 holds none after the compaction
    assert.deepEqual(docs, {
      "/repo/docs/a.md": { reads: 1, chars: 270, reread: 540, held: 10 },
      "/repo/docs/b.md": { reads: 1, chars: 270, reread: 540, held: 10 },
      "/repo/docs/big.md": { reads: 1, chars: 1350, reread: 1350, held: 25 },
    });
  });

  test("profileOf: a search of a folder counts the Markdown lines it brought in, named from the agent's folder", () => {
    const line = `/w/docs/ux-log.md:39:${"a".repeat(78)}`;
    const rows = [
      ...step("m1", 1, 1000, [["Grep", { pattern: "failed", path: "/w/docs", output_mode: "content" }]]).map((row) => ({ ...row, cwd: "/w" })),
      { type: "user", timestamp: at(2), message: { content: [{ type: "tool_result", tool_use_id: "m1-0", content: `${line}\n${line}\n/w/src/a.ts:1:failed` }] } },
      ...step("m2", 3, 2000),
    ];
    const { docs } = steps.profileOf(rows, cost);
    assert.deepEqual(Object.keys(docs), ["docs/ux-log.md"]);
    assert.deepEqual([docs["docs/ux-log.md"].reads, docs["docs/ux-log.md"].chars, docs["docs/ux-log.md"].reread], [1, 200, 200]);
  });

  // round 2 F7: a search that names Markdown (a glob, or a file beside a
  // folder) is counted by the paths its result shows, not by what it names
  test("profileOf: a search that names Markdown is counted by the files its result shows", () => {
    const ux = `docs/ux-log.md:39:${"a".repeat(81)}`;
    const readme = `README.md:2:${"b".repeat(41)}`;
    const searched = (input, content) => [
      ...step("m1", 1, 1000, [[input.command ? "Bash" : "Grep", input]]).map((row) => ({ ...row, cwd: "/w" })),
      { type: "user", timestamp: at(2), message: { content: [{ type: "tool_result", tool_use_id: "m1-0", content }] } },
      ...step("m2", 3, 2000),
    ];
    const chars = (input, content) => Object.fromEntries(Object.entries(steps.profileOf(searched(input, content), cost).docs).map(([name, doc]) => [name, doc.chars]));
    // a folder with a glob: the log's rows, not `docs/ux*.md`
    assert.deepEqual(chars({ pattern: "failed", path: "docs", glob: "ux*.md", output_mode: "content" }, `${ux}\n${ux}`), { "docs/ux-log.md": 199 });
    // a folder and a file: each file its own lines
    assert.deepEqual(chars({ command: "rg -n failed docs README.md" }, `${ux}\n${readme}`), { "docs/ux-log.md": 100, "README.md": 53 });
    // two files, one matched: the other brought none
    assert.deepEqual(chars({ command: "rg -n failed docs/ux-log.md docs/testing-log.md" }, ux), { "docs/ux-log.md": 99 });
    // one file: no path in its lines, so the file it names
    assert.deepEqual(chars({ pattern: "failed", path: "docs/ux-log.md", output_mode: "content" }, "39:failed"), { "docs/ux-log.md": 9 });
  });

  // plan review F4: a builder's plan review was told apart by the word
  // "plan" in its brief; the order of its calls decides it, whatever a brief says
  test("profileOf: stages by the order of the change skill's steps, and single reads", () => {
    const rows = [
      ...step("m1", 1, 100, [["Read", { file_path: "/a" }]]),
      ...step("m2", 2, 100, [["Bash", { command: "rg -n x src" }]]),
      // an edit before the plan review: still the survey
      ...step("m3", 3, 100, [["Edit", { file_path: "/repo/x.ts" }]]),
      ...step("m4", 4, 100, [["Agent", { subagent_type: "change-reviewer", description: "Round 1 on the survey" }]]),
      // the survey's fix in the git dir, and a scratch file: still the plan review
      ...step("m5", 5, 100, [["Write", { file_path: "/repo/.git/worktrees/w/claude/survey-x.md" }]]),
      ...step("m6", 6, 100, [["Write", { file_path: "/tmp/claude-1000/x/scratch.mjs" }]]),
      ...step("m7", 7, 100, [["Edit", { file_path: "/repo/x.ts" }]]),
      ...step("m8", 8, 100, [["Agent", { subagent_type: "critical-reviewer", description: "Plan pass" }]]),
      ...step("m9", 9, 100, [["Bash", { command: "gh pr create --draft --body-file b" }]]),
      ...step("m10", 10, 100, [["Read", { file_path: "/c" }], ["Read", { file_path: "/d" }]]),
    ];
    const profile = steps.profileOf(rows, cost);
    assert.deepEqual(profile.starts, { "plan review": Date.parse(at(4)), build: Date.parse(at(7)), review: Date.parse(at(8)), PR: Date.parse(at(9)) });
    assert.deepEqual(
      Object.fromEntries(Object.entries(profile.stages).map(([stage, group]) => [stage, group.steps])),
      { survey: 3, "plan review": 3, build: 1, review: 1, PR: 2 },
    );
    assert.deepEqual(profile.agents, { "change-reviewer": 1, "critical-reviewer": 1 });
    // m1 and m2 each read one thing; m10 reads two in one step
    assert.equal(profile.singleReads, 2);
  });

  test("profileOf: a phase's fresh agent stages from the plan review it reads and the review it runs", () => {
    const build = steps.profileOf(
      [
        ...step("m1", 1, 100, [["Read", { file_path: "/repo/.git/claude/plan-review-x.md" }]]),
        ...step("m2", 2, 100, [["Edit", { file_path: "/repo/x.ts" }]]),
      ],
      cost,
    );
    assert.deepEqual(Object.keys(build.starts), ["plan review", "build"]);
    const review = steps.profileOf(
      [...step("m1", 1, 100, [["Agent", { subagent_type: "change-reviewer", prompt: "round 1, output /repo/.git/claude/review-x.md" }]])],
      cost,
    );
    assert.deepEqual(Object.keys(review.starts), ["review"]);
    // the review phase's own fixes and its critical diff pass stay review,
    // though it read the plan review first (round-1 review F1)
    const fixes = steps.profileOf(
      [
        ...step("m1", 1, 100, [["Read", { file_path: "/repo/.git/claude/plan-review-x.md" }]]),
        ...step("m2", 2, 100, [["Agent", { subagent_type: "change-reviewer", prompt: "round 1, output /repo/.git/claude/review-x.md" }]]),
        ...step("m3", 3, 100, [["Edit", { file_path: "/repo/x.ts" }]]),
        ...step("m4", 4, 100, [["Agent", { subagent_type: "critical-reviewer", prompt: "mode: diff, output /repo/.git/claude/critical-review-x.md" }]]),
      ],
      cost,
    );
    assert.deepEqual(Object.keys(fixes.starts), ["plan review", "review"]);
    assert.equal(fixes.stages.review.steps, 3);
  });
});

// reads.mjs, the nudge when an agent's reads go one per turn, fed a
// PostToolUse call as Claude Code sends it in an agent, over that agent's
// transcript beside its session's
describe("reads", () => {
  // a session's folder, an agent's transcript in it, a step written to it
  // (its calls, each [name, input]), and the hook's run on a call of the
  // last step written
  const scratch = () => {
    const root = scratchDir();
    const transcript = join(root, "s1/subagents/agent-a1.jsonl");
    mkdirSync(dirname(transcript), { recursive: true });
    let n = 0;
    const step = (...calls) => {
      n++;
      appendFileSync(
        transcript,
        JSON.stringify({
          type: "assistant",
          timestamp: new Date().toISOString(),
          message: {
            id: `m${n}`,
            model: "claude-opus-5-5",
            usage: { input_tokens: 1, cache_read_input_tokens: 100_000 + n * 1000, cache_creation_input_tokens: 500, output_tokens: 10 },
            content: calls.map(([name, input], i) => ({ type: "tool_use", id: `t${n}-${i}`, name, input })),
          },
        }) + "\n",
      );
    };
    const run = ([name, input], extra = {}) => {
      const ran = runHook("reads", { hook_event_name: "PostToolUse", session_id: "s1", agent_id: "a1", transcript_path: join(root, "s1.jsonl"), tool_name: name, tool_input: input, tool_use_id: `t${n}-0`, tool_response: {}, ...extra }, { env: { ...process.env, TMPDIR: root } });
      assert.equal(ran.stderr, "");
      return ran.stdout ? JSON.parse(ran.stdout).hookSpecificOutput : null;
    };
    // a step written one line per call, as Claude Code writes them, only
    // its first `upTo` calls so far
    const stepByLine = (calls, upTo) => {
      n++;
      for (const [i, [name, input]] of calls.slice(0, upTo).entries())
        appendFileSync(
          transcript,
          JSON.stringify({
            type: "assistant",
            timestamp: new Date().toISOString(),
            message: {
              id: `m${n}`,
              model: "claude-opus-5-5",
              usage: { input_tokens: 1, cache_read_input_tokens: 100_000 + n * 1000, cache_creation_input_tokens: 500, output_tokens: 10 },
              content: [{ type: "tool_use", id: `t${n}-${i}`, name, input }],
            },
          }) + "\n",
        );
    };
    return { step, stepByLine, run };
  };
  const read = ["Read", { file_path: "/a" }];
  const rg = ["Bash", { command: "rg -n foo src" }];

  test("two steps that each sent one read, then a read: one line, with the context each turn rereads", () => {
    const { step, run } = scratch();
    step(read);
    step(rg);
    step(read);
    assert.deepEqual(run(read), {
      hookEventName: "PostToolUse",
      additionalContext: "Your last two turns each sent one read, and every turn rereads your whole context (~104k tokens now): send the reads this step needs as several calls in one turn.",
    });
  });

  // Claude Code writes the transcript behind the run: a step's PostToolUse
  // can find the file without that step (live, 2026-11-25)
  // and one line per call, so a step can be half written
  test("a call not written yet: silent, as its step is unknown, and the next call's nudge comes", () => {
    const { step, run } = scratch();
    step(read);
    step(rg);
    assert.equal(run(read, { tool_use_id: "t-unwritten" }), null);
    step(read);
    assert.match(run(read)?.additionalContext, /\(~104k tokens now\)/);
  });

  test("a step half written: its unwritten call is silent, its written one judges the steps before it", () => {
    const { step, stepByLine, run } = scratch();
    step(read, rg);
    step(read);
    // m3's first read is written, its second not: m3 isn't a single read
    stepByLine([read, rg], 1);
    assert.equal(run(rg, { tool_use_id: "t3-1" }), null);
    assert.equal(run(read, { tool_use_id: "t3-0" }), null);
  });

  test("silent in the main session, on a call that doesn't read, and after a step that read in more than one call or wrote", () => {
    for (const [before, now, extra] of [
      [[[read], [read]], read, { agent_id: undefined }],
      [[[read], [read]], ["Bash", { command: "pnpm test:change" }]],
      [[[read], [read]], ["Bash", { command: "rg foo && git commit -m x" }]],
      [[[read, rg], [read]], read],
      [[[read], [["Edit", { file_path: "/a" }]]], read],
      // a reply's step, with no call
      [[[read], []], read],
    ]) {
      const { step, run } = scratch();
      for (const calls of before) step(...calls);
      step(now);
      assert.equal(run(now, extra), null, JSON.stringify([before, now]));
    }
  });

  test("once in an agent's 10 steps", () => {
    const { step, run } = scratch();
    const said = [];
    for (let i = 1; i <= 24; i++) {
      step(read);
      if (run(read)) said.push(i);
    }
    // steps 1 and 2 have no two single reads before them
    assert.deepEqual(said, [3, 13, 23]);
  });
});


// main-session.mjs at a session's start, in a scratch HOME (live()) whose
// ~/.dotfiles has a file of each kind the check tells apart
describe("main-session", () => {
  const RULES = readFileSync(join(HOOKS, "main-session.md"), "utf8");
  const FOR_CLAUDE =
    "The session-start check of ~/.dotfiles found the damage below. Tell the user first in your next reply, before " +
    "anything else, and offer to run its git commands, saving any text it says to copy out first. A file restored " +
    "under ~/.claude takes effect once Claude Code restarts; quitting prints the command that reopens this conversation.";
  // how a live file's warning ends, its restores run from inside the session
  const RUN = (n) => ` (Claude can run ${n > 1 ? "these" : "this"} for you):`;
  const RESTART = "\nThen quit Claude Code and start it again, so it reads the restored ~/.claude file";

  // live()'s HOME, its ~/.dotfiles holding the rules file and a skill (live
  // in sessions), a doc (not), a binary file and one empty in the commit
  const dotfiles = () => {
    const state = live();
    mkdirSync(join(state.repo, "home/.claude/skills/change"), { recursive: true });
    mkdirSync(join(state.repo, "docs"));
    commit(state.repo, "home/.claude/CLAUDE.md", "rules\nmore rules\n");
    commit(state.repo, "home/.claude/skills/change/SKILL.md", "skill text\n");
    commit(state.repo, "docs/log.md", "log\n");
    commit(state.repo, "logo.png", "\x89PNG\0\0\x01");
    commit(state.repo, ".keep", "");
    return state;
  };

  // the hook's output at a session start in `home`: the warning the user
  // sees (null when none), and what Claude gets
  const start = (home) => {
    const ran = runHook("main-session", { hook_event_name: "SessionStart", session_id: "s", cwd: home, source: "startup" }, { env: { ...process.env, HOME: home } });
    assert.equal(ran.status, 0, ran.stderr);
    const { systemMessage = null, hookSpecificOutput } = JSON.parse(ran.stdout);
    assert.equal(hookSpecificOutput.hookEventName, "SessionStart");
    return { warning: systemMessage, context: hookSpecificOutput.additionalContext };
  };

  // the warning's git commands, each run as the user or Claude would
  const runCommands = (home, warning) => {
    const commands = warning.split("\n").filter((line) => line.startsWith("  git "));
    assert.ok(commands.length, warning);
    for (const command of commands) execFileSync("sh", ["-c", command], { env: { ...process.env, HOME: home }, stdio: "ignore" });
  };

  test("no ~/.dotfiles, or a sound one: main-session.md alone", () => {
    for (const home of [live({ dotfiles: false }).home, dotfiles().home]) assert.deepEqual(start(home), { warning: null, context: RULES });
  });

  test("the user's edits are no damage: text changed, a file removed, a binary or empty-in-the-commit file emptied or nulled", () => {
    const { repo, home } = dotfiles();
    appendFileSync(join(repo, "home/.claude/CLAUDE.md"), "a rule of mine\n");
    rmSync(join(repo, "docs/log.md"));
    writeFileSync(join(repo, "home/.claude/skills/change/SKILL.md"), "rewritten\n");
    writeFileSync(join(repo, "logo.png"), "");
    writeFileSync(join(repo, ".keep"), "\0\0");
    assert.deepEqual(start(home), { warning: null, context: RULES });
  });

  test("a live file empty and another all null bytes (2026-11-23): one warning, to both readers, whose commands restore them", () => {
    const { repo, home } = dotfiles();
    writeFileSync(join(repo, "home/.claude/CLAUDE.md"), "");
    writeFileSync(join(repo, "docs/log.md"), "\0".repeat(4096));
    const warning =
      "WARNING: this session started with ~/.claude/CLAUDE.md empty, likely from a crash, and another file in ~/.dotfiles is all null bytes. " +
      `The last commit has a good copy of each. Restore them${RUN(2)}\n` +
      "  git -C ~/.dotfiles checkout HEAD -- home/.claude/CLAUDE.md\n" +
      `  git -C ~/.dotfiles checkout HEAD -- docs/log.md${RESTART}.`;
    assert.deepEqual(start(home), { warning, context: `${FOR_CLAUDE}\n\n${warning}\n\n${RULES}` });
    runCommands(home, warning);
    assert.equal(readFileSync(join(repo, "home/.claude/CLAUDE.md"), "utf8"), "rules\nmore rules\n");
    assert.deepEqual(start(home), { warning: null, context: RULES });
  });

  test("only files no session reads: counted, named in the commands, no restart asked; damage already staged: restored all the same", () => {
    const { repo, home } = dotfiles();
    commit(repo, "docs/notes.md", "notes\n");
    writeFileSync(join(repo, "docs/log.md"), "");
    git(repo, "add", "docs/log.md");
    const restore = "\n  git -C ~/.dotfiles checkout HEAD -- docs/log.md";
    assert.equal(
      start(home).warning,
      `WARNING: a file in ~/.dotfiles is empty, likely from a crash. The last commit has a good copy. Restore it${RUN(1)}${restore}`,
    );
    writeFileSync(join(repo, "docs/notes.md"), "\0\0");
    const { warning } = start(home);
    assert.equal(
      warning,
      "WARNING: 2 files in ~/.dotfiles are empty or all null bytes, likely from a crash. The last commit has a good copy of each. " +
        `Restore them${RUN(2)}${restore}\n  git -C ~/.dotfiles checkout HEAD -- docs/notes.md`,
    );
    runCommands(home, warning);
    assert.equal(git(repo, "status", "--porcelain"), "");
  });

  test("a file cut off by null bytes: what's left is the commit's, nothing more said; anything else, copy out his edits first", () => {
    const { repo, home } = dotfiles();
    const skill = join(repo, "home/.claude/skills/change/SKILL.md");
    const damaged = "WARNING: this session started with ~/.claude/skills/change/SKILL.md cut off by null bytes, likely from a crash.";
    const fix =
      ` The last commit has a good copy. Restore it${RUN(1)}\n` +
      `  git -C ~/.dotfiles checkout HEAD -- home/.claude/skills/change/SKILL.md${RESTART}.`;
    writeFileSync(skill, "skill\0\0\0\0\0\0");
    assert.equal(start(home).warning, damaged + fix);
    for (const mine of ["MINE\0\0\0", "skill text\n\0\0more of mine\n"]) {
      writeFileSync(skill, mine);
      const copy = " The text left in that file isn't the last commit's: copy out any edits of yours first.";
      assert.equal(start(home).warning, damaged + copy + fix, JSON.stringify(mine));
    }
  });

  test("git's index damaged, alone or with a file: rebuilt first, then restored, each command working", () => {
    const { repo, home } = dotfiles();
    writeFileSync(join(repo, ".git/index"), "\0".repeat(64));
    const why = "(git says: fatal: index file corrupt), so git status and restore fail there and it stops catching up with GitHub";
    assert.equal(
      start(home).warning,
      `WARNING: git's index in ~/.dotfiles is damaged, likely from a crash ${why}. ` +
        `Rebuild the index from the last commit, every file staying as it is${RUN(1)}\n  git -C ~/.dotfiles read-tree HEAD`,
    );
    writeFileSync(join(repo, "home/.claude/CLAUDE.md"), "");
    const { warning } = start(home);
    assert.equal(
      warning,
      `WARNING: this session started with ~/.claude/CLAUDE.md empty, likely from a crash, and git's index in ~/.dotfiles is damaged ${why}. ` +
        `Rebuild the index first (every file stays as it is), then restore the file from the last commit's good copy${RUN(2)}\n` +
        "  git -C ~/.dotfiles read-tree HEAD\n" +
        `  git -C ~/.dotfiles checkout HEAD -- home/.claude/CLAUDE.md${RESTART}.`,
    );
    runCommands(home, warning);
    assert.equal(git(repo, "status", "--porcelain"), "");
    assert.deepEqual(start(home), { warning: null, context: RULES });
  });

  test("git can't read the last commit: nothing checked, the index named too, and main-session.md still goes", () => {
    const { repo, home } = dotfiles();
    writeFileSync(join(repo, ".git/refs/heads/main"), `${"0".repeat(39)}1\n`);
    const said = "WARNING: git can't read the last commit in ~/.dotfiles, likely from a crash (git says: fatal: not a tree object), so this session's rules, hooks and skills under ~/.claude weren't checked for damage";
    const fsck = "from GitHub's copy. To see what's broken:\n  git -C ~/.dotfiles fsck\nIf the repair changes a file under ~/.claude, quit Claude Code and start it again, so it reads it.";
    const warning = `${said}. Claude can help repair it ${fsck}`;
    assert.deepEqual(start(home), { warning, context: `${FOR_CLAUDE}\n\n${warning}\n\n${RULES}` });
    writeFileSync(join(repo, ".git/index"), "\0".repeat(64));
    assert.equal(start(home).warning, `${said}, and git's index there is damaged too (git says: fatal: index file corrupt). Claude can help repair them ${fsck}`);
  });

  test("a damaged file whose stored copy git can't read: named, with fsck, the check going on to the rest and the index", () => {
    // `path`'s stored copy removed, as a stop can leave a fetch's loose one
    const lose = ({ repo }, path) => {
      const sha = git(repo, "rev-parse", `HEAD:${path}`);
      rmSync(join(repo, ".git/objects", sha.slice(0, 2), sha.slice(2)));
      return `fatal: git cat-file ${sha}: bad file`;
    };
    const help = "so there's no good copy here: Claude can help restore it from GitHub's copy. To see what else is broken:\n  git -C ~/.dotfiles fsck";
    const once = "\nOnce it's restored, quit Claude Code and start it again, so it reads the restored ~/.claude file.";
    const doc = dotfiles();
    const docLost = lose(doc, "docs/log.md");
    writeFileSync(join(doc.repo, "docs/log.md"), "");
    assert.equal(
      start(doc.home).warning,
      `WARNING: a file in ~/.dotfiles is empty, likely from a crash. git can't read the last commit's copy of ~/.dotfiles/docs/log.md (git says: ${docLost}), ${help}`,
    );
    const rules = dotfiles();
    const rulesLost = lose(rules, "home/.claude/CLAUDE.md");
    writeFileSync(join(rules.repo, "home/.claude/CLAUDE.md"), "rules\0\0");
    assert.equal(
      start(rules.home).warning,
      "WARNING: this session started with ~/.claude/CLAUDE.md holding null bytes, likely from a crash. git can't read the last commit's copy of " +
        `that file (git says: ${rulesLost}), ${help}${once}`,
    );
    // the rules file restorable, listed before a skill whose copy is lost
    // (2026-11-23's shape, as a stop writes files back one at a time)
    const both = dotfiles();
    const skillLost = lose(both, "home/.claude/skills/change/SKILL.md");
    writeFileSync(join(both.repo, "home/.claude/CLAUDE.md"), "");
    writeFileSync(join(both.repo, "home/.claude/skills/change/SKILL.md"), "");
    const lead = "WARNING: this session started with ~/.claude/CLAUDE.md empty and ~/.claude/skills/change/SKILL.md empty, likely from a crash";
    // the one-line restore leads, by its command, then the one git can't read
    const restore = "\n  git -C ~/.dotfiles checkout HEAD -- home/.claude/CLAUDE.md";
    const lost = `\ngit can't read the last commit's copy of ~/.claude/skills/change/SKILL.md (git says: ${skillLost}), ${help}`;
    const after = "\nOnce they're restored, quit Claude Code and start it again, so it reads the restored ~/.claude files.";
    assert.equal(start(both.home).warning, `${lead}. The last commit has a good copy of the file below. Restore it${RUN(1)}${restore}${lost}${after}`);
    writeFileSync(join(both.repo, ".git/index"), "\0".repeat(64));
    const { warning } = start(both.home);
    assert.equal(
      warning,
      `${lead}, and git's index in ~/.dotfiles is damaged (git says: fatal: index file corrupt), so git status and restore fail there and it ` +
        "stops catching up with GitHub. Rebuild the index first (every file stays as it is), then restore the file below from the last " +
        `commit's good copy${RUN(2)}\n  git -C ~/.dotfiles read-tree HEAD${restore}${lost}${after}`,
    );
    runCommands(both.home, warning.replace(/\n {2}git -C ~\/\.dotfiles fsck/, ""));
    assert.equal(readFileSync(join(both.repo, "home/.claude/CLAUDE.md"), "utf8"), "rules\nmore rules\n");
  });

  test("runs beside an emptied lib.mjs (a stop can empty any file in ~/.claude/hooks)", () => {
    const hooks = scratchDir();
    for (const file of ["main-session.mjs", "main-session.md"]) copyFileSync(join(HOOKS, file), join(hooks, file));
    writeFileSync(join(hooks, "lib.mjs"), "");
    const { repo, home } = dotfiles();
    writeFileSync(join(repo, "home/.claude/CLAUDE.md"), "");
    const ran = spawnSync(process.execPath, [join(hooks, "main-session.mjs")], { input: "{}", encoding: "utf8", env: { ...process.env, HOME: home } });
    assert.match(JSON.parse(ran.stdout).systemMessage, /^WARNING: this session started with ~\/\.claude\/CLAUDE\.md empty, /);
  });
});

// pr-conflict.mjs, fed a Bash call as Claude Code runs it, with a fake gh
// first on PATH that answers each `pr view` in turn from `answers` (the
// last again after them; null fails as gh does offline) and logs the
// folder it ran in too
describe("pr-conflict", () => {
  const PR = { number: 12, state: "OPEN", mergeable: "CONFLICTING", mergeStateStatus: "DIRTY", baseRefName: "main", headRefName: "feature" };
  const ASKED = "--json number,state,mergeable,mergeStateStatus,baseRefName,headRefName";

  // runs the hook on `command` in a scratch folder: what it told the agent
  // (undefined: nothing), each gh run's arguments, and the folders they ran in
  const conflict = (command, answers = [PR], cwd = scratchDir(), tool = "Bash") => {
    const bin = scratchDir();
    answers.forEach((answer, at) => writeFileSync(join(bin, `answer-${at + 1}`), answer ? JSON.stringify(answer) : ""));
    copyFileSync(join(bin, `answer-${answers.length}`), join(bin, "answer-last"));
    const { log } = fakeCommand(
      "gh",
      [
        `pwd >> "${join(bin, "gh-cwd")}"`,
        `f="${bin}/answer-$(wc -l < "${join(bin, "gh-args")}" | tr -d ' ')"`,
        `[ -f "$f" ] || f="${bin}/answer-last"`,
        `[ -s "$f" ] || { echo "error connecting to api.github.com" >&2; exit 1; }`,
        `cat "$f"`,
      ].join("\n"),
      bin,
    );
    const ran = runHook(
      "pr-conflict",
      { hook_event_name: "PreToolUse", tool_name: tool, session_id: "s", cwd, tool_input: { command } },
      { env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } },
    );
    const read = (file) => (existsSync(file) ? lines(readFileSync(file, "utf8")) : []);
    return { told: ran.stdout ? JSON.parse(ran.stdout).hookSpecificOutput : undefined, asked: read(log), dirs: read(join(bin, "gh-cwd")) };
  };

  test("a conflicting open PR: says no pull_request CI runs and to merge the base in, before each of the four", () => {
    for (const command of ["gh pr checks 12 --watch", "gh pr view 12", "gh pr ready 12", "gh pr merge 12 --squash"]) {
      const { told, asked } = conflict(command);
      assert.equal(told?.hookEventName, "PreToolUse", command);
      assert.match(told.additionalContext, /^PR #12 \(feature into main\) conflicts with main .*no `pull_request` CI.*Merge origin\/main into feature/, command);
      assert.deepEqual(asked, [`pr view 12 ${ASKED}`], command);
    }
  });

  test("asks about the PR the command names, in the folder it runs in", () => {
    const cases = [
      ["gh pr checks --watch", `pr view ${ASKED}`],
      ["gh pr view 7 -R o/r --json title -q .title", `pr view 7 --repo o/r ${ASKED}`],
      ["gh pr view --repo=o/r feature", `pr view feature --repo o/r ${ASKED}`],
      ["gh pr checks -Ro/r", `pr view --repo o/r ${ASKED}`],
      ['gh pr merge 5 --subject "a 9 b" -b c 2>&1', `pr view 5 ${ASKED}`],
      ["git fetch && GIT_PAGER=cat gh pr checks https://github.com/o/r/pull/3 | tail -3", `pr view https://github.com/o/r/pull/3 ${ASKED}`],
    ];
    for (const [command, expected] of cases) assert.deepEqual(conflict(command).asked, [expected], command);
    // the ways a wait on checks is written, in Bash or a Monitor (round 1's F7)
    for (const command of ["until gh pr checks 12; do sleep 30; done", "while ! gh pr checks 12 --required; do sleep 20; done", "timeout 600 gh pr checks 12 --watch", "{ gh pr checks 12; }", "if ! gh pr checks 12; then echo red; fi"])
      assert.deepEqual(conflict(command).asked, [`pr view 12 ${ASKED}`], command);
    const watched = conflict("until gh pr checks 12; do sleep 30; done", [PR], scratchDir(), "Monitor");
    assert.deepEqual(watched.asked, [`pr view 12 ${ASKED}`]);
    assert.match(watched.told.additionalContext, /^PR #12 /);
    const cwd = scratchDir();
    const sub = join(cwd, "sub");
    mkdirSync(sub);
    assert.deepEqual(conflict("cd sub && gh pr checks 8", [PR], cwd).dirs, [sub]);
  });

  test("a PR it can't pin down: asks nothing, rather than note another PR", () => {
    for (const command of ["gh pr checks --interval 30 470", "gh pr view --json mergeable 470", "GH_REPO=o/x gh pr checks 5", "GH_HOST=h gh pr view 5", "gh -R o/r pr view 5"]) {
      const { told, asked } = conflict(command);
      assert.equal(told, undefined, command);
      assert.deepEqual(asked, [], command);
    }
  });

  test("says it once for a PR the command steps on twice", () => {
    const { told, asked } = conflict("gh pr view 12; gh pr checks 12 --watch");
    assert.equal(asked.length, 2);
    assert.equal(lines(told.additionalContext).length, 1);
  });

  test("not worked out yet: asks again 2 s later, and says what GitHub knows then", () => {
    const unknown = { ...PR, mergeable: "UNKNOWN", mergeStateStatus: "UNKNOWN" };
    const later = conflict("gh pr checks 12 --watch", [unknown, PR]);
    assert.equal(later.asked.length, 2);
    assert.match(later.told.additionalContext, /^PR #12 .* conflicts with main/);
    const still = conflict("gh pr checks 12 --watch", [unknown]);
    assert.equal(still.asked.length, 2);
    assert.match(still.told.additionalContext, /hasn't yet worked out whether PR #12 .*gh pr view 12 --json mergeable/);
    assert.equal(conflict("gh pr checks 12", [unknown, { ...PR, mergeable: "MERGEABLE", mergeStateStatus: "CLEAN" }]).told, undefined);
  });

  test("quiet: a PR that merges or is closed, gh failing, any other command", () => {
    for (const answer of [{ ...PR, mergeable: "MERGEABLE", mergeStateStatus: "CLEAN" }, { ...PR, state: "CLOSED" }, { ...PR, state: "MERGED" }, null]) {
      const { told, asked } = conflict("gh pr checks 12", [answer]);
      assert.equal(told, undefined, JSON.stringify(answer));
      assert.equal(asked.length, 1);
    }
    for (const command of ["git status", 'echo "gh pr checks 12"', "gh pr create --draft", "gh pr list", "gh issue view 12"]) {
      const { told, asked } = conflict(command);
      assert.equal(told, undefined, command);
      assert.deepEqual(asked, [], command);
    }
  });
});

// for settings-format's tests and the git hooks' below: the committed
// settings.json
const committed = readFileSync(join(HOOKS, "../settings.json"), "utf8");
// the same values in a hand-edited form: top-level keys reversed, indented by 4
const reorder = (settings) => JSON.stringify(Object.fromEntries(Object.entries(settings).reverse()), null, 4);
const reordered = reorder(JSON.parse(committed));

// runs `body` with the formatter's temp dirs in an empty dir of their own,
// and asserts none is left there, whether `body` throws or not
const leavesNoTemp = (body) => {
  const temp = scratchDir();
  const before = process.env.TMPDIR;
  process.env.TMPDIR = temp;
  try {
    return body(temp);
  } finally {
    if (before === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = before;
    assert.deepEqual(readdirSync(temp), [], "a temp dir was left behind");
  }
};

// settings-format.mjs, against the real `claude` on PATH (about 1 s a
// format) but for one stub, in throwaway dirs
describe("settings-format", () => {
  const format = (text) => leavesNoTemp(() => formatSettings(text));

  test("the committed settings.json is in Claude Code's form already: formatting it changes no byte", () => {
    assert.equal(format(committed), committed);
  });

  test("a hand-reordered file comes back as Claude Code writes it", () => {
    assert.equal(format(reordered), committed);
  });

  // the entry it flips goes back to its own value: a false one goes enable,
  // then disable
  test("a false enabledPlugins entry is flipped and comes back false", () => {
    const settings = JSON.parse(committed);
    const [first] = Object.keys(settings.enabledPlugins);
    settings.enabledPlugins[first] = false;
    const expected = committed.replace(`"${first}": true`, `"${first}": false`);
    assert.notEqual(expected, committed);
    assert.equal(format(reorder(settings)), expected);
  });

  test("it refuses, and throws, on invalid JSON or no entry to flip", () => {
    assert.throws(() => format(committed.slice(0, -10)), /^Error: not valid JSON/);
    assert.throws(() => format('{"model": "opus"}'), /^Error: no enabledPlugins entry to flip/);
    assert.throws(() => format('{"enabledPlugins": {"a@b": "yes"}}'), /^Error: no enabledPlugins entry to flip/);
  });


  test("the CLI formats a file in place, and leaves a file it refuses as it was", () => {
    const dir = scratchDir();
    const file = join(dir, "settings.json");
    const run = () => leavesNoTemp((temp) => runHook("settings-format", undefined, { args: [file], env: { ...process.env, TMPDIR: temp } }));
    writeFileSync(file, reordered);
    assert.equal(run().status, 0);
    assert.equal(readFileSync(file, "utf8"), committed);
    const broken = committed.slice(0, -10);
    writeFileSync(file, broken);
    const refused = run();
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /^settings-format: .*settings\.json: not valid JSON/);
    assert.equal(readFileSync(file, "utf8"), broken);
    assert.match(runHook("settings-format", undefined, { args: [] }).stderr, /Usage: node ~\/\.claude\/hooks\/settings-format\.mjs <file>/);
  });

  // a `claude` first on PATH with a migration, as 2.1.308 had: a flip in a
  // config dir with no migrations marked as run rewrites "opus" to
  // "opus[1m]", and `plugin list` (`migrated`) marks them; runs the CLI on
  // a file holding "opus", the result and the file after
  const withMigration = (migrated) => {
    const { bin } = fakeCommand(
      "claude",
      `[ "$2" = list ] && { ${migrated} > "$CLAUDE_CONFIG_DIR/.claude.json"; exit 0; }
grep -qs migrated "$CLAUDE_CONFIG_DIR/.claude.json" || sed -i 's/"opus"/"opus[1m]"/' "$CLAUDE_CONFIG_DIR/settings.json"`,
    );
    const file = join(scratchDir(), "settings.json");
    writeFileSync(file, '{"model": "opus", "enabledPlugins": {"a@b": true}}');
    const ran = leavesNoTemp((temp) =>
      runHook("settings-format", undefined, { args: [file], env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TMPDIR: temp } }),
    );
    return { ran, after: readFileSync(file, "utf8") };
  };

  test("Claude Code's migrations are marked as run before the file goes in, so a value they'd rewrite stays", () => {
    const { ran, after } = withMigration("echo '{\"migrated\": true}'");
    assert.equal(ran.status, 0, ran.stderr);
    assert.equal(JSON.parse(after).model, "opus");
  });

  test("the CLI refuses a file whose values Claude Code changes anyway, and leaves it as it was", () => {
    const { ran, after } = withMigration("echo '{}'");
    assert.equal(ran.status, 1);
    assert.match(ran.stderr, /^settings-format: .*settings\.json: Claude Code changed values, not only the form/);
    assert.equal(after, '{"model": "opus", "enabledPlugins": {"a@b": true}}');
  });
});

// the repo's .githooks, in throwaway repos: pre-commit runs settings-format
// on a staged home/.claude/settings.json (against the real `claude`), and
// post-commit re-stages the file after a `git commit -- <paths>`
describe("git hooks", () => {
  const SETTINGS = "home/.claude/settings.json";
  // a repo with this branch's git hooks and formatter, core.hooksPath set
  // as home.nix sets it, and settings.json committed in Claude Code's form
  // (with --no-verify: it is in that form already, and a format costs 1 s)
  const hookedRepo = () => {
    const repo = scratchDir();
    git(repo, "init", "-qb", "main");
    git(repo, "config", "core.hooksPath", ".githooks");
    mkdirSync(join(repo, ".githooks"));
    mkdirSync(join(repo, "home/.claude/hooks"), { recursive: true });
    const hooks = join(HOOKS, "../../../.githooks");
    for (const name of readdirSync(hooks)) copyFileSync(join(hooks, name), join(repo, ".githooks", name));
    for (const name of ["settings-format", "lib"])
      copyFileSync(join(HOOKS, `${name}.mjs`), join(repo, `home/.claude/hooks/${name}.mjs`));
    writeFileSync(join(repo, SETTINGS), committed);
    git(repo, "add", "-A");
    git(repo, "commit", "-qm", "start", "--no-verify");
    return repo;
  };
  // `git commit -qm c` in `cwd`, then `args`, with the formatter's temp
  // dirs in one checked empty after; its spawnSync result
  const commitIn = (cwd, ...args) =>
    leavesNoTemp((temp) =>
      spawnSync("git", ["commit", "-qm", "c", ...args], { cwd, encoding: "utf8", env: { ...process.env, TMPDIR: temp } }),
    );
  const shown = (cwd, object) => execFileSync("git", ["show", object], { cwd, encoding: "utf8" });
  // the committed settings with "model" set to sonnet: in Claude Code's
  // form, and hand-reordered
  const sonnet = committed.replace(/"model": "[^"]*"/, '"model": "sonnet"');
  const sonnetReordered = reorder({ ...JSON.parse(committed), model: "sonnet" });
  const stage = (repo, text) => {
    writeFileSync(join(repo, SETTINGS), text);
    git(repo, "add", SETTINGS);
  };

  test("does nothing when settings.json isn't staged", () => {
    const repo = hookedRepo();
    writeFileSync(join(repo, SETTINGS), reordered);
    writeFileSync(join(repo, "a.txt"), "a\n");
    git(repo, "add", "a.txt");
    assert.equal(commitIn(repo).status, 0);
    assert.equal(git(repo, "show", "HEAD:a.txt"), "a");
    assert.equal(readFileSync(join(repo, SETTINGS), "utf8"), reordered);
    assert.equal(git(repo, "diff", "--name-only", "HEAD~", "HEAD"), "a.txt");
  });

  test("formats a staged hand-reordered settings.json and commits Claude Code's form", () => {
    const repo = hookedRepo();
    stage(repo, sonnetReordered);
    const ran = commitIn(repo);
    assert.equal(ran.status, 0, ran.stderr);
    assert.notEqual(sonnet, committed);
    assert.equal(shown(repo, `HEAD:${SETTINGS}`), sonnet);
    assert.equal(readFileSync(join(repo, SETTINGS), "utf8"), sonnet);
    assert.equal(git(repo, "status", "--porcelain"), "");
  });

  test("refuses when settings.json has unstaged changes besides the staged ones", () => {
    const repo = hookedRepo();
    stage(repo, reordered);
    writeFileSync(join(repo, SETTINGS), reordered + "\n");
    const ran = commitIn(repo);
    assert.equal(ran.status, 1);
    assert.match(ran.stderr, /^pre-commit: home\/\.claude\/settings\.json has unstaged changes besides the staged ones; stage them/m);
    assert.equal(git(repo, "rev-list", "--count", "HEAD"), "1");
    assert.equal(readFileSync(join(repo, SETTINGS), "utf8"), reordered + "\n");
    assert.equal(shown(repo, `:${SETTINGS}`), reordered);
  });

  // git stages the named paths into the real index, then commits from a
  // temporary one that pre-commit formats; post-commit brings the real
  // index in line, or the hook's own unstaged check refuses the next
  // commit, and a --ff-only pull touching the file is refused (round 1 F2)
  test("after `git commit -- settings.json`, nothing is left staged or unstaged, and the next commit goes through", () => {
    const repo = hookedRepo();
    writeFileSync(join(repo, SETTINGS), sonnetReordered);
    const ran = commitIn(repo, "--", SETTINGS);
    assert.equal(ran.status, 0, ran.stderr);
    assert.equal(shown(repo, `HEAD:${SETTINGS}`), sonnet);
    assert.equal(readFileSync(join(repo, SETTINGS), "utf8"), sonnet);
    assert.equal(git(repo, "status", "--porcelain"), "");
    writeFileSync(join(repo, "a.txt"), "a\n");
    git(repo, "add", "a.txt");
    const next = commitIn(repo);
    assert.equal(next.status, 0, next.stderr);
    assert.equal(git(repo, "diff", "--name-only", "HEAD~", "HEAD"), "a.txt");
  });

  // pre-commit runs before the message is written: an edit made then
  // isn't the commit's, and post-commit leaves it unstaged
  test("after `git commit -- settings.json`, an edit made while the message was written stays unstaged", () => {
    const repo = hookedRepo();
    writeFileSync(join(repo, SETTINGS), sonnetReordered);
    const editor = `sh -c 'echo c > "$1"; echo "{}" > ${SETTINGS}' sh`;
    const ran = leavesNoTemp((temp) =>
      spawnSync("git", ["commit", "-q", "--", SETTINGS], {
        cwd: repo,
        encoding: "utf8",
        env: { ...process.env, TMPDIR: temp, GIT_EDITOR: editor },
      }),
    );
    assert.equal(ran.status, 0, ran.stderr);
    assert.equal(shown(repo, `HEAD:${SETTINGS}`), sonnet);
    assert.equal(readFileSync(join(repo, SETTINGS), "utf8"), "{}\n");
    assert.notEqual(shown(repo, `:${SETTINGS}`), "{}\n");
  });

  // the working file as staged, or back to HEAD's (which post-commit's
  // other checks alone would take for a --only commit of it)
  test("a settings.json staged on purpose stays staged as it was while other paths are committed", () => {
    for (const [working, status] of [
      [sonnetReordered, "M  home/.claude/settings.json"],
      [committed, "MM home/.claude/settings.json"],
    ]) {
      const repo = hookedRepo();
      stage(repo, sonnetReordered);
      writeFileSync(join(repo, SETTINGS), working);
      writeFileSync(join(repo, "a.txt"), "a\n");
      git(repo, "add", "a.txt");
      const ran = commitIn(repo, "--", "a.txt");
      assert.equal(ran.status, 0, ran.stderr);
      assert.equal(git(repo, "diff", "--name-only", "HEAD~", "HEAD"), "a.txt");
      assert.equal(shown(repo, `:${SETTINGS}`), sonnetReordered);
      assert.equal(readFileSync(join(repo, SETTINGS), "utf8"), working);
      assert.equal(git(repo, "status", "--porcelain", "--", SETTINGS), status);
    }
  });

  test("`git commit -a` commits Claude Code's form and leaves nothing staged or unstaged", () => {
    const repo = hookedRepo();
    writeFileSync(join(repo, SETTINGS), sonnetReordered);
    const ran = commitIn(repo, "-a");
    assert.equal(ran.status, 0, ran.stderr);
    assert.equal(shown(repo, `HEAD:${SETTINGS}`), sonnet);
    assert.equal(git(repo, "status", "--porcelain"), "");
  });

  // a relative core.hooksPath resolves in each linked worktree, to its own hook
  test("works in a linked worktree", () => {
    const repo = hookedRepo();
    const tree = join(scratchDir(), "wt");
    git(repo, "worktree", "add", "-qb", "wt", tree);
    stage(tree, reordered);
    const ran = commitIn(tree);
    assert.equal(ran.status, 0, ran.stderr);
    assert.equal(shown(tree, `HEAD:${SETTINGS}`), committed);
    assert.equal(git(tree, "status", "--porcelain"), "");
  });

  test("stops the commit, saying why, when the formatter refuses", () => {
    const repo = hookedRepo();
    stage(repo, committed.slice(0, -10));
    const ran = commitIn(repo);
    assert.equal(ran.status, 1);
    assert.match(ran.stderr, /^settings-format: home\/\.claude\/settings\.json: not valid JSON/m);
    assert.match(ran.stderr, /^pre-commit: .* so nothing was committed$/m);
    assert.equal(git(repo, "rev-list", "--count", "HEAD"), "1");
  });
});
