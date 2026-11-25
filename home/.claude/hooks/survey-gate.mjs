// Edits in a git checkout wait for the survey (the `change` skill) and
// the reviewer's read of it: the edit is turned down until the survey
// names a path that exists and the plan review is written, or the survey
// is a dictated one that holds with this edit made (lib's dictatedHolds).
// On main in a checkout whose origin is on GitHub, every edit of a file
// git doesn't ignore is turned down: a change there reaches main by PR, so
// it starts on a branch (lib's beforeEdit). Edits outside a checkout, inside the git dir (where
// those files live) and on a detached HEAD or a prototype branch (lib's
// prototypeBranch) go through, but for a review file, which only its
// reviewer writes: its header holds the passes agent-gate counts and the
// file count the build's size cap reads (lib's passOf).
import { existsSync, readFileSync } from "node:fs";
import { beforeEdit, cwdFor, deny, hook, inGitDir, workOf } from "./lib.mjs";

// the file's text once this edit is made: Write's content, or Edit's and
// MultiEdit's replacements applied to the file as it is
const after = (path, { content, old_string, new_string, replace_all, edits }) => {
  if (content !== undefined) return content;
  let text = existsSync(path) ? readFileSync(path, "utf8") : "";
  for (const one of edits ?? [{ old_string, new_string, replace_all }])
    text = one.replace_all ? text.split(one.old_string).join(one.new_string) : text.replace(one.old_string, () => one.new_string);
  return text;
};

hook((input) => {
  const path = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (!path) return;
  const cwd = cwdFor(input);
  if (inGitDir(cwd, path)) {
    if (/\/claude\/(plan-review|review|ux-review|critical-review)-[^/]*$/.test(path) && !/-reviewer$/.test(input.agent_type ?? ""))
      return deny(`${path} is a reviewer's file: only its reviewer writes it. Give your case against a finding in the reviewer's next pass, as the \`change\` skill's Review says.`);
    return;
  }
  const work = workOf(cwd, input);
  if (!work) return;

  // a notebook's edit has no text to read: its path alone counts it in the change
  const pending = { path, content: input.tool_input.file_path ? after(path, input.tool_input) : undefined };
  const { missing, branchFirst } = beforeEdit(cwd, work, input, pending);
  if (branchFirst) return deny(`This edit is turned down: ${missing}.`);
  if (missing) return deny(`Before this edit, ${missing}. The edit goes through once that's written.`);
});
