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
// from the count it recorded), the change review's round 1 and then a
// recheck only of what no review has read or while one leaves a change
// finding open, the UX review once per file, the critical review's plan
// pass and one diff pass. The count is the review files' own headers
// (lib's passOf), at the output path the prompt names, as an Agent call's
// cwd is the spawning session's folder, not the change's checkout.
import { existsSync, readFileSync } from "node:fs";
import { checkoutOf, deny, hook, passOf, reviewFiles, stillHead } from "./lib.mjs";

const KINDS = {
  "change-reviewer": ["review", "plan-review"],
  "ux-reviewer": ["ux-review", "ux-review-design"],
  "critical-reviewer": ["critical-review"],
};
const CAP = "the `change` skill's Review caps review at one plan pass, round 1 and a recheck of its fixes, one UX pass, and one critical pass each on the plan and the diff (2026-11-25)";

// why this reviewer's pass is past the cap, if it is
const pastCap = (type, prompt) => {
  const outputs = reviewFiles(prompt).filter((one) => KINDS[type].includes(one.kind));
  // the change-reviewer's prompt names the plan review too, in a round
  const out = outputs.find((one) => one.kind === "review") ?? outputs[0];
  if (!out) return `The ${type}'s prompt names no output path (${KINDS[type].map((kind) => `${kind}-…`).join(" or ")} beside the survey, absolute): name it, as the \`change\` skill says, so this gate can count its passes.`;
  const pass = passOf(out.path);
  if (!pass) return;
  if (out.kind === "plan-review") {
    const survey = out.path.replace("/plan-review-", "/survey-");
    const files = existsSync(survey) && Number(readFileSync(survey, "utf8").match(/^Expected files:\s*~?(\d+)/m)?.[1]);
    if (pass.files && files && files !== pass.files) return;
    return `${out.path} is written, and ${CAP}: revise the survey for its findings, or give round 1 your case against one. A survey redone with a new Expected files (the 1.5x size cap) gets a plan pass of its own.`;
  }
  if (out.kind === "review") {
    if (!pass.recheck || pass.open || !pass.sha || !stillHead(checkoutOf(out.path), pass.sha)) return;
    return `${out.path} already reads HEAD (${pass.sha}, or only comment lines since) and leaves no change finding open, and ${CAP}. A finding after it goes into a new issue the PR links, unless it's a real bug or untrue text.`;
  }
  // the critical review's diff pass, once, after its plan pass
  const mode = String(prompt).match(/\bmode\W{0,3}(plan|diff)\b|\b(plan|diff)\W{0,3}mode\b/i);
  if (out.kind === "critical-review" && pass.plan && (mode?.[1] ?? mode?.[2])?.toLowerCase() === "diff") return;
  return `${out.path} is written, and ${CAP}: fix its findings, and the change-reviewer's recheck covers the fixes and weighs your case against one. The diff pass, after the plan's, names \`mode: diff\` in its prompt.`;
};

hook((input) => {
  const type = input.tool_input?.subagent_type;
  if (KINDS[type]) {
    const why = pastCap(type, input.tool_input?.prompt);
    if (why) return deny(why);
  }
  if (input.tool_input?.isolation !== "worktree") return;
  return deny(
    "An agent in a harness-isolated worktree can't write the `change` skill's files (the harness refuses the git dir, where they live), nor run PowerShell. Spawn it without `isolation`, and have its first step make its own worktree from the repo it works on: `git worktree add ../<repo>-<branch> -b <branch> origin/main`. Its shell starts in this session's folder on every call, so tell it to begin each command with `cd <its worktree> &&` and to name files there by absolute path.",
  );
});
