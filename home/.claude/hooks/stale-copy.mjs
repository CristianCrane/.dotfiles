// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// At session start, says when the repo's copy of the shape rules differs
// from ~/.claude, the source. The user-level hooks run beside a stale
// copy, so the newest rules hold either way. Any failure stays silent.
import { readInput, repoCopy } from "./lib.mjs";

try {
  const input = readInput();
  if (repoCopy(input.cwd) !== "stale") process.exit(0);
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
          "This repo's copy of the shape rules (.claude/skills/shape, .claude/agents/shape-reviewer.md, .claude/hooks/shape) differs from ~/.claude, their source; the newest rules run here either way. Refreshing it is `node ~/.claude/hooks/sync.mjs`, as its own small branch and PR, apart from any other work.",
      },
    }),
  );
} catch {
  // not a git checkout, or bad input: nothing to say
}
