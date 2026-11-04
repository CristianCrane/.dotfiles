// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// At session start, says when the repo's copy of the shape rules differs
// from ~/.claude, the source. Locally the copy stands aside for the
// user-level hooks either way; a stale copy is what cloud sessions get.
// Any failure stays silent.
import { repoCopy } from "./copy.mjs";
import { readInput } from "./lib.mjs";

try {
  const input = readInput();
  if (repoCopy(input.cwd) !== "stale") process.exit(0);
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
          "This repo's copy of the shape rules (.claude/skills/shape, .claude/agents/shape-reviewer.md, .claude/hooks/shape) differs from ~/.claude, their source, so cloud sessions on this repo get older rules (sessions here run the user-level ones). Refreshing it is `node ~/.claude/hooks/sync.mjs`, as its own small branch and PR, apart from any other work.",
      },
    }),
  );
} catch {
  // not a git checkout, or bad input: nothing to say
}
