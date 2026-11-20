---
name: test-sweep
description: The weekly sweep of tests in every repo: about 2 slices a week in all, picked by what changed since each slice's last sweep; finds duplicate, weak, stale and slow-but-covered tests and reports a plain numbered list for the user. Use when the weekly review starts it, or when the user asks for a test sweep.
---

# Test sweep

Tests pile up: a new one can repeat an old one, pass whatever the code does, or check something that no longer exists. The `change` skill, through the `testing` skill, checks the tests each change touches; this sweep reads the rest, a little at a time, where the code is moving. It grows with activity, not with how many repos exist (the dotfiles' `docs/process.md`, principle 2): a repo nobody has touched since its last sweep costs nothing.

## 1. Pick about 2 slices

A **slice** is a set of tests with the code they test, small enough for one careful read: one package's unit tests, or a few end-to-end specs for one area.

- **The repos:** each repo under `~/github/CristianCrane/`, once (worktrees share their main checkout's git dir), after `git fetch`.
- **The last sweeps:** `~/.claude/process/test-sweep.json`, one entry per slice: `"<repo> <the slice's paths>": { "sha": "<origin's default branch when swept>", "at": "<date>" }`. It's local, like the inbox: if it's lost, the sweep just starts over.
- **Score** each slice by the lines changed in its tests and its code since its sha (`git diff --shortstat <sha> origin/<default> -- <paths>`), or over the last 30 days if it has never been swept. A repo whose default branch hasn't moved since its last sweep scores 0 without a diff.
- **Take the top 2** across all repos, however many repos there are. If none scores above 0, there's no sweep that week.

## 2. Read each test beside its code

Read each test in the slice next to the code it guards. What makes a test a duplicate or weak is the `testing` skill's rule ("Each test earns its place"); the sweep adds how it finds them, and two more kinds:

- **Duplicates:** cite both tests.
- **Weak:** suspect it from what it asserts (only that something renders, a mock checked against itself, a check that passes on an empty page: the `testing` skill's "Every check can fail"), then prove it as that rule says, in a worktree on a detached HEAD (`git worktree add --detach <path> origin/<default>`, where edits need no survey): break the code, run that one test, see it stay green, and remove the worktree. Do this only for suspects, with no mutation tool.
- **Stale:** skipped (`.skip`, `.fixme`, `todo`), checking behaviour the code no longer has, or covering code nothing calls.
- **Slow and covered:** a slow test (by its duration in a run's report, as the `testing` skill's time budgets say) whose checks a faster test already makes.

The `testing` skill's rules apply, and the repo's own (its CLAUDE.md, and the testing doc it points to).

## 3. Report

A numbered list, written for the user as `~/.claude/hooks/main-session.md`'s "When you ask me to decide something" says (agents don't get that message: read it there). Each item gives the test (path:line), what's wrong, the evidence (the other test, or what you broke and the green run), and what to do, said as an action: "drop this test", "merge it into <test>", "keep it: it checks <what>". The user answers the whole list in one line. Then record each swept slice in the state file, whatever the list holds. End the report with the sweep's Tokens line (`node ~/.claude/hooks/usage.mjs --agent <its id>`).

## 4. Land what the user approves

One PR per repo, through the `change` skill, on a branch `test-sweep-<date>`. The PR body gives test coverage before and after from the repo's coverage command (a package's `test:coverage` script, or what its testing doc names). Where no coverage command covers a removed test, the body names the test that still checks its case.

## Cost

The sweep counts toward the process layer's limit of 3% of the plan's week (D25). When the sweep's own share passes 1% (its Tokens line plus its PRs'), the next sweep takes 1 slice, and says so.
