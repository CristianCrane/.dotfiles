// An agent isn't spawned into a harness-isolated worktree (`isolation:
// "worktree"`). There the Write tool refuses the git dir, where the
// `change` skill's files live, and every powershell.exe command is refused
// as one that might run git; each isolated agent kept its own list of
// workarounds (CristianCrane/.dotfiles#11, #12, #13). An agent that makes
// its own git worktree meets neither refusal.
//
// A reviewer comes back only when its pass is worth paying for, the rule
// the user set on 2026-11-26 ("ensure our reviews are actually worth
// doing"; the `change` skill's Review). The first look runs in full: the
// plan review once (again only for a redone survey, whose Expected files
// differ from the count it recorded), the change review's round 1, the UX
// review's first pass, the critical review's plan pass and one diff pass.
// After it, a reviewer's pass goes through only while some review of the
// change owes a fix a recheck (a header's `<r> to recheck` above 0) and
// HEAD has moved past what this reviewer last read, so there are fixes to
// read. The change-reviewer also reads a commit since its last pass that
// names no finding it fixes, or the branch rebased past it (lib's
// unreadSince): new work, a first look's (round 1 F29). A process batch's
// change review rechecks any commit after it, as its merge needs a review
// of HEAD (review-gate's batchUnapproved). A design's UX review passes
// again while its own count is above 0: a design is fixed in place, with
// no commit. The counts are the review files' own
// headers (lib's passOf), beside the output path the prompt names, as an
// Agent call's cwd is the spawning session's folder, not the change's
// checkout.
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { branchOf, checkoutOf, deny, hook, passOf, processBatch, reviewFiles, stillHead, unreadSince } from "./lib.mjs";

const KINDS = {
  "change-reviewer": ["review", "plan-review"],
  "ux-reviewer": ["ux-review", "ux-review-design"],
  "critical-reviewer": ["critical-review"],
};
// the reviews whose fixes open a later pass of any reviewer (a fix at
// stakes reaches the critical-reviewer whoever found it): a plan review's
// findings ride round 1, and a design's are its own
const OWING = ["review", "ux-review", "critical-review"];
const RULE = "after the first look a reviewer comes back only to read fixes some review marks `[recheck]` (the `change` skill's Review, 2026-11-26)";

// why this reviewer's pass isn't worth running, if it isn't
const pastCap = (type, prompt) => {
  const outputs = reviewFiles(prompt).filter((one) => KINDS[type].includes(one.kind));
  // the change-reviewer's prompt names the plan review too, in a round
  const out = outputs.find((one) => one.kind === "review") ?? outputs[0];
  if (!out) return `The ${type}'s prompt names no output path (${KINDS[type].map((kind) => `${kind}-…`).join(" or ")} beside the survey, absolute): name it, as the \`change\` skill says, so this gate can read its passes.`;
  const pass = passOf(out.path);
  if (!pass) return;
  if (out.kind === "plan-review") {
    const survey = out.path.replace("/plan-review-", "/survey-");
    const files = existsSync(survey) && Number(readFileSync(survey, "utf8").match(/^Expected files:\s*~?(\d+)/m)?.[1]);
    if (pass.files && files && files !== pass.files) return;
    return `${out.path} is written, and the plan review runs once: revise the survey for its findings, or give round 1 your case against one. A survey redone with a new Expected files (the 1.5x size cap) gets a plan pass of its own.`;
  }
  if (out.kind === "ux-review-design")
    return pass.toRecheck ? undefined : `${out.path} leaves nothing to recheck (its header's \`<r> to recheck\` is ${pass.toRecheck ?? "missing"}), and ${RULE}: fix what's left on the design, or put your case against a finding to the user.`;
  // the critical review's one diff pass, after its plan pass
  if (out.kind === "critical-review" && pass.plan) {
    const mode = String(prompt).match(/\bmode\W{0,3}(plan|diff)\b|\b(plan|diff)\W{0,3}mode\b/i);
    if ((mode?.[1] ?? mode?.[2])?.toLowerCase() === "diff") return;
    return `${out.path} holds the plan pass, which runs once; the critical review's next is its diff pass, which names \`mode: diff\` in its prompt.`;
  }
  // a later pass: some review owes a recheck, and there are fixes to read
  const key = basename(out.path).slice(out.kind.length + 1);
  const owed = OWING.reduce((sum, kind) => sum + (passOf(join(dirname(out.path), `${kind}-${key}`))?.toRecheck ?? 0), 0);
  const checkout = checkoutOf(out.path);
  let batch = false;
  try {
    batch = out.kind === "review" && processBatch(branchOf(checkout));
    if (out.kind === "review" && pass.sha && unreadSince(checkout, pass.sha).length) return;
  } catch {}
  if (!owed && !batch)
    return `No review of this change owes a recheck (each header beside ${out.path} reads 0 to recheck), and ${RULE}. Fix what's left with no pass: each commit names the finding it fixes, and the PR body closes it; a case against one goes to the user, whose ruling closes it.`;
  if (pass.sha && stillHead(checkout, pass.sha))
    return `${out.path} already reads HEAD (${pass.sha}, or only comment lines since), and ${RULE}: commit the fixes first. A case against a finding with no fix to read goes to the user, whose ruling closes it (\`ruled by the user:\`).`;
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
