// Before `gh pr checks` (--watch too), `gh pr view`, `gh pr ready` or
// `gh pr merge`, asks GitHub whether that PR conflicts with its base and,
// when it does, tells the agent: GitHub runs no `pull_request` CI on a PR
// that conflicts, so its short list of checks (only CodeQL's) says
// nothing, passing or not. A note, never a turn-down. It runs before the
// command, so the note reaches the agent whether the command passes or
// fails (`gh pr checks` exits 8 while checks are pending, and PostToolUse
// runs only on success; tried live on 2026-11-19, a scratch PR's note came
// with a passing `gh pr view` and with `gh pr checks` exiting 8). Just
// after a push GitHub hasn't worked the answer out (UNKNOWN on that PR at
// once, CONFLICTING 1.7 s later), so it asks again 2 s later, and if it
// still doesn't know, says so. Read in Bash and Monitor commands. Quiet
// for any other command, a PR that merges cleanly or is closed, a PR it
// can't pin down (see selectorOf), and when gh fails.
import { execFileSync } from "node:child_process";
import { context, dirOf, hook, masked, positional, prArgs, prStep, unquote, WORD } from "./lib.mjs";

const STEP = prStep("checks", "view", "ready", "merge");

// each gh call's limit, the wait before asking again, and the time all of
// it may take, inside the settings entry's 10 s
const LIMIT = 3000;
const WAIT = 2000;
const BUDGET = 9000;

// the `gh pr view` arguments for the PR a step names, read in one shape:
// `gh pr <verb> [<number|url|branch>]` with any -R/--repo, the PR being the
// first word after the verb once -R's are out (none: the branch checked
// out). Any other spelling could name another PR, and a note about the
// wrong PR is worse than none, so it gives null: GH_REPO or GH_HOST in the
// command (the hook's own gh wouldn't get them), gh flags before `pr`, a
// word that isn't a flag after a flag (a flag's value, or a PR named late:
// `--interval 30 470`). Words are read in the masked text with redirects
// blanked, and each word's text from the original
const selectorOf = (command, hidden, step) => {
  const { end, args, elsewhere } = prArgs(command, hidden, step);
  if (elsewhere) return null;
  const words = [...args.matchAll(WORD)].map((word) => unquote(command.slice(end + word.index, end + word.index + word[0].length)));
  const repo = [];
  const rest = [];
  for (let at = 0; at < words.length; at++) {
    if (words[at] === "-R" || words[at] === "--repo") repo.push("--repo", words[++at]);
    else if (/^(?:-R|--repo=)./.test(words[at])) repo.push("--repo", words[at].replace(/^(?:-R|--repo=)/, ""));
    else rest.push(words[at]);
  }
  if (repo.includes(undefined)) return null;
  const named = positional(rest);
  if (named.length && named[0] !== rest[0]) return null;
  return [...named.slice(0, 1), ...repo];
};

// what GitHub says of the PR, or null when gh can't say (or there's no
// time left to ask)
const statusOf = (cwd, selector, left) => {
  if (left < 500) return null;
  try {
    return JSON.parse(
      execFileSync("gh", ["pr", "view", ...selector, "--json", "number,state,mergeable,mergeStateStatus,baseRefName,headRefName"], {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: Math.min(LIMIT, left),
      }),
    );
  } catch {
    return null;
  }
};

// the note for an open PR, or null when it merges cleanly
const noteOf = (pr) => {
  const { number, baseRefName: base, headRefName: head } = pr;
  if (pr.mergeable === "CONFLICTING")
    return `PR #${number} (${head} into ${base}) conflicts with ${base} (mergeable: CONFLICTING, mergeStateStatus: ${pr.mergeStateStatus}): GitHub runs no \`pull_request\` CI on a PR that conflicts with its base, so its checks (only CodeQL's, if any) say nothing about it, passing or not. Merge origin/${base} into ${head}, resolve, push, and watch the checks again.`;
  if (pr.mergeable === "UNKNOWN")
    return `GitHub hasn't yet worked out whether PR #${number} (${head} into ${base}) conflicts with ${base} (mergeable: UNKNOWN, as it is just after a push). A PR that conflicts runs no \`pull_request\` CI, so before trusting a short list of checks (only CodeQL's), check \`gh pr view ${number} --json mergeable\`: CONFLICTING means merge origin/${base} into ${head}, push, and watch again.`;
  return null;
};

hook((input) => {
  const command = input.tool_input?.command ?? "";
  const hidden = masked(command);
  const notes = new Map();
  const deadline = Date.now() + BUDGET;
  const left = () => deadline - Date.now();
  for (const step of hidden.matchAll(STEP)) {
    const selector = selectorOf(command, hidden, step);
    if (!selector) continue;
    const cwd = dirOf(command, hidden, step.index, input.cwd);
    let pr = statusOf(cwd, selector, left());
    if (pr?.state === "OPEN" && pr.mergeable === "UNKNOWN" && left() > WAIT + 500) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, WAIT);
      pr = statusOf(cwd, selector, left()) ?? pr;
    }
    if (pr?.state !== "OPEN" || notes.has(pr.number)) continue;
    const note = noteOf(pr);
    if (note) notes.set(pr.number, note);
  }
  if (notes.size) return context("PreToolUse", [...notes.values()].join("\n"));
});
