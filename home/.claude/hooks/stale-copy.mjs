// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// At session start, says when the repo's copy of the shape rules differs
// from ~/.claude, the source. Cloud sessions get the copy; locally its
// hooks stand aside, but Claude Code prefers a repo's agent to a user's,
// so a stale copy's shape-reviewer still runs here.
import { repoCopy } from "./copy.mjs";
import { hook } from "./lib.mjs";

hook((input) => {
  if (repoCopy(input.cwd) !== "stale") return;
  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        "This repo's copy of the shape rules (.claude/skills/shape, .claude/agents/shape-reviewer.md, .claude/hooks/shape) differs from ~/.claude, their source. Cloud sessions on this repo get the older rules, and sessions here get the copy's older shape-reviewer (a repo's agent comes before a user's). Refreshing it is `node ~/.claude/hooks/sync.mjs`, as its own small branch and PR, apart from any other work.",
    },
  };
});
