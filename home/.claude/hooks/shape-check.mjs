// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// After each edit, counts the files the current branch changes against
// its base. Each time the count crosses another 25, the agent is told once
// to step back and compare with the survey's Expected files. Changes made
// with no survey (a Bash edit slips past the survey gate) are pointed out
// once per commit. A nudge, never a block: any failure here stays silent.
import { readFileSync, writeFileSync } from "node:fs";
import {
  branchOf,
  changedFiles,
  cwdFor,
  git,
  leftToRepo,
  readInput,
  stateFile,
  survey,
} from "./lib.mjs";

const STEP = 25;

const say = (text) =>
  console.log(
    JSON.stringify({
      systemMessage: text.split(". ")[0] + ".",
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text },
    }),
  );

try {
  const input = readInput();
  const cwd = cwdFor(input);
  if (leftToRepo(cwd)) process.exit(0);
  const branch = branchOf(cwd);
  if (!branch) process.exit(0);

  const files = changedFiles(cwd);
  if (files.size === 0) process.exit(0);
  const found = survey(cwd, branch);

  // per worktree: what this branch was already told
  const marker = stateFile(cwd, "shape-check", branch);
  let told = { step: 0, unsurveyedAt: null };
  try {
    told = { ...told, ...JSON.parse(readFileSync(marker, "utf8")) };
  } catch {}

  const head = git(cwd, "rev-parse", "HEAD");
  if (!found.ok && told.unsurveyedAt !== head) {
    writeFileSync(marker, JSON.stringify({ ...told, unsurveyedAt: head }));
    say(
      `Branch ${branch} changes ${files.size} files and has no survey (${found.reason}). Load the \`shape\` skill and write its survey to ${found.path} now, before going on.`,
    );
    process.exit(0);
  }

  const reached = Math.floor(files.size / STEP);
  if (reached <= told.step) process.exit(0);
  writeFileSync(marker, JSON.stringify({ ...told, step: reached }));

  const planned = found.expected ? ` Its survey expected ${found.expected}.` : "";
  say(
    `Branch ${branch} now changes ${files.size} files.${planned} Step back, as the \`shape\` skill asks: is this shotgun surgery, a third copy of a pattern, or a pattern fighting the change? If it is, tell the user now: what the pattern costs, the simpler shape, and how to split the work. Otherwise update the survey's plan and Expected files, and say in the PR's Shape section why it grew.`,
  );
} catch {
  // not a git checkout, or bad input: nothing to say
}
