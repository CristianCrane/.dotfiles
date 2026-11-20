// Names what is red in a GitHub repo when a session starts there, so "No
// red tests" (the global CLAUDE.md, Working with me) holds when nobody is
// looking: each open PR whose checks failed, and each workflow whose latest
// finished run on the default branch failed, the nightly and scheduled ones
// too. The line alone missed empire-cleaning's nightly run red on main
// (2026-11-14, seen by the user) and Dependabot's #443, red 4 days
// (2026-11-17) (the dotfiles' docs/process-log.md, L3). By hand, from a
// checkout of a GitHub repo:
//
//   node ~/.claude/hooks/red-checks.mjs
//
// and from the SessionStart hook (`--hook`, run in the background, in any
// checkout; settings.json's matcher skips compact and fork, whose session
// has heard it), where it says nothing when all is green or when it can't
// run (no network, no gh, not on GitHub). Its cost: two gh calls, ~3 s in
// the background (empire-cleaning, 2026-11-19). It reads and changes
// nothing, so it takes no lock: two runs at once just ask GitHub twice.
import { flagsOf, githubOrigin, hook, run } from "./lib.mjs";

// the conclusions of a finished run that mean its checks failed; a
// cancelled or skipped run says nothing, so the run before it counts
const FAILED = new Set(["failure", "timed_out", "startup_failure"]);
const SILENT = new Set(["cancelled", "skipped"]);

// a PR's check rollup states that mean a check failed
const ROLLUP_FAILED = new Set(["FAILURE", "ERROR"]);

// what is red in `cwd`'s repo: its name, its default branch (read as
// prune-merged reads it, graphql's defaultBranchRef), the open PRs whose
// checks failed and the workflows whose latest run there failed
const red = (cwd) => {
  const origin = githubOrigin(cwd);
  if (!origin) throw new Error("origin isn't on GitHub");
  const repo = `${origin.owner}/${origin.name}`;
  const gh = (...args) => JSON.parse(run(cwd, "gh", ...args));
  const { repository } = gh(
    "api",
    "graphql",
    "-f",
    "query=query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { defaultBranchRef { name } pullRequests(states: OPEN, first: 100) { nodes { number commits(last: 1) { nodes { commit { statusCheckRollup { state } } } } } } } }",
    "-F",
    `owner=${origin.owner}`,
    "-F",
    `name=${origin.name}`,
  ).data;
  const prs = repository.pullRequests.nodes
    .filter((pr) => ROLLUP_FAILED.has(pr.commits.nodes[0]?.commit.statusCheckRollup?.state))
    .map((pr) => pr.number);
  const base = repository.defaultBranchRef.name;
  // newest first: each workflow's first run that isn't cancelled or skipped
  const latest = new Map();
  for (const ran of gh("run", "list", "-R", repo, "--branch", base, "--status", "completed", "--limit", "100", "--json", "workflowName,conclusion,url"))
    if (!SILENT.has(ran.conclusion) && !latest.has(ran.workflowName)) latest.set(ran.workflowName, ran);
  const workflows = [...latest.values()].filter((ran) => FAILED.has(ran.conclusion));
  return { repo, base, prs, workflows };
};

// one line naming what is red, or null when nothing is
const summary = ({ repo, base, prs, workflows }) => {
  const parts = [
    prs.length && `open PR ${prs.map((number) => `#${number}`).join(", ")} failed checks`,
    ...workflows.map((ran) => `${base}'s latest ${ran.workflowName} run failed (${ran.url})`),
  ].filter(Boolean);
  return parts.length
    ? `Red in ${repo}: ${parts.join("; ")}. "No red tests" (the global CLAUDE.md, Working with me) applies.`
    : null;
};

const flags = flagsOf("red-checks", "", { options: { hook: { type: "boolean" } } }).values;

if (flags.hook)
  hook((input) => {
    const message = summary(red(input.cwd));
    return message && { systemMessage: message };
  });
else {
  try {
    const found = red(process.cwd());
    console.log(summary(found) ?? `Nothing red in ${found.repo}.`);
  } catch (error) {
    console.error(`red-checks: ${error.message}`);
    process.exitCode = 1;
  }
}
