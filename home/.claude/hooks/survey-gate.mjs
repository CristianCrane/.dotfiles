// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// Edits in a git checkout wait for the branch's survey (the `shape`
// skill): the edit is turned down until the survey exists and names a
// path that exists. Edits outside a checkout, inside the git dir (the
// survey itself) and on a detached HEAD go through, as does any failure
// here.
import { branchOf, cwdFor, inGitDir, leftToRepo, readInput, survey } from "./lib.mjs";

try {
  const input = readInput();
  const path = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (!path) process.exit(0);
  const cwd = cwdFor(input);
  if (inGitDir(cwd, path) || leftToRepo(cwd)) process.exit(0);
  const branch = branchOf(cwd);
  if (!branch) process.exit(0);

  const found = survey(cwd, branch);
  if (found.ok) process.exit(0);

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `No survey for branch ${branch} (${found.reason}). Load the \`shape\` skill and write its survey to ${found.path} before the first edit. This edit goes through once the survey names a path that exists.`,
      },
    }),
  );
} catch {
  // not a git checkout or bad input: let the edit through
}
