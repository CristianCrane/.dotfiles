// The change hooks' cases (CristianCrane/.dotfiles#10): the gates'
// (survey-gate, review-gate, agent-gate, process-gate, scratch-gate,
// reviewer-gate), each fed to the hook as Claude Code runs it (`node
// <hook>.mjs`, the tool call's JSON on stdin, with the input fields
// MORE_INPUT adds, in a scratch repo), and below them plain tests of
// scratch-gate at a subagent's start, reviewer-gate's other callers, the
// survey gate on main (one survey per change), a dictated settings
// change, a prototype branch, lib's cwdFor and
// substitutions, how copy.mjs and sync.mjs register a repo's copy, the
// scripts' flags, prune-merged (the SessionStart hook that removes merged
// work) and usage (the ledger of tokens spent). Run from
// the repo root:
//
//   node --test 'home/.claude/hooks/*.test.mjs'
//
// (quoted, so node expands the glob: Node 24 runs a bare directory as one
// failing file). The hooks are this file's neighbours, never ~/.claude's,
// so a copy of it in a checkout of an older commit tests that commit's
// hooks. Never copied into repos (copy.mjs lists what is).
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
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { repoCopy, repoHooks } from "./copy.mjs";
import { cwdFor, lines, stateFile, substitutions, workOf } from "./lib.mjs";

const HOOKS = dirname(fileURLToPath(import.meta.url));
const BRANCH = "feature";

// git, here and in the hooks, reads none of the machine's config
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

// one of the change skill's files for BRANCH, where lib looks for it
const write = (repo, kind, text) => {
  const path = stateFile(repo, kind, BRANCH);
  writeFileSync(path, text);
  return path;
};

// a repo on BRANCH, one commit past main, with the change skill's files
// given: `review` writes one of HEAD (a string: its findings, after the
// header; `header` replaces the header's words after the sha), `lessons`
// and `body` their text (`body` may take HEAD's full sha)
const scratchRepo = ({ review = false, header = "round 1, 0 open change findings", lessons, body } = {}) => {
  const repo = scratchDir();
  git(repo, "init", "-qb", "main");
  commit(repo, "a.txt", "a\n");
  git(repo, "switch", "-qc", BRANCH);
  commit(repo, "b.txt", "b\n");
  const head = git(repo, "rev-parse", "--short", "HEAD");
  if (review)
    write(repo, "review", `# Change review: ${BRANCH} @ ${head}, ${header}\n${review === true ? "" : review}`);
  if (lessons !== undefined) write(repo, "lessons", lessons);
  if (typeof body === "function") body = body(git(repo, "rev-parse", "HEAD"));
  return { repo, body: body === undefined ? undefined : write(repo, "pr-body", body) };
};

const ROUTED = "- A lesson → home/.claude/CLAUDE.md\n";
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
  // the costs ruled out after the lessons (the lessons skill's step 5)
  lessonsRuledOut: ["review-gate", () => scratchRepo({ review: true, lessons: `${ROUTED}\nRuled out:\n- F1 a cost: one quick fix\n` })],
  lessonsOnlyRuledOut: ["review-gate", () => scratchRepo({ review: true, lessons: "Ruled out (none of the costs is a lesson):\n- F1 a cost: one quick fix\n" })],
  lessonsRuledOutEmpty: ["review-gate", () => scratchRepo({ review: true, lessons: "Ruled out:\n" })],
  // a lesson with no → before None: (None: once let the whole file through)
  lessonUnroutedNone: ["review-gate", () => scratchRepo({ review: true, lessons: "- A lesson\nNone: the rest\n" })],
  // a lessons commit after the review, with no recheck of it
  staleReview: [
    "review-gate",
    () => {
      const state = scratchRepo({ review: true, lessons: ROUTED });
      commit(state.repo, "lessons.md", "a lesson\n");
      return state;
    },
  ],
  // ready to open as a draft: a review and a PR body, no lessons
  createDraft: ["review-gate", () => scratchRepo({ review: true, body: BODY })],
  noReview: ["review-gate", () => scratchRepo({ lessons: ROUTED, body: BODY })],
  // a review with findings, and a PR body answering them in each form the
  // reviewer's template has
  answered: [
    "review-gate",
    () =>
      scratchRepo({
        review: "## Findings\nF1. [change] a\nF2. [text] b\nF3. [change] c\n",
        body: (head) =>
          prBody(head, `- Review: F1 a → fixed in ${head.slice(0, 7)}\n- Review: F2 b → fixed in the survey\n- Review: F3 c → answered: the user ruled\n`),
      }),
  ],
  // each kind of line that doesn't answer its finding, F1 to F4
  unanswered: [
    "review-gate",
    () =>
      scratchRepo({
        review: "## Findings\nF1. [change] a\nF2. [text] b\nF3. [change] c\nF4. [change] d\n",
        body: (head) =>
          prBody(head, "- Review: F1 a → fixed in deadbee0\n- Review: F2 b → fixed: #313's body revised\n- Review: F3 c → answered on #266\n"),
      }),
  ],
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
  // review headers the gate must read (dotfiles#12), and one it can't
  ...Object.fromEntries(
    Object.entries({
      headerAside: "round 2 (with a recheck of 037bf37), 0 open change findings",
      headerAsideOpen: "round 2 (with a recheck of 037bf37), 1 open change findings",
      headerRecheck: "recheck of round 2, 0 open change findings",
      headerNoRound: "plan, 0 open change findings",
    }).map(([name, header]) => [name, ["review-gate", () => scratchRepo({ review: true, header, body: BODY })]]),
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
    }).map(([name, parts]) => [name, ["review-gate", () => scratchRepo({ review: true, body: (head) => prBody(head, undefined, parts(head)) })]]),
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
  ["lessonNoArrow", "gh pr ready", /1 lesson\(s\) that don't say where they went/],
  ["lessonsEmpty", "gh pr ready", /lists none/],
  ["ready", "gh pr ready", THROUGH],
  ["lessonsNone", "gh pr ready", THROUGH],
  ["lessonsRuledOut", "gh pr ready", THROUGH],
  ["lessonsOnlyRuledOut", "gh pr ready", THROUGH],
  ["lessonsRuledOut", "gh pr ready 12", NAMED],
  ["lessonsOnlyRuledOut", "gh pr ready 12", NAMED],
  ["lessonsRuledOutEmpty", "gh pr ready", /lists none/],
  ["lessonUnroutedNone", "gh pr ready", /1 lesson\(s\) that don't say where they went/],
  ["lessonsNone", "gh pr ready 12", NAMED],
  ["noLessons", "gh pr ready --undo", THROUGH],
  ["staleReview", "gh pr ready", /it reviewed [0-9a-f]+, and the commits since change more than comment lines/],

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
  ["unanswered", "gh pr create --draft --body-file <body>", /F1: `fixed in deadbee0` is no commit on this branch: after a rebase or an amend, give the new sha; a fix that landed elsewhere \(main, another PR\) is `answered: <where>`/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F2: it says fixed, but in no commit on this branch: a fix to the survey's text is `fixed in the survey`/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F3: `answered` takes a colon/],
  ["unanswered", "gh pr create --draft --body-file <body>", /F4: no line names it/],

  // what runs before gh: a prefix or wrapper is gated, a mention isn't
  ...[`FOO="a b"`, `FOO='a b'`, "env", "command", "time", "nohup", "exec"].map((prefix) => [
    "noLessons",
    `${prefix} gh pr ready`,
    NO_LESSONS,
  ]),
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

  ["headerAside", "gh pr create --draft --body-file <body>", THROUGH],
  ["headerAside", "gh pr create --body-file <body>", NO_LESSONS],
  ["headerAsideOpen", "gh pr create --draft --body-file <body>", /round 2 left 1 change finding\(s\) open/],
  ["headerRecheck", "gh pr create --draft --body-file <body>", THROUGH],
  ["headerRecheck", "gh pr create --body-file <body>", NO_LESSONS],
  ["headerNoRound", "gh pr create --draft --body-file <body>", /its first line reads `# Change review: <branch> @ <short sha>, round <n>, <k> open change findings`/],

  // agent-gate: the command is the Agent call's isolation, if any
  ["agent", "worktree", /Spawn it without `isolation`/],
  ["agent", "", THROUGH],

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
  "agent-gate": (isolation) => ({ prompt: "x", ...(isolation && { isolation }) }),
  "process-gate": (command) => ({ command }),
  "scratch-gate": (call) => (call.startsWith("/") ? { file_path: call, content: "x\n" } : { command: call }),
  "reviewer-gate": (call) => (call.startsWith("/") ? { file_path: call, content: "x\n" } : { command: call }),
};

// what else a gate reads from the hook's input
const MORE_INPUT = {
  "scratch-gate": (state) => ({ agent_id: AGENT, scratchpad_dir: state.repo }),
  "reviewer-gate": () => ({ agent_id: AGENT, agent_type: "change-reviewer" }),
};

// the hook's answer to the case's tool call: the deny reason, or null
const answer = (hookName, state, command) => {
  const filled = command.replace(/<(body|repo|outside|own)>/g, (_, name) => state[name]);
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

// sync.mjs registers in a repo the entries of settings.json that run a
// copied hook, and nothing else (round 1 F4: any other entry came out as
// a hook named undefined)
test("repoHooks: only settings.json's entries that run a copied hook", () => {
  const command = (name) => ({ type: "command", command: `node "$HOME/.claude/hooks/${name}.mjs"` });
  const settings = {
    hooks: {
      PreToolUse: [
        { matcher: "Bash", hooks: [command("review-gate")] },
        { matcher: "Agent", hooks: [command("agent-gate"), { type: "command", command: "echo hi" }] },
        { matcher: "Read", hooks: [command("user-only")] },
      ],
      SessionStart: [{ hooks: [command("stale-copy")] }],
      Stop: [{ hooks: [{ type: "prompt", prompt: "done?" }] }],
    },
  };
  assert.deepEqual(repoHooks(settings), {
    PreToolUse: [
      ["Bash", "review-gate"],
      ["Agent", "agent-gate"],
    ],
  });
});

// a repo's copy reads stale when its registered hooks differ from what a
// sync writes, not only its files (round 1 F6)
test("repoCopy: current after a sync, stale once a registered hook differs", () => {
  const { repo } = scratchRepo();
  assert.equal(runHook("sync", undefined, { args: [repo] }).status, 0);
  assert.equal(repoCopy(repo), "current");
  const file = join(repo, ".claude/settings.json");
  const settings = JSON.parse(readFileSync(file, "utf8"));
  settings.hooks.PreToolUse.find((group) => group.matcher === "Bash").matcher = "Read";
  writeFileSync(file, JSON.stringify(settings));
  assert.equal(repoCopy(repo), "stale");
});

// a flag isn't a repo: sync says how it runs, not a stack trace from git
// in a folder named --help
test("sync: a flag it doesn't know says how it runs, and copies nothing", () => {
  const { repo } = scratchRepo();
  const ran = runHook("sync", undefined, { args: ["--help"], cwd: repo });
  assert.equal(ran.status, 1);
  assert.match(ran.stderr, /^sync: .*'--help'.*\nUsage: node ~\/\.claude\/hooks\/sync\.mjs \[repo\]$/m);
  assert.ok(!existsSync(join(repo, ".claude/hooks/change")));
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

// reviewer-gate holds the change-reviewer only: the same calls from the
// main session or another agent go through
test("reviewer-gate: other callers' calls through", () => {
  const { repo } = scratchRepo();
  const run = (input) => runHook("reviewer-gate", { cwd: repo, ...input }).stdout;
  for (const tool_input of [{ command: "pnpm test:change" }, { file_path: join(repo, "b.txt"), content: "x" }]) {
    assert.notEqual(run({ tool_input, agent_id: AGENT, agent_type: "change-reviewer" }), ""); // held for the reviewer
    assert.equal(run({ tool_input }), "");
    assert.equal(run({ tool_input, agent_id: AGENT, agent_type: "general-purpose" }), "");
  }
});

// on main, a survey covers one change: its files are keyed by the session
// and where HEAD meets origin, so they hold through the change's unpushed
// commits and a fetch of others' work, and a pushed change's next edit
// needs a new survey (the old gate let it ride the first one's: red on it).
// With no origin, the session alone, as before
test("survey-gate on main: one survey per change, until it's pushed", () => {
  const edit = (repo) => {
    const ran = runHook("survey-gate", {
      tool_input: { file_path: join(repo, "b.txt"), content: "x\n" },
      cwd: repo,
      session_id: "s",
    });
    return ran.stdout.trim() ? JSON.parse(ran.stdout).hookSpecificOutput.permissionDecisionReason : null;
  };
  // main with a reviewed survey for the change about to start
  const started = ({ origin = true } = {}) => {
    const repo = scratchDir();
    git(repo, "init", "-qb", "main");
    commit(repo, "b.txt", "b\n");
    const bare = origin && withOrigin(repo);
    const { key } = workOf(repo, { session_id: "s" });
    writeFileSync(stateFile(repo, "survey", key), "Change: b.\nFiles: b.txt\n");
    writeFileSync(stateFile(repo, "plan-review", key), "# Change review: main, plan\n");
    return { repo, bare };
  };

  const { repo: unpushed } = started();
  commit(unpushed, "b.txt", "b2\n");
  assert.equal(edit(unpushed), null, "a review round's fix, after the change's first commit");

  const { repo: fetched, bare } = started();
  const other = join(scratchDir(), "other");
  git(fetched, "clone", "-q", bare, other);
  commit(other, "c.txt", "c\n");
  git(other, "push", "-q", "origin", "main");
  git(fetched, "fetch", "-q", "origin");
  assert.equal(edit(fetched), null, "others' work fetched, not merged");

  const { repo: landed } = started();
  commit(landed, "b.txt", "b2\n");
  git(landed, "push", "-q", "origin", "main");
  const reason = edit(landed);
  assert.notEqual(reason, null, "the next change rode the pushed one's survey");
  assert.match(reason, new RegExp(`there is no survey for main: .* ${stateFile(landed, "survey", workOf(landed, { session_id: "s" }).key)}`));

  const { repo: local } = started({ origin: false });
  commit(local, "b.txt", "b2\n");
  assert.equal(workOf(local, { session_id: "s" }).key, "main-s");
  assert.equal(edit(local), null, "no origin: the session's survey, as before");
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
  write(plain.repo, "lessons", "Ruled out:\n- none: dictated\n");
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

  // a fake gh in a folder of its own: the repo and its PRs, or, `down`, the
  // error gh gives offline
  const fakeGh = (prs, down = false) => {
    const bin = scratchDir();
    writeFileSync(join(bin, "prs.json"), JSON.stringify(prs));
    const answer = down
      ? `console.error("error connecting to api.github.com"); process.exit(1);`
      : `console.log(process.argv[2] === "api"
           ? JSON.stringify({ data: { viewer: { login: "me" }, repository: { defaultBranchRef: { name: "main" } } } })
           : require("fs").readFileSync(__dirname + "/prs.json", "utf8"));`;
    writeFileSync(join(bin, "gh"), `#!/usr/bin/env node\n${answer}\n`, { mode: 0o755 });
    return bin;
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
    return { dir, main, bin: fakeGh(prs) };
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
    const offline = fakeGh([], true);
    const hooked = prune(offline, main, "--hook");
    assert.equal(hooked.status, 0);
    assert.equal(hooked.stdout, "");
    assert.deepEqual(worktreeNames(main).sort(), ["done", "live", "main"]);
    // by hand, it says why it couldn't run
    const byHand = prune(offline, main);
    assert.equal(byHand.status, 1);
    assert.match(byHand.stderr, /^prune-merged: error connecting to api\.github\.com$/m);
  });
  // a branch brought into main with no PR (the dotfiles' own way, round 1
  // F8) goes like a merged one; an unmerged worktree moved by `mv` keeps
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
    // an agent's transcript and meta.json, and its stop
    const agent = (id, entries, meta) => {
      const transcript = join(project, `s1/subagents/agent-${id}.jsonl`);
      appendFileSync(transcript, typeof entries === "string" ? entries : jsonl(entries));
      if (meta) writeFileSync(transcript.replace(/\.jsonl$/, ".meta.json"), JSON.stringify(meta));
      return run(["--hook"], {
        hook_event_name: "SubagentStop",
        session_id: "s1",
        cwd: "/w/repo",
        agent_id: id,
        agent_type: "general-purpose",
        agent_transcript_path: transcript,
        effort: { level: "high" },
        last_assistant_message: "a reply the ledger never keeps",
      });
    };
    const session = (id, entries) => {
      const transcript = join(project, `${id}.jsonl`);
      appendFileSync(transcript, jsonl(entries));
      return run(["--hook"], { hook_event_name: "Stop", session_id: id, cwd: "/w/repo", transcript_path: transcript });
    };
    // the plan's windows as a status line's input gives them: each window's
    // used % and when it resets, in hours from now
    const windows = (week, fiveHour) => {
      const window = ([used_percentage, hours]) => ({ used_percentage, resets_at: Math.round(Date.now() / 1000 + hours * 3600) });
      return run(["--status"], { rate_limits: { ...(week && { seven_day: window(week) }), ...(fiveHour && { five_hour: window(fiveHour) }) } });
    };
    const readings = () => {
      const file = join(home, ".claude/usage/windows.jsonl");
      return existsSync(file) ? lines(readFileSync(file, "utf8")).map((line) => JSON.parse(line)) : [];
    };
    return { home, run, ledger, agent, session, windows, readings };
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
      { ...stops[0], at: undefined },
      { kind: "agent", at: undefined, session: "s1", agent: "a1", parent: null, depth: 1, type: "general-purpose", description: "Fix issue 1", effort: "high", cwd: "/w/repo" },
    );
    assert.doesNotMatch(JSON.stringify(rows), /never keeps/);
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
    const { run, agent, windows } = scratch();
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
    assert.equal(run(["--agent", "a1"]).stdout, "Tokens: about 20% of the week, about 8% of this 5-hour window (this agent and the 2 it started)\n");
    assert.equal(run(["--agent", "b1"]).stdout, "Tokens: about 30% of the week, about 12% of this 5-hour window (this agent)\n");
    assert.equal(run(["--agent", "c1"]).stdout, "Tokens: under 1% of the week, under 1% of this 5-hour window (this agent)\n");
    // a 5-hour window that began after the work
    windows(null, [1, 5.5]);
    assert.equal(run(["--agent", "a1"]).stdout, "Tokens: about 20% of the week, none of this 5-hour window (this agent and the 2 it started)\n");
  });

  test("--agent: a window with no reading, or one that has reset, is left out and the line says why", () => {
    const { run, agent, windows } = scratch();
    agent("a1", said("m1", 1_000_000), { description: "Fix issue 1", spawnDepth: 1 });
    windows([50, 100]);
    assert.equal(run(["--agent", "a1"]).stdout, "Tokens: about 50% of the week (this agent); no reading of this 5-hour window yet\n");
    windows(null, [20, -1]);
    assert.equal(run(["--agent", "a1"]).stdout, "Tokens: about 50% of the week (this agent); this 5-hour window has reset since its last reading\n");
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
      ran.stdout,
      "Tokens: 6.0M cache read, 30 cache write, 15 output, 3 input over 3 turns (this agent and the 2 it started); " +
        "no reading of the week yet; no reading of this 5-hour window yet; " +
        "not counted: up to 2 progress summaries Claude Code forked while it ran\n",
    );
    assert.match(run(["--agent", "b1"]).stdout, /; not counted: up to 2 progress summaries/);
    assert.match(run(["--agent", "x1"]).stdout, /^Tokens: 3\.0M cache read.* over 1 turn \(this agent\); no reading of the week yet/m);
    const none = run(["--agent", "zz"]);
    assert.equal(none.status, 1);
    assert.equal(none.stdout, "No usage recorded for agent zz.\n");
  });

  // a resumed session's transcript repeats the earlier one's messages
  test("--since: each workstream and main session, a message in two transcripts counted once", () => {
    const { run, agent, session } = scratch();
    session("s1", said("m1", 500));
    session("s2", [...said("m1", 500), ...said("m2", 700)]);
    agent("a1", said("m3", 100), { description: "Fix issue 1", spawnDepth: 1 });
    agent("r1", said("m4", 50), { description: "Round 1 review", spawnDepth: 2, parentAgentId: "a1" });
    const ran = run([]);
    assert.equal(ran.status, 0, ran.stderr);
    const table = ran.stdout.split("\n").map((line) => line.split(/\s{2,}/));
    assert.deepEqual(table[1], ["", "turns", "cache read", "cache write", "output", "input", "agents"]);
    assert.deepEqual(table[2], ["main s2 repo", "1", "700", "10", "5", "1", ""]);
    assert.deepEqual(table[3], ["main s1 repo", "1", "500", "10", "5", "1", ""]);
    assert.deepEqual(table[4], ["Fix issue 1", "2", "150", "20", "10", "2", "2"]);
    assert.deepEqual(table[5], ["total", "4", "1k", "40", "20", "4", ""]);
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

  test("a flag it doesn't know runs nothing", () => {
    const { run } = scratch();
    const typo = run(["--sinse", "2026-11-10"]);
    assert.equal(typo.status, 1);
    assert.match(typo.stderr, /^usage: .*'--sinse'.*\nUsage: node ~\/\.claude\/hooks\/usage\.mjs \[--agent <id>\] \[--since <YYYY-MM-DD>\]$/m);
    assert.equal(run(["--since", "11/10"]).status, 1);
  });
});
