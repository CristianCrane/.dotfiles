# Token review: weekly measures and findings

Where the plan's tokens went each week, against the week before, and what was done about it. One entry per week, newest first.

A SessionStart hook (`home/.claude/hooks/usage.mjs`, `--hook`) says when a review is due: at the first main session started 7 days after the newest entry's date. Claude then offers to run it, and an agent does, on a yes. The hook dates the review by the newest `### YYYY-MM-DD` heading below, so keep that shape.

## Running a review

One agent runs it, started from the main session, and reports back in a few lines.

1. **Work in a `git worktree` of the dotfiles, under the `change` skill**, as the global CLAUDE.md's "This machine" says. The entry lands on main with no PR.
2. **Run `node ~/.claude/hooks/usage.mjs --week`.** It prints the 7 days before today beside the 7 before those, measured the same way every week; its header says which numbers are estimates. A week whose readings or PRs need a closer look: `--week --since <day>` for another week, `--since <day>` for each workstream from a day, the transcripts under `~/.claude/projects` (kept 30 days).
3. **Set the week against the last entry.** For each measure that moved, find where the tokens went: the costliest workstreams, the cost by agent type, a day's table.
4. **Name what to make more efficient,** each finding with its evidence: a number and where it came from.
5. **Write the entry** at the top of the log: a `### <today>: <the week in a few words>` heading, the report's measures as a table (this week, the week before), a line on what changed since last week, and each finding with what was done about it: a dotfiles issue (`gh issue create -R CristianCrane/.dotfiles`), one per finding that needs work; a lesson (the `lessons` skill); or nothing, and why.
6. **Report** the headline numbers, each finding with its issue link, and the agent's own Tokens line.

## Log

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
