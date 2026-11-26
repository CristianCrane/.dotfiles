// After each edit, points out once per commit what the survey gate would
// have turned down (lib's beforeEdit), for a change a Bash edit slipped
// past it: changes made before the survey and its plan review, a dictated
// change grown past its limits, or a branch past the build's size cap. A
// nudge, never a block. A detached HEAD or a prototype branch (lib's prototypeBranch) is
// never counted.
import { readFileSync, writeFileSync } from "node:fs";
import { beforeEdit, changedFiles, context, cwdFor, git, hook, stateFile, workOf } from "./lib.mjs";

const say = (text) => ({
  systemMessage: text.split(". ")[0] + ".",
  ...context("PostToolUse", text),
});

hook((input) => {
  const cwd = cwdFor(input);
  const work = workOf(cwd, input);
  if (!work) return;
  const { branch } = work;

  const { missing } = beforeEdit(cwd, work, input);
  const files = changedFiles(cwd);
  if (files.size === 0) return;

  // per worktree: what this work was already told
  const marker = stateFile(cwd, "change-check", work.key);
  let told = { unsurveyedAt: null };
  try {
    told = { ...told, ...JSON.parse(readFileSync(marker, "utf8")) };
  } catch {}

  const head = git(cwd, "rev-parse", "HEAD");
  if (missing && told.unsurveyedAt !== head) {
    writeFileSync(marker, JSON.stringify({ ...told, unsurveyedAt: head }));
    return say(
      `Branch ${branch} changes ${files.size} files, but ${missing}. Do that now, before going on.`,
    );
  }
});
