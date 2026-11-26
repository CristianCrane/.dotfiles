// The change-reviewer reads, and writes its review: nothing else (and the
// curator and the ux-reviewer, each of which writes only its own output:
// HELD). In
// empire-cleaning#374 it ran vitest in the author's checkout while the
// author's quick tests ran there, and 36 of theirs failed; its file's "use
// Bash for reading only" didn't hold it (CristianCrane/.dotfiles#17). Its
// tool calls carry `agent_type: "change-reviewer"` (seen live, for a repo's
// copy of the agent too); every caller whose agent_type isn't in HELD goes
// through.
//
// Its Bash runs only when every command in it, substitutions included, is
// a reader on readers.mjs's READERS (built from past reviewers' Bash calls), with
// output to /dev/null, stdout, stderr or another fd at most. What this
// can't read (a VAR= prefix, a command it doesn't know) is turned down, as
// is any error reading the call: lib's hook() would let it through. Its
// Write (or Edit) goes only to a plan-review or review file beside a
// survey in a git dir.
//
// It holds a reviewer's own calls and their plain workarounds; it is no
// sandbox. It reads words as written, so an expansion's value (`git diff
// $x` with x=--output=f), zsh's rarer ways to set a name (`set -A`,
// `${X::=}`) and gawk's abbreviated long options aren't read (round 3's
// F15 lists each). Closing the first would turn down `git diff $mb`.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { deny, hook, inGitDir } from "./lib.mjs";
import { notReading } from "./readers.mjs";

// a file in a git dir's claude/ folder, where the surveys and reviews
// live; git runs from the folder's parent, the git dir itself, so the
// folder needn't exist yet
const inClaudeFolder = (file) => basename(dirname(file)) === "claude" && inGitDir(dirname(dirname(file)), file);

// a plan-review or review file beside a survey, in a git dir
const ownReview = (path) => {
  try {
    const file = resolve(path);
    const key = basename(file).match(/^(?:plan-review|review)-(.+\.md)$/)?.[1];
    return Boolean(key && existsSync(join(dirname(file), `survey-${key}`)) && inClaudeFolder(file));
  } catch {
    return false;
  }
};

// where the curator writes its proposals and log entries (the dotfiles'
// docs/process.md, The curator)
const CURATOR = join(homedir(), ".claude/process/curator");

// a file under the curator's folder
const ownOutput = (path) => {
  const from = relative(CURATOR, resolve(path));
  return Boolean(from) && !from.startsWith("..") && !from.startsWith("/");
};

// the agent types held to reading, each with the files it may write
// (owns) and what its turn-down says those are
const HELD = {
  "change-reviewer": {
    owns: ownReview,
    writes: "its review: the output path you were given, a plan-review or review file beside the survey in the git dir",
  },
  curator: { owns: ownOutput, writes: `its output: the path you were given, under ${CURATOR}` },
  // a UX review (agents/ux-reviewer.md): of a change's design or
  // after-shots, or of a prototype, which has no survey, so none is asked
  // for beside it
  "ux-reviewer": {
    owns: (path) => {
      try {
        const file = resolve(path);
        return /^ux-review-.+\.md$/.test(basename(file)) && inClaudeFolder(file);
      } catch {
        return false;
      }
    },
    writes: "its review: the output path you were given, a ux-review-<branch>.md in the git dir's claude/ folder",
  },
};

// what the turn-downs say to do instead
const INSTEAD =
  "The author runs the tests, builds and checks beside you in this same checkout, and a second run there breaks theirs. Instead, take the author's numbers, or call the claim unshown and say in the finding how to show it.";

hook((input) => {
  const held = HELD[input.agent_type];
  if (!held) return;
  const name = `The ${input.agent_type}`;
  const { command, file_path, notebook_path } = input.tool_input ?? {};
  const path = file_path ?? notebook_path;
  if (path !== undefined) {
    if (held.owns(path)) return;
    return deny(`${name} writes only ${held.writes}. ${path} isn't one. Put anything else you'd note in that file itself.`);
  }
  if (command === undefined) return;
  let why;
  try {
    why = notReading(command);
  } catch {
    why = "this hook couldn't read the command";
  }
  if (why)
    return deny(
      `${name} runs only commands that read: git's reading subcommands, rg, grep, ls, cat, head, tail, wc, sed with a print-only script, awk without system() or redirects, find and fd without actions, gh's views and lists, jq, \`node --permission\`, with output to /dev/null at most. Here ${why}. ${INSTEAD}`,
    );
});
