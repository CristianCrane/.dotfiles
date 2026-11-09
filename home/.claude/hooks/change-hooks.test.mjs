// The change hooks' cases (CristianCrane/.dotfiles#10): the gates'
// (survey-gate, review-gate, agent-gate, process-gate, scratch-gate), each
// fed to the hook as Claude Code runs it (`node <hook>.mjs`, the tool
// call's JSON on stdin, with the input fields MORE_INPUT adds, in a
// scratch repo), and below them plain tests of scratch-gate at a
// subagent's start, of lib's cwdFor, of how copy.mjs and sync.mjs register
// a repo's copy, and of prune-merged (the SessionStart hook that removes
// merged work). Run from the repo root:
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
import { cwdFor, lines, stateFile } from "./lib.mjs";

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
// and `body` their text (`body` may take HEAD's sha)
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
  if (typeof body === "function") body = body(head);
  return { repo, body: body === undefined ? undefined : write(repo, "pr-body", body) };
};

const ROUTED = "- A lesson → home/.claude/CLAUDE.md\n";
const BODY = "## Change\n- New: nothing\n";

// each state: the hook it feeds, and how its scratch repo is built
const STATES = {
  ready: ["review-gate", () => scratchRepo({ review: true, lessons: ROUTED })],
  noLessons: ["review-gate", () => scratchRepo({ review: true })],
  lessonNoArrow: ["review-gate", () => scratchRepo({ review: true, lessons: "- A lesson\n" })],
  lessonsEmpty: ["review-gate", () => scratchRepo({ review: true, lessons: "" })],
  lessonsNone: ["review-gate", () => scratchRepo({ review: true, lessons: "None: a one-line fix\n" })],
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
          `## Change\n- Review: F1 a → fixed in ${head}\n- Review: F2 b → fixed in the survey\n- Review: F3 c → answered: the user ruled\n`,
      }),
  ],
  // each kind of line that doesn't answer its finding, F1 to F4
  unanswered: [
    "review-gate",
    () =>
      scratchRepo({
        review: "## Findings\nF1. [change] a\nF2. [text] b\nF3. [change] c\nF4. [change] d\n",
        body: "## Change\n- Review: F1 a → fixed in deadbee0\n- Review: F2 b → fixed: #313's body revised\n- Review: F3 c → answered on #266\n",
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
const SELF_MATCH = /match this command's own shell/;
const AGENT = "a1";
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
  ...["2>&1", "&>/dev/null", ">/dev/null 2>&1", "| tail -1", "&& echo done", "& wait"].map((rest) => [
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
};

// what else a gate reads from the hook's input
const MORE_INPUT = {
  "scratch-gate": (state) => ({ agent_id: AGENT, scratchpad_dir: state.repo }),
};

// the hook's answer to the case's tool call: the deny reason, or null
const answer = (hookName, state, command) => {
  const filled = command.replace(/<(body|repo|outside|own)>/g, (_, name) => state[name]);
  const toolInput = TOOL_INPUT[hookName](filled);
  const cwd = filled.startsWith(state.outside ?? "\0") ? state.outside : state.repo;
  const ran = spawnSync(process.execPath, [join(HOOKS, `${hookName}.mjs`)], {
    input: JSON.stringify({ tool_input: toolInput, cwd, session_id: "s", ...MORE_INPUT[hookName]?.(state) }),
    encoding: "utf8",
  });
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
  execFileSync(process.execPath, [join(HOOKS, "sync.mjs"), repo]);
  assert.equal(repoCopy(repo), "current");
  const file = join(repo, ".claude/settings.json");
  const settings = JSON.parse(readFileSync(file, "utf8"));
  settings.hooks.PreToolUse.find((group) => group.matcher === "Bash").matcher = "Read";
  writeFileSync(file, JSON.stringify(settings));
  assert.equal(repoCopy(repo), "stale");
});

// scratch-gate at a subagent's start: it makes the agent's folder and
// names it; the main session's calls (no agent_id), and a session with no
// scratchpad, go through
test("scratch-gate: a subagent's folder, made and named at its start; the main session's calls through", () => {
  const root = scratchDir();
  const run = (input) =>
    spawnSync(process.execPath, [join(HOOKS, "scratch-gate.mjs")], { input: JSON.stringify(input), encoding: "utf8" }).stdout;
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
  assert.equal(cwdFor({ tool_input: { file_path: join(repo, "b.txt") }, cwd: outside }), repo);
});

// prune-merged.mjs, run by hand and as the SessionStart hook, on a scratch
// repo whose origin stands for GitHub (a bare repo, reached from a
// github.com URL by insteadOf) and a fake `gh` first on PATH, answering
// with the scratch repo's PRs
describe("prune-merged", () => {
  const PRUNE = join(HOOKS, "prune-merged.mjs");
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
    const origin = join(dir, "origin.git");
    git(dir, "init", "-q", "--bare", "-b", "main", origin);
    const main = join(dir, "main");
    git(dir, "init", "-q", "-b", "main", main);
    git(main, "config", `url.${origin}.insteadOf`, "https://github.com/o/r");
    git(main, "remote", "add", "origin", "https://github.com/o/r");
    commit(main, "a.txt", "a\n");
    git(main, "push", "-q", "origin", "main");
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
    spawnSync(process.execPath, [PRUNE, ...args], {
      cwd,
      encoding: "utf8",
      input: args.includes("--hook") ? JSON.stringify({ hook_event_name: "SessionStart", cwd, session_id: "s" }) : undefined,
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
