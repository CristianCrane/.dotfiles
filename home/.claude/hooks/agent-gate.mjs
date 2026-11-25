// An agent isn't spawned into a harness-isolated worktree (`isolation:
// "worktree"`). There the Write tool refuses the git dir, where the
// `change` skill's files live, and every powershell.exe command is refused
// as one that might run git; each isolated agent kept its own list of
// workarounds (CristianCrane/.dotfiles#11, #12, #13). An agent that makes
// its own git worktree meets neither refusal.
//
// A reviewer runs once per step, the cap the user set on 2026-11-25 after
// half a 5-hour window went in 50 minutes (#508's tree: plan review 28%,
// review 46%; #561 at round 5, its 7th UX pass still finding 6): the plan
// review once (again only for a redone survey, whose Expected files differ
// from the count it recorded), the change review's round 1 and then
// rechecks only while the last left a change finding open, the UX review
// once per file, the critical review's plan pass and one diff pass. The
// count is the review files' own headers (lib's passOf), at the output
// path the prompt names, as the gate can't find the branch: an Agent
// call's cwd is the spawning session's folder.
import { existsSync, readFileSync } from "node:fs";
import { deny, hook, passOf } from "./lib.mjs";

const OUTPUT = {
  "change-reviewer": /(\/\S+\/claude\/(review|plan-review)-[^\s`'"),]+\.md)\b/g,
  "ux-reviewer": /(\/\S+\/claude\/(ux-review(?:-design)?)-[^\s`'"),]+\.md)\b/g,
  "critical-reviewer": /(\/\S+\/claude\/(critical-review)-[^\s`'"),]+\.md)\b/g,
};
const CAP = "the `change` skill's Review caps review at one round and one recheck of its fixes, one UX pass, one plan pass and one critical pass each on the plan and the diff (2026-11-25)";

// why this reviewer's pass is past the cap, if it is
const pastCap = (type, prompt) => {
  const outputs = [...String(prompt).matchAll(OUTPUT[type])].map(([, path, kind]) => ({ path, kind }));
  // the change-reviewer's prompt names the plan review too, in a round
  const out = outputs.find((one) => one.kind === "review") ?? outputs[0];
  if (!out) return `The ${type}'s prompt names no output path (${type === "change-reviewer" ? "review-… or plan-review-…" : type === "ux-reviewer" ? "ux-review-…" : "critical-review-…"} beside the survey, absolute): name it, as the \`change\` skill says, so this gate can count its passes.`;
  const pass = passOf(out.path);
  if (!pass) return;
  if (out.kind === "plan-review") {
    const survey = out.path.replace("/plan-review-", "/survey-");
    const files = existsSync(survey) && Number(readFileSync(survey, "utf8").match(/^Expected files:\s*~?(\d+)/m)?.[1]);
    if (pass.files && files && files !== pass.files) return;
    return `${out.path} is written, and ${CAP}: revise the survey for its findings, or give round 1 your case against one. A survey redone with a new Expected files (the 1.5x size cap) gets a plan pass of its own.`;
  }
  if (out.kind === "review") {
    if (!pass.recheck || pass.open) return;
    return `${out.path} holds round 1's recheck, which left no change finding open, and ${CAP}. A finding after it goes into a new issue the PR links, unless it's a real bug or untrue text.`;
  }
  if (out.kind === "critical-review" && pass.plan) return;
  return `${out.path} is written, and ${CAP}: fix its findings, and the change-reviewer's recheck covers the fixes.`;
};

hook((input) => {
  const type = input.tool_input?.subagent_type;
  if (OUTPUT[type]) {
    const why = pastCap(type, input.tool_input?.prompt);
    if (why) return deny(why);
  }
  if (input.tool_input?.isolation !== "worktree") return;
  return deny(
    "An agent in a harness-isolated worktree can't write the `change` skill's files (the harness refuses the git dir, where they live), nor run PowerShell. Spawn it without `isolation`, and have its first step make its own worktree from the repo it works on: `git worktree add ../<repo>-<branch> -b <branch> origin/main`. Its shell starts in this session's folder on every call, so tell it to begin each command with `cd <its worktree> &&` and to name files there by absolute path.",
  );
});
