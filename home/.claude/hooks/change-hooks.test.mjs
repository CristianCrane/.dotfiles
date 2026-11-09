// The change hooks' cases (CristianCrane/.dotfiles#10): the gates'
// (survey-gate, review-gate, agent-gate), each fed to the hook as Claude
// Code runs it (`node <hook>.mjs`, the tool call's JSON on stdin, in a
// scratch repo), and below them plain tests of lib's cwdFor and of how
// copy.mjs and sync.mjs register a repo's copy. Run from the repo root:
//
//   node --test 'home/.claude/hooks/*.test.mjs'
//
// (quoted, so node expands the glob: Node 24 runs a bare directory as one
// failing file). The hooks are this file's neighbours, never ~/.claude's,
// so a copy of it in a checkout of an older commit tests that commit's
// hooks. Never copied into repos (copy.mjs lists what is).
//
// A gate's case is a row: [state, command, expected]. The command's <body>,
// <repo> and <outside> stand for the state's paths; expected is THROUGH or
// the gist of the turn-down, so a case held for one reason can't pass for
// another. Every state with a through row has a row it holds too (a test
// below checks), so a hook that fails silently (lib's `hook()` swallows
// errors) can't pass a through case.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { repoCopy, repoHooks } from "./copy.mjs";
import { cwdFor, stateFile } from "./lib.mjs";

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
// given: `review` writes one of HEAD, `lessons` and `body` their text
const scratchRepo = ({ review = false, lessons, body } = {}) => {
  const repo = scratchDir();
  git(repo, "init", "-qb", "main");
  commit(repo, "a.txt", "a\n");
  git(repo, "switch", "-qc", BRANCH);
  commit(repo, "b.txt", "b\n");
  const head = git(repo, "rev-parse", "--short", "HEAD");
  if (review) write(repo, "review", `# Change review: ${BRANCH} @ ${head}, round 1, 0 open change findings\n`);
  if (lessons !== undefined) write(repo, "lessons", lessons);
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
  // agent-gate reads only the tool call
  agent: ["agent-gate", () => ({ repo: scratchDir() })],
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

  // what runs before gh: a prefix or wrapper is gated, a mention isn't
  ...[`FOO="a b"`, `FOO='a b'`, "env", "command", "time", "nohup", "exec"].map((prefix) => [
    "noLessons",
    `${prefix} gh pr ready`,
    NO_LESSONS,
  ]),
  ["noLessons", "echo env gh pr ready", THROUGH],
  ["noLessons", `git commit -m "then gh pr ready"`, THROUGH],

  // agent-gate: the command is the Agent call's isolation, if any
  ["agent", "worktree", /Spawn it without `isolation`/],
  ["agent", "", THROUGH],

  // survey-gate: the command is the edited file
  ["noSurvey", "<repo>/b.txt", NO_SURVEY],
  ["noSurvey", "<outside>/link.txt", NO_SURVEY], // a symlink into the checkout: gated like its target
  ["noSurvey", "<outside>/c.txt", THROUGH], // outside any checkout
];

// each gate's tool call, from a row's command
const TOOL_INPUT = {
  "review-gate": (command) => ({ command }),
  "survey-gate": (file_path) => ({ file_path, content: "x\n" }),
  "agent-gate": (isolation) => ({ prompt: "x", ...(isolation && { isolation }) }),
};

// the hook's answer to the case's tool call: the deny reason, or null
const answer = (hookName, state, command) => {
  const filled = command.replace(/<(body|repo|outside)>/g, (_, name) => state[name]);
  const toolInput = TOOL_INPUT[hookName](filled);
  const cwd = filled.startsWith(state.outside ?? "\0") ? state.outside : state.repo;
  const ran = spawnSync(process.execPath, [join(HOOKS, `${hookName}.mjs`)], {
    input: JSON.stringify({ tool_input: toolInput, cwd, session_id: "s" }),
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
      test(`${command}: ${expected ? "held" : "through"}`, () => {
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
