// The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs.
//
// `gh pr create` waits for the branch's shape review (the `shape` skill):
// it is turned down until the review exists and is newer than the last
// commit. Any failure here lets the command through.
import { homedir } from "node:os";
import { resolve } from "node:path";
import { branchOf, readInput, review, standAside } from "./lib.mjs";

// where a command starts: not inside a message that mentions it
const PR_CREATE = /(?:^|[;&|(\n])\s*gh\s+pr\s+create\b/;

// the folder gh runs in: the last `cd` before it, if any
const dirOf = (command, cwd) => {
  const before = command.slice(0, command.search(PR_CREATE));
  const cds = [...before.matchAll(/(?:^|[;&|(\n])\s*cd\s+("[^"]+"|'[^']+'|\S+)/g)];
  if (cds.length === 0) return cwd;
  const dir = cds.at(-1)[1].replace(/^["']|["']$/g, "").replace(/^~(?=\/|$)/, homedir());
  return resolve(cwd, dir);
};

try {
  if (standAside) process.exit(0);
  const input = readInput();
  const command = input.tool_input?.command ?? "";
  if (!PR_CREATE.test(command)) process.exit(0);
  const cwd = dirOf(command, input.cwd);
  const branch = branchOf(cwd);
  if (!branch) process.exit(0);

  const found = review(cwd, branch);
  if (found.ok) process.exit(0);

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `No fresh shape review for branch ${branch} (${found.reason}). Run the shape-reviewer agent as the \`shape\` skill's Review step says; it writes ${found.path}. Answer each finding in the PR's Shape section, then open the PR.`,
      },
    }),
  );
} catch {
  // not a git checkout or bad input: let the command through
}
