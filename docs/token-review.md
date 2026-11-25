# Token review: weekly measures and findings

Where the plan's tokens went each week, against the week before, whether 3 of the week's PRs used the `change` skill for real, how much rework and how many late catches the week's changes took, and what was done about it. One entry per week, newest first.

A SessionStart hook (`home/.claude/hooks/usage.mjs`, `--hook`) says when a review is due: at the first main session started 7 days after the newest entry's date. Claude then offers to run it, and on a yes starts the agents "Running a review" names. The hook dates the review by the newest `### YYYY-MM-DD` heading below, so keep that shape.

## Running a review

One agent runs it, started from the main session, and reports back in a few lines. A second agent, started beside it, runs the `test-sweep` skill; its numbered list goes to the user with the review's report.

1. **Work in a `git worktree` of the dotfiles, under the `change` skill**, as the dotfiles' CLAUDE.md says. The entry lands by PR, which the user merges.
2. **Run `node ~/.claude/hooks/usage.mjs --week`.** It prints the 7 days before today beside the 7 before those, measured the same way every week; its header says which numbers are estimates. A week whose readings or PRs need a closer look: `--week --since <day>` for another week, `--since <day>` for each workstream from a day, the transcripts under `~/.claude/projects` (kept 30 days).
3. **Set the week against the last entry.** For each measure that moved, find where the tokens went: the costliest workstreams, the cost by agent type, a day's table. `--week`'s steps by agent type say how: more steps per agent, a costlier step (a bigger context), compactions, or the machine's load; its single reads sit beside the 2026-11-22 audit's 47% for builders, and its docs columns (the Markdown an agent brought into context, and the share of its cost those docs held through their rereads) say which agent type reads the most. `--agent <id>` breaks one workstream down by stage, agent and kind of step.
4. **Name what to make more efficient,** each finding with its evidence: a number and where it came from.
5. **Grade 3 merged PRs' use of the `change` skill.** An earlier plan-first hook was obeyed on paper only (PRs #249 to #254 each said "Extended … nothing harder", and #254 waved a third copy through), so each week checks the skill isn't. Take the week's 3 PRs with the most changed files among those with a Change section, Dependabot's left out (`gh search prs --author=@me --merged-at <from>..<to> --json repository,number`, the search `--week` counts, then `gh pr view <n> -R <repo> --json changedFiles,body,commits`). For each, read its body's Change section, its commits, and its survey and reviews (`claude/` in the repo's git dir or in `.git/worktrees/<name>/`; pruned with a merged worktree, the reviewer's writes stay in the transcripts: `rg -l -a 'Change review: <branch>' ~/.claude/projects`: `-a`, as rg skips a file with a NUL in it, and a crash leaves runs of them). Ask: did it retire or fold a pattern, or add a copy, and with what reason? Is "Simpler shape considered" a real shape, weighed, or a strawman? Did each finding get a fix or a reason, or a dismissal? Take its rework from its Change's `Rework:` line (the `change` skill, PR body; a PR with no such line, merged before it existed, has its rounds counted from its reviews), and count the `[change]` and `[text]` findings. Grade it **real** (each answer real), **partly** (one hand-waved) or **filler** (the parts filled in on paper), with one quoted line as the evidence. Its tokens: the `weighted` column of `usage.mjs --since <the day its work began>`, summed over every workstream that built or fixed it: one whose description names the PR, the issue it closes, Dependabot's PR it replaces, or its subject ("Schedule drag ghost outline" for a PR titled "a dragged Job shows where it would land"). A main session's turns on it aren't counted: the table can't split them by PR. A partly or filler grade, or the same miss in two PRs, is a finding, as in step 4.
6. **Count rework and late catches per change.** Over every PR the week merged with a Change section (step 5's search), add up the `Rework:` lines (the `change` skill, PR body), per PR and in all, beside the week before, with the late catches by the step that let them in, and apart by who caught them: a review of the diff, or what got past every review (CI after green quick tests, an audit, the user, or after merge). Both should fall: rework and audits are a sign the process is broken, not part of it (the user, 2026-11-23). A step that lets late catches in two weeks running is a finding, as in step 4. Until 2027-01-18, eight weeks after the `critical-reviewer` began: set the late catches in changes at stakes (money, sign-in, security) against its cost (~4.0% of a 5-hour window a plan pass, in its trial); if by then they aren't falling, it's changed or dropped, and this sentence goes.
7. **Write the entry** at the top of the log: a `### <today>: <the week in a few words>` heading, the report's measures as a table (this week, the week before), step 6's counts beside them, a line on what changed since last week, the PR grades as a table (PR, grade, rounds, findings, weighted tokens, evidence), and each finding with what was done about it: a dotfiles issue (`gh issue create -R CristianCrane/.dotfiles`), one per finding that needs work; a signal for the process layer's curator (`capture.mjs --kind cost`, its text on stdin: `--help`; `docs/process.md`); or nothing, and why.
8. **Report** the headline numbers, the 3 grades, the rework and late catches, and each finding with its issue link.

## Log

Open: the 2026-11-23 token batch (process-log L149–L154) and its trial of a 185k `autoCompactWindow` (L153, after the 300k one below). Once two full 5-hour windows of build work have run since it merged, the next entry sets `node ~/.claude/process/audit/2026-11-22-usage/metrics.mjs --since <the first window's start> --until <the second's end>` beside the baseline in that folder's `metrics.md`, and keeps 185000, moves it or sets it back to 300000, with the review findings held. This line goes with that entry.

Open: the single-read nudge (`home/.claude/hooks/reads.mjs`, registered in settings.json on the day its PR merged). Four weeks from that day, the entry sets builders' single reads in `--week`'s steps by agent type beside the 47% baseline (2026-11-22 usage audit; 59% and 57% in two builders on 2026-11-25): under 47%, it stays; otherwise its registration and reads.mjs go. This line goes with that entry.

Open: searching the decision and test logs instead of reading them whole (ux-reviewer.md's Read first, and empire-cleaning's CLAUDE.md, from the day both PRs merged). Once 20 ux-reviewer runs have finished since then, the entry sets `node ~/.claude/process/audit/2026-11-25-doc-reads/measure.mjs --change <that day>` beside the baseline in that folder's `metrics.md` (ux-reviewers: 94KB of docs in a run, 38KB of it the ux-log, 22% of their cost; builders: 173KB, 34KB and 13KB of the two logs, 2%). Where ux-reviewers' ux-log KB hasn't fallen by half, the entry says why, from their transcripts: a Read with no Grep before it, or rows found by search that were long. This line goes with that entry.

### 2026-11-18: the 300k autoCompactWindow trial

Measured by the trial review's own scripts from the transcripts, before `--week` existed, over two spans of unequal length: before (10-22 to 11-10 08:03 UTC) and the trial (11-10 08:03 to 11-18), with `autoCompactWindow: 300000` (b7b147f) and the global CLAUDE.md's "Few turns in the main session" bullet. Weights as `--week`'s: input 1, cache read 0.1, 5-minute cache write 1.25, 1-hour write 2, output 5.

| Measure | Before (10-22..11-10) | Trial (11-10..11-18) |
| --- | --- | --- |
| Weighted tokens per active day | 40.1M | 36.6M |
| Main sessions' share | 78.9% | 6.9% |
| Main context per turn: mean | 228k | 144k |
| Main context per turn: p95 / max | 487k / 967k | 249k / 267k |
| Agents per active day | 23.5 | 34.9 |
| Merged PRs | 221 | 41 |
| Weighted per merged PR | 3.4M | 6.3M |

**What changed:** the main session's share fell from 78.9% to 6.9%, and its context per turn from a mean of 228k to 144k: the window caps it. Auto-compaction fires at about 267k: the median context compacted was 268k over 20 auto-compactions, 18 of them in build agents.

**Findings:**

- **Weighted tokens per merged PR nearly doubled,** 3.4M to 6.3M, confounded by the trial's larger PRs. The next lever is agents' cost per PR, not the window. Done: nothing yet; `--week` now gives the cost by agent type each week, to find it.
- **Keep both** the 300k window and the "Few turns in the main session" bullet. Done: nothing to change.
- **The ledger weighed every cache write at the 1-hour rate,** though agents write only the 5-minute cache (every day 11-09 to 11-18), so agents' cost read high beside main sessions'. Done: fixed with `--week` (the ledger keeps each message's split, and weighs a row without one by who wrote it).

**Change skill, 5 PRs (graded 2026-11-19):** the first grading, of empire-cleaning's 5 newest merged PRs (#463 to #467, all 2026-11-17), before step 5 picked 3 by size. Review files from the worktrees left (#464, #467) and the transcripts (the other 3). Tokens from `--since 2026-11-17`, each PR's one build workstream; the look #467's user iterated on in the main session isn't in its number.

| PR | Grade | Rounds | Findings (change / text) | Weighted | Evidence |
| --- | --- | --- | --- | --- | --- |
| #467 drag outline | real | plan, 3, 2 rechecks | 5 / 2 | 3.5M | "Retired: two copies of a block's place on the time axis (PickSlot's and the Schedule's `place`), now `onAxis`" |
| #466 astro bump | real | plan, 1 | 2 / 0 | 1.1M | "Simpler shape considered: a pnpm catalog plus a `vite` override …; dropped in the plan review" |
| #465 stale save | real | plan, 1, 1 recheck | 4 / 2 | 3.9M | "Retired: two test copies that stripped `version` from what they read" |
| #464 legal pages | real | plan, 2, 2 rechecks | 6 / 3 | 4.9M | "Retired: four hand-written reading columns, now `Prose.astro`" |
| #463 prod Blueprint | partly | plan, 1, 1 recheck | 1 / 5 | 1.6M | "Extended: the static sites' security headers, 2 copies → 4, all held equal by the same test" |

**What it showed:** no filler. Every finding, 18 change and 12 text, got a commit, a survey fix or, once (#463's F4), an edit to the issues it named; none was waved off. #463's copies have a reason (Render can't share settings across Blueprints, quoted) and a test holding them equal, but nothing was folded and its generator option got one clause. The ratchet works because of the plan review: 14 of the 18 change findings came there, and all 5 plan reviews found copies or a simpler shape the author's survey missed (#465's survey called its pattern new, "0 copies"; #464's counted 1 reading column of 4). Where the reviewer didn't push, the author's own "Simpler shape considered" was thin (#464: "one page with both policies").

**Finding:** the survey misses copies even though the skill says to search for them; the plan review catches each at a paragraph's cost. To tune, if it holds next week: the survey lists what it searched for each pattern, as the reviewer's `## Searched` does, so a missed search shows. Done: put to the user, not acted on yet.

**Finding:** #463 graded partly: it added copies and folded none, and its generator option got one clause. Done: nothing, as the copies are held equal by a test and Render can't share them (its docs, quoted in the PR); a single partly, not a pattern, so the next grading watches for it.
