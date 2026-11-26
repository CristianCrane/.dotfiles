// `gh pr create` waits for the branch's change review (the `change` skill):
// it is turned down until the review exists (a dictated change that holds
// has none: lib's dictatedHolds) with a valid header, of a commit on the
// branch, and until the PR body, read from its file, is in the skill's
// shape (its parts, Check these's permalinks, Change collapsed, nothing
// else) and closes in its Change section every finding of that review, of
// the UX review (which a body with Before / after needs) and of the
// critical review: as fixed, as `listed` or `filed in #<n>` for one marked
// `[polish]`, as the user ruled in words they typed, or in the review's
// own word on it, each review's for its own findings. A PR leaves draft (`gh pr ready`, or
// `gh pr create` without `--draft`) once, besides that (notReady), no
// review owes a fix its recheck (a header's `<r> to recheck` above 0, less
// what the user ruled on), the change review has read every commit since
// its last pass that names no finding it fixes nor CI (lib's unreadSince),
// and the branch's lessons file (the `lessons` skill) says where every
// cost went.
// The closing check is the backstop for the reviewer's last word (the
// change skill, Review), not a rule of its own: in words alone, the
// principle failed three times in two days, builders answering UX
// findings away on empire-cleaning #527, #536 and #538 (2026-11-22, 23).
// A prototype branch's PR (lib's prototypeBranch) is turned down either
// way: it skipped the reviews because it never merges.
//
// Only the user merges a PR of the dotfiles (DOTFILES; their CLAUDE.md):
// `gh pr merge` on one goes through only naming the PR by its number
// alone, from a checkout of it, and only when a message the user typed in
// this session asks to merge that number. The one exception is a process
// batch (lib's processBatch; the dotfiles' docs/process.md, Landing),
// whose approval is the user's verdicts in its log: run bare from its own
// checkout, it merges once its review reads HEAD and owes no recheck (so a
// reviewer has read every fix the agent would merge), its first commit
// only adds log entries, and every later commit names one of them (`L<n>`)
// with a yes or edit verdict (batchUnapproved). Another repo's merges go
// through. What it can't hold:
// a message that negates the ask ("don't merge #12"), and a merge by any
// other route (`gh api`, the web).
//
// It reads Bash and Monitor commands alike (settings.json registers it on
// `Bash|Monitor`): a Monitor runs its command in a shell too, so a
// `gh pr merge`, create or ready there is gated as in Bash.
import { existsSync, readFileSync } from "node:fs";
import {
  argsOf,
  base,
  branchOf,
  deny,
  dirOf,
  git,
  githubOrigin,
  has,
  hook,
  lines,
  masked,
  onBranch,
  passOf,
  positional,
  processBatch,
  prArgs,
  prototypeBranch,
  prStep,
  review,
  stateFile,
  stillHead,
  unquote,
  unreadSince,
  userMessages,
  userTyped,
  WORD,
  workOf,
} from "./lib.mjs";

// the repo whose PRs only the user merges
const DOTFILES = "CristianCrane/.dotfiles";

const PR_STEP = prStep("create", "ready", "merge");

// the branch `--head` names, if any, in this gh command's own arguments:
// found in the masked text (so a title or body that mentions --head doesn't
// count) and read from the original
const headOf = (command, hidden, end) => {
  const args = argsOf(hidden, end);
  const flag = /(?:^|\s)(?:--head|-H)(?:=|\s+)("[^"]+"|'[^']+'|\S+)/d.exec(args);
  if (!flag) return undefined;
  const [start, finish] = flag.indices[1];
  return unquote(command.slice(end + start, end + finish)).replace(/^[^:]*:/, "");
};

// a turn-down stops the whole command, so it says so: a push or an edit of
// the body chained before the gh command didn't run either
const turnDown = (reason, verb) =>
  deny(`${reason} Nothing in this command ran, steps before gh pr ${verb} included: run each step as its own command (a leading \`cd <dir> &&\` is no step, only where it runs).`);

// a prototype branch's PR, turned down whatever else it has
const prototypeTurnDown = (branch, verb) =>
  turnDown(
    `${branch} is a prototype branch: it skipped the survey and the reviews because it never merges, so it never becomes a PR. Build the pick on its own branch (not prototype-…) with the full flow, as the \`change\` skill's Prototype rule says.`,
    verb,
  );

// why the branch's PR can't leave draft yet, if it can't: its lessons file
// is missing, lists nothing, or has a cost that doesn't say where it went.
// The costs are the bullets before the first line starting `None:`; its
// reason follows, in any form
const lessonsMissing = (cwd, work) => {
  const file = stateFile(cwd, "lessons", work.key);
  const how = `run the \`lessons\` skill (the \`change\` skill's Lessons step): its \`capture.mjs --source lessons\` writes each cost to ${file} with where it went (\`→ inbox <id>\`), or write \`None: <why>\` there when the work cost nothing`;
  if (!existsSync(file)) return `${work.branch}'s PR can't leave draft before its lessons: ${how}.`;
  const all = lines(readFileSync(file, "utf8"));
  const split = all.findIndex((line) => /^none:/i.test(line.trim()));
  const items = (split < 0 ? all : all.slice(0, split)).filter((line) => /^\s*-\s/.test(line));
  const reasoned = split >= 0 && /\w/.test(all.slice(split).join(" ").replace(/^\s*none\W*/i, ""));
  const unsaid = items.filter((line) => !/→\s*\S/.test(line));
  if ((items.length === 0 && !reasoned) || unsaid.length)
    return `The lessons file for ${work.branch} (${file}) ${items.length ? `has ${unsaid.length} cost(s) that don't say where they went` : "lists none"}: ${how}.`;
};

// the PR body's labelled parts (the `change` skill's PR body step), in its
// order: whether each must be there, whether its sentence is on its line, and
// how many permalinks it holds. `## Change` follows, collapsed
const PARTS = [
  { label: "Problem", required: true, sentence: true },
  { label: "Fix", required: true, sentence: true },
  { label: "Check these", required: true, links: [3, 5] },
  { label: "Before / after" },
  { label: "Tests" },
];

// the Change section, collapsed in a closed <details>: the blank line after
// </summary> lets GitHub draw its heading
const COLLAPSED = /^<details>\s*<summary>Change<\/summary>[ \t]*\n[ \t]*\n(## Change[ \t]*\n[\s\S]*?)^<\/details>/m;

// a permalink: a file's lines at a commit's full sha
const PERMALINK = /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/blob\/([0-9a-f]{40})\//g;

// what keeps the body from the skill's shape, outside fenced code: a part
// missing or short of what it holds, a label (any line led by bold) or
// heading it doesn't have, a permalink at no commit on the branch, or
// Change not collapsed. The Change section, when it's there, comes back to
// be checked against the review
const shapeOf = (text, cwd) => {
  const prose = text.replace(/^```[\s\S]*?^```/gm, "");
  const problems = [];
  // each label's block: its line's rest, then the lines up to the next
  // label or the collapsed Change
  const blocks = new Map();
  let block = null;
  for (const line of prose.split("\n")) {
    const label = /^\*\*(.+?):?\*\*:?(.*)$/.exec(line);
    if (label) blocks.set(label[1], (block = { rest: label[2].trim(), text: "" }));
    else if (/^<details>/.test(line)) block = null;
    else if (block) block.text += `${line}\n`;
  }
  for (const { label, required, sentence, links } of PARTS) {
    const part = blocks.get(label);
    if (!part) {
      if (required) problems.push(`no \`**${label}:**\``);
      continue;
    }
    if (sentence && !part.rest) problems.push(`\`**${label}:**\` has no sentence on its line`);
    const count = links && [...part.text.matchAll(PERMALINK)].length;
    if (links && (count < links[0] || count > links[1]))
      problems.push(
        `\`**${label}:**\` has ${count} permalink(s) (\`https://github.com/<owner>/<repo>/blob/<full sha>/<path>#L<a>-L<b>\`), not ${links.join(" to ")}`,
      );
  }
  const stray = [
    ...[...blocks.keys()].filter((label) => !PARTS.some((part) => part.label === label)).map((label) => `**${label}**`),
    ...lines(prose).filter((line) => /^#{1,6}\s/.test(line) && !/^## Change\s*$/.test(line)),
  ];
  if (stray.length) problems.push(`parts it doesn't have: ${stray.map((part) => `\`${part}\``).join(", ")}`);
  const elsewhere = [...new Set([...prose.matchAll(PERMALINK)].map((link) => link[1]))].filter((sha) => !onBranch(cwd, sha));
  if (elsewhere.length)
    problems.push(`permalinks at ${elsewhere.map((sha) => sha.slice(0, 7)).join(", ")}, no commit on this branch: link at HEAD's full sha`);
  const collapsed = COLLAPSED.exec(prose);
  if (!collapsed)
    problems.push(
      "no `## Change` collapsed as `<details><summary>Change</summary>`, a blank line, `## Change` and its lines, then `</details>`",
    );
  return { problems, section: collapsed ? lines(collapsed[1]) : null, seen: blocks.has("Before / after") };
};

// the words that close a finding with no fix on the branch: the reviewer's
// own, as it has the last word (the `change` skill, Review), so a PR body's
// line passes with one only when the review gives the finding it too, as
// the word after the last → of its own line for the finding. Both lines
// are read after their last →, as a finding's text before it can quote
// one of the words (dotfiles review F13, 2026-11-23)
const REVIEWERS_WORDS = ["fixed in the survey", "fixed elsewhere", "conceded", "turned down", "ruled by the user"];
// the user outranks the reviewer: a case put to them, when no pass of the
// reviewer runs to weigh it, closes by their ruling in the body alone,
// quoted (`ruled by the user: "<their words>"`) from a message they typed
// in this session (lib's userTyped, as a dictated survey's quote is): the
// author's word alone ended a `[recheck]` finding with no fix and no
// reader (round 1 F30)
const RULED = "ruled by the user";
const userRuled = (line, transcript) => {
  const words = line.match(/^ruled by the user:\s*"([^"]{8,})"/)?.[1];
  try {
    return Boolean(words && transcript && userTyped(transcript, words));
  } catch {
    return false;
  }
};
// a later pass's polish, marked `[polish]` in the review, needs no fix: it
// closes on the body's list (`listed`) or in an issue (the `change` skill's
// Review, 2026-11-26). Only a later pass's (its header's `recheck <n>` or
// `pass <n>`): the first look's file is most changes' last, and its polish
// is fixed (round 1 F31)
const POLISH = /^(?:listed|filed in #\d+)\b/;
const laterPass = (path) => {
  const pass = passOf(path);
  return Boolean(pass?.recheck || pass?.pass);
};
const closingOf = (line) => line.split("→").at(-1).trim();
// finding `id`'s first line in `review` (its path and text), and whether
// its fix owes a recheck: in a critical review every finding but a
// `[polish]` one (critical-reviewer.md, Output), in any other one marked
// `[recheck]`
const findingLine = (review, id) => lines(review.text).find((line) => new RegExp(`^(?:- )?${id}\\b`).test(line)) ?? "";
const owesRecheck = (review, id) => {
  const line = findingLine(review, id);
  return review.path.includes("/critical-review-") ? !line.includes("[polish]") : line.includes("[recheck]");
};
const wordOf = (line) => REVIEWERS_WORDS.find((word) => closingOf(line).startsWith(word));

// why no line of the Change section closes finding `id` of `review` (its
// path and text), or null when one does: `fixed in <sha>` (a commit on
// this branch), `listed` or `filed in #<n>` for a later pass's `[polish]`
// finding, the user's ruling in their words (userRuled), or the review's
// own word on it (`fixed in the survey` among them). `answered:` closed
// one until 2026-11-23, when builders answered real findings away
// (empire-cleaning #527, #536, #538)
const unclosed = (cwd, section, id, review, transcript) => {
  const named = section.filter((line) => new RegExp(`\\b${id}\\b`).test(line));
  if (!named.length) return "no line names it";
  const words = lines(review.text)
    .filter((line) => line.includes("→") && new RegExp(`^(?:- )?${id}\\b`).test(line))
    .map(wordOf);
  const whys = named.map((named) => {
    const line = closingOf(named);
    if (POLISH.test(line)) {
      if (!lines(review.text).some((line) => new RegExp(`^(?:- )?${id}\\b.*\\[polish\\]`).test(line)))
        return "`listed` and `filed in #<n>` close only a finding the review marks `[polish]`: fix this one";
      return laterPass(review.path) ? null : "`listed` and `filed in #<n>` close only a later pass's `[polish]` (its header's `recheck <n>` or `pass <n>`), and the first look's are fixed: fix this one";
    }
    const word = wordOf(line);
    if (word === RULED && userRuled(line, transcript)) return null;
    if (word === RULED && !words.includes(word))
      return "`ruled by the user:` closes it with the user's own words in quotes (`ruled by the user: \"<their words>\"`, 8 characters or more), as they typed them in this session, and the review's own word on it doesn't say it either";
    if (word)
      return words.includes(word)
        ? null
        : `it says \`${word}\`, but the review's own word on it doesn't: the reviewer has the last word, so put your case in its next pass`;
    const sha = line.match(/fixed in ([0-9a-f]{7,40})\b/)?.[1];
    if (sha) return onBranch(cwd, sha) ? null : `\`fixed in ${sha}\` is no commit on this branch: after a rebase or an amend, give the new sha; a fix that landed elsewhere (main, another PR) is \`fixed elsewhere: <where>\`, as the review says`;
    if (/\bfixed\b/.test(line))
      return "it says fixed, but in no commit on this branch: a fix to the survey's text is `fixed in the survey`, one anywhere else (an issue, a comment) is `fixed elsewhere: <where>`, as the review says";
    if (/\banswered\b/.test(line))
      return "`answered` closes nothing: a finding is `fixed in <sha>`, or takes the review's own word on it (`fixed in the survey`, `fixed elsewhere:`, `conceded:`, `turned down:`, `ruled by the user:`)";
    return "its line says neither `fixed in`, `listed` or `filed in #<n>` for a `[polish]` finding, `ruled by the user:`, nor the review's own word on it";
  });
  return whys.includes(null) ? null : whys[0];
};

// a finding's ids in a review's text, by its letter
const idsOf = (text, letter) => [...new Set([...text.matchAll(new RegExp(`^(?:- )?(${letter}\\d+)\\b`, "gm"))].map((id) => id[1]))];

// the UX or critical review beside the change review: a valid header, of a
// commit on the branch, or why not; null with no file
const otherReview = (cwd, work, kind, title, letter, pass) => {
  const path = stateFile(cwd, kind, work.key);
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf8");
  const { head, sha, toRecheck } = passOf(path);
  if (!new RegExp(`^# ${title}:`).test(head) || !sha || toRecheck === null)
    return { path, reason: `its header has no commit and count: its first line reads \`# ${title}: <branch> @ <short sha>, ${pass}, <r> to recheck\`` };
  if (!onBranch(cwd, sha)) return { path, reason: `it read ${sha}, no commit on this branch` };
  return { path, ok: true, text, ids: idsOf(text, letter), toRecheck };
};
// the branch's UX review, which a PR body with Before / after needs, and
// the critical review, when the change is at stakes (it went unread here
// until 2026-11-25)
const uxReview = (cwd, work) => otherReview(cwd, work, "ux-review", "UX review", "U", "<first pass | pass <n>>") ?? { path: stateFile(cwd, "ux-review", work.key), reason: "missing" };
const criticalReview = (cwd, work) => otherReview(cwd, work, "critical-review", "Critical review", "C", "<plan | diff | recheck <n>>");

// a review not ready, in words for a turn-down
const otherNotReady = (other, branch) =>
  other.path.includes("/ux-review-")
    ? `The PR body has **Before / after:**, so ${branch} needs its UX review, and it isn't ready (${other.reason}), with output ${other.path}: run the \`ux-reviewer\` agent as the \`change\` skill's Review step says.`
    : `${branch}'s critical review (${other.path}) isn't ready (${other.reason}): finish it as the \`change\` skill's Review step says.`;

// the reviews whose findings the body closes: the change review's, the
// critical review's, and with Before / after (or once it exists) the UX
// review's; or why one isn't ready
const reviewsOf = (cwd, work, found, seen) => {
  const ux = seen || existsSync(stateFile(cwd, "ux-review", work.key)) ? uxReview(cwd, work) : null;
  const others = [ux, criticalReview(cwd, work)].filter(Boolean);
  const bad = others.find((other) => !other.ok);
  return bad ? { why: otherNotReady(bad, work.branch) } : { reviews: [found, ...others] };
};

// why the body's Change section doesn't close every finding, if it
// doesn't. Each review's word closes only its own findings: a reviewer
// weighs the cases against what it found (the `change` skill's Review)
const unclosedAll = (cwd, work, found, body, section, seen, transcript) => {
  const { why, reviews } = reviewsOf(cwd, work, found, seen);
  if (why) return why;
  const open = reviews
    .flatMap((one) => one.ids.map((id) => [id, unclosed(cwd, section, id, one, transcript)]))
    .flatMap(([id, why]) => (why ? [`${id}: ${why}`] : []));
  if (open.length)
    return `The PR body's Change section (${body}) doesn't close every finding of ${reviews.map((one) => one.path).join(" and ")}: ${open.join("; ")}. Each finding gets its own line ending \`fixed in <sha>\` (a commit on this branch), \`listed\` or \`filed in #<n>\` for a \`[polish]\` finding, \`ruled by the user: "<their words>"\`, or the review's own word on it, after its line's last → (\`fixed in the survey\`, \`fixed elsewhere:\`, \`conceded:\`, \`turned down:\`).`;
};

// the fixes a review still owes a recheck: its header's `<r> to recheck`,
// less each one the body closes by the user's ruling in their words (a
// case with no pass left to weigh it), as its fix needs no read. Open is a
// `[recheck]` finding (every critical one but a `[polish]`) with no word
// after its last →, or one that says it still stands (`open`, `held`,
// `reopened`)
const owedOf = (one, section, transcript) => {
  const ruled = one.ids.filter((id) => {
    const line = findingLine(one, id);
    const open = owesRecheck(one, id) && (!line.includes("→") || /^(?:open|held|reopened)\b/.test(closingOf(line)));
    return open && (section ?? []).some((named) => new RegExp(`\\b${id}\\b`).test(named) && userRuled(closingOf(named), transcript));
  });
  return Math.max(0, one.toRecheck - ruled.length);
};

// why the PR can't leave draft (`gh pr ready`, or a create without
// `--draft`), beside its body's closings (unclosedAll), if it can't: a
// review owes a fix its recheck, a commit since the change review's last
// pass names no finding it fixes (nor CI, which rests on trust), or the
// lessons are missing. A commit that fixes nothing is new work, which the
// change-reviewer reads (agent-gate lets it through)
const notReady = (cwd, work, found, section, seen, transcript) => {
  const { why, reviews } = reviewsOf(cwd, work, found, seen);
  if (why) return why;
  const owing = reviews.filter((one) => owedOf(one, section, transcript) > 0);
  if (owing.length)
    return `${owing.map((one) => `${one.path} has ${owedOf(one, section, transcript)} to recheck`).join("; ")}: a reviewer still owes those fixes a read. Commit each fix, naming the finding, and run that reviewer's next pass (the \`change\` skill's Review); a case against one goes to the user, and the body closes it \`ruled by the user: "<their words>"\`, as they typed them.`;
  if (found.sha) {
    const unnamed = unreadSince(cwd, found.sha);
    if (unnamed.length)
      return `${unnamed.map((sha) => sha.slice(0, 7)).join(", ")} came after the change review's last pass (${found.sha}) and name${unnamed.length === 1 ? "s" : ""} no finding it fixes (\`F<n>\`, \`C<n>\`, \`U<n>\`) nor \`CI\`: name the finding a fix fixes in its message (\`git commit --amend\` or a reword); a commit that fixes none is new work no review has read, so run the change-reviewer on HEAD (the \`change\` skill's Review).`;
  }
  return lessonsMissing(cwd, work);
};

// gh pr create: the PR's branch (not a prototype, and the one checked
// out), then the review, the body's shape and its Change section, and
// notReady unless it opens as a draft. The branch is settled before a
// checkout with no work to gate (a detached HEAD, a prototype) stands
// aside, so neither opens another branch's PR unchecked
const createGate = (command, hidden, match, input) => {
  const cwd = dirOf(command, hidden, match.index, input.cwd);
  const branch = branchOf(cwd);
  const end = match.index + match[0].length;
  const turnDownCreate = (reason) => turnDown(reason, "create");

  const head = headOf(command, hidden, end);
  if (prototypeBranch(head ?? branch)) return prototypeTurnDown(head ?? branch, "create");
  // a branch's review lives with its own checkout
  if (head && head !== branch)
    return turnDownCreate(
      `gh pr create --head ${head} runs from ${branch}'s checkout (${cwd}), but a branch's change review lives with its own checkout. Run it from ${head}'s checkout: git switch ${head} first, as its own command, or \`cd <its worktree> && gh pr create …\`.`,
    );
  const work = workOf(cwd, input);
  if (!work) return;

  const draft = /(?:^|\s)(?:--draft|-d)(?=\s|=|$)/.test(argsOf(hidden, end));
  const found = review(cwd, work, input);
  if (!found.ok)
    return turnDownCreate(
      `The change review for ${work.branch} isn't ready (${found.reason}). Run the change-reviewer agent as the \`change\` skill's Review step says, with output ${found.path}. Answer each finding in the PR's Change section, then open the PR. (This checked ${work.branch}, checked out in ${cwd} when the command started.)`,
    );

  // the body comes from its file beside the review, is in the skill's
  // shape, and its Change section answers every finding
  const body = stateFile(cwd, "pr-body", work.key);
  if (!command.includes(body) || !existsSync(body))
    return turnDownCreate(
      `Write the PR body for ${work.branch} to ${body} and open the PR with \`--body-file ${body}\`, as the \`change\` skill's PR body step says.`,
    );
  const { problems, section, seen } = shapeOf(readFileSync(body, "utf8"), cwd);
  if (problems.length)
    return turnDownCreate(
      `The PR body (${body}) isn't in the shape the \`change\` skill's PR body step gives: ${problems.join("; ")}.`,
    );
  const why = unclosedAll(cwd, work, found, body, section, seen, input.transcript_path);
  if (why) return turnDownCreate(why);

  if (draft) return;
  const unready = notReady(cwd, work, found, section, seen, input.transcript_path);
  if (unready) return turnDownCreate(`${unready} Or open it as a draft (\`--draft\`) and mark it ready once that's done.`);
};

// a `gh pr <step>` and where it runs: its own arguments, whether it names
// the repo elsewhere, its checkout, and whether it's bare. A bare one acts
// on the PR of the branch checked out where it runs, so a gate can read
// that branch's files; a PR named any other way (a number, URL or branch;
// -R or --repo, before `pr` or after the step; GH_REPO or GH_HOST anywhere
// in the command: lib's prArgs) could be another branch's. Redirects are
// no argument
const stepOf = (command, hidden, match, input) => {
  const { args, elsewhere } = prArgs(command, hidden, match);
  const cwd = dirOf(command, hidden, match.index, input.cwd);
  return { args, elsewhere, cwd, bare: !args.trim() && !elsewhere };
};

// gh pr ready, run bare from the PR's own checkout: the review, the body's
// closings as edited onto the PR, and notReady. --undo puts a PR back in
// draft, which waits for nothing
const readyGate = (command, hidden, match, input) => {
  const { args, cwd, bare } = stepOf(command, hidden, match, input);
  if (/(?:^|\s)--undo(?=\s|$)/.test(args)) return;

  // The gate reads the lessons and review of the branch checked out where
  // it runs (stepOf's bare), so a PR named another way is turned down. Its
  // words give the one form that works from any folder, as an agent's
  // shell starts in its session's on every call: agents read "bare, as its
  // own command" as no `cd`, and stopped (2026-11-26, doc-lookups)
  if (!bare)
    return turnDown(
      `Run \`cd <the PR's own checkout> && gh pr ready\`, with no number, as one command: the gate checks the lessons and review of the branch checked out where gh pr ready runs, so it takes no PR named another way (a number, a URL, -R, --repo, GH_REPO). A worktree's checkout is its folder (\`git worktree list\` names each).`,
      "ready",
    );
  const branch = branchOf(cwd);
  if (prototypeBranch(branch)) return prototypeTurnDown(branch, "ready");
  const work = workOf(cwd, input);
  if (!work) return;

  const found = review(cwd, work, input);
  if (!found.ok)
    return turnDown(
      `The change review for ${work.branch} isn't ready (${found.reason}), with output ${found.path}: finish it as the \`change\` skill's Review step says, then mark the PR ready.`,
      "ready",
    );

  // a later pass may have found more since the PR opened: the body, as
  // edited onto the PR (`gh pr edit --body-file`), closes it too
  const body = stateFile(cwd, "pr-body", work.key);
  const { section, seen } = existsSync(body) ? shapeOf(readFileSync(body, "utf8"), cwd) : {};
  const why = section && unclosedAll(cwd, work, found, body, section, seen, input.transcript_path);
  if (why) return turnDown(`${why} Then \`gh pr edit --body-file ${body}\`, as its own command.`, "ready");

  const unready = notReady(cwd, work, found, section, seen, input.transcript_path);
  if (unready) return turnDown(unready, "ready");
};

// gh pr merge's flags that take a value, so the value is no PR
const MERGE_VALUES = new Set(["-b", "--body", "-F", "--body-file", "-t", "--subject", "--match-head-commit", "-A", "--author-email"]);

// gh pr merge on a dotfiles PR: one it can tell may be the dotfiles' (run
// in a checkout of them, or a command naming them anywhere) is named one
// way, by its number from a checkout of them, and merges only when the
// user asked for that number in a message of their own
const mergeGate = (command, hidden, match, input) => {
  const { args, elsewhere, cwd } = stepOf(command, hidden, match, input);
  const origin = githubOrigin(cwd);
  const here = origin && `${origin.owner}/${origin.name}`.toLowerCase() === DOTFILES.toLowerCase();
  if (!here && !command.toLowerCase().includes(DOTFILES.toLowerCase())) return;
  // GH_REPO, GH_HOST or gh flags before `pr`: lib's prArgs; -R or --repo
  // after `merge`, which prArgs leaves to the hook (pr-conflict hands them
  // on to its own gh), are turned down here. A value-taking flag's value
  // (MERGE_VALUES) is no PR, which lib's positional can't tell
  const words = args.match(WORD) ?? [];
  const named = positional(words.filter((_, at) => !MERGE_VALUES.has(words[at - 1])));
  // a process batch, run bare from its own checkout: its log is the
  // approval (batchUnapproved)
  if (here && !elsewhere && !has(words, "-R", "--repo=") && named.length === 0 && processBatch(branchOf(cwd))) {
    const why = batchUnapproved(cwd, input);
    if (!why) return;
    return turnDown(
      `A process batch merges by the agent only when the user's verdicts in its log approve every change (the dotfiles' docs/process.md, Landing), and ${branchOf(cwd)}'s can't: ${why}. Fix that, or leave the PR for the user to merge.`,
      "merge",
    );
  }
  if (!here || elsewhere || has(words, "-R", "--repo=") || named.length !== 1 || !/^\d+$/.test(named[0]))
    return turnDown(
      `Run \`gh pr merge <number>\` from a checkout of ${DOTFILES}, the PR named by its number alone (no branch, URL, -R, --repo or GH_REPO): only the user merges its PRs, and the gate checks that they asked to merge that number.`,
      "merge",
    );
  const number = named[0];
  const asked = new RegExp(String.raw`(?<![\w/.-])#?${number}(?!\.?\w)`);
  let messages = [];
  try {
    messages = userMessages(input.transcript_path);
  } catch {}
  if (!messages.some((text) => /\bmerge\b/i.test(text) && asked.test(text)))
    return turnDown(
      `Only the user merges a ${DOTFILES} PR: no message the user typed in this session asks to merge #${number} (a relay or your own words don't count). Leave it for them to merge on GitHub, or merge it once they ask for #${number} by its number.`,
      "merge",
    );
};

// the log a process batch adds its verdicts to
const PROCESS_LOG = "docs/process-log.md";

// why a process batch's PR can't merge without the user, if it can't: its
// review doesn't read HEAD (or only comment lines since) or owes a fix its
// recheck, so no reviewer has read what would merge, or its commits aren't
// the verdicts its log adds (the
// first commit adds them and nothing else; every later one names one, and
// only ones the user said yes to or edited). The log commit alone merges:
// a repo's batch has its entries here and its changes there, and a branch
// reads approvals only from its own first commit, so it approves nothing
// later
const batchUnapproved = (cwd, input) => {
  const work = workOf(cwd, input);
  const found = review(cwd, work, input);
  if (!found.ok) return `its review isn't ready (${found.reason})`;
  // a dictated change passes review() with no review file
  if (!existsSync(found.path)) return "it has no review of its own";
  if (!stillHead(cwd, found.sha)) return `its review is of ${found.sha}, and commits since change more than comment lines: run the change-reviewer's recheck on HEAD`;
  if (found.toRecheck) return `its review has ${found.toRecheck} to recheck: fix them, and run the change-reviewer's recheck`;
  const commits = lines(git(cwd, "rev-list", "--reverse", "--no-merges", `${base(cwd)}..HEAD`));
  if (!commits.length) return "it has no commits";
  const [first, ...changes] = commits;
  // numstat: added, deleted, path. Only adds: an edited or removed line
  // would rewrite a verdict the user gave
  const logged = lines(git(cwd, "diff-tree", "--no-commit-id", "--numstat", "-r", first)).map((line) => line.split("\t"));
  if (logged.length !== 1 || logged[0][2] !== PROCESS_LOG || logged[0][1] !== "0") return `its first commit (${first.slice(0, 7)}) must add the run's entries to ${PROCESS_LOG} and nothing else`;
  const added = git(cwd, "show", "--format=", first, "--", PROCESS_LOG);
  const approved = new Set([...added.matchAll(/^\+- (L\d+) (?:yes|edit)\b/gm)].map((entry) => entry[1]));
  for (const sha of changes) {
    const named = [...git(cwd, "log", "-1", "--format=%B", sha).matchAll(/\bL\d+\b/g)].map((id) => id[0]);
    const wrong = named.filter((id) => !approved.has(id));
    if (!named.length || wrong.length)
      return `commit ${sha.slice(0, 7)} names ${named.length ? `${wrong.join(", ")}, which the log doesn't add with a yes or edit` : "no log entry (L<n>)"}`;
  }
};

const GATES = { create: createGate, ready: readyGate, merge: mergeGate };

hook((input) => {
  const command = input.tool_input?.command ?? "";
  const hidden = masked(command);
  for (const step of hidden.matchAll(PR_STEP)) {
    const gate = GATES[step[1]];
    const turned = gate(command, hidden, step, input);
    if (turned) return turned;
  }
});
