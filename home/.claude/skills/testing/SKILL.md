---
name: testing
description: Test rules for any repo. Use before writing or editing a test, changing how tests run, or timing a run or chasing a test that fails or runs slow.
---

# Testing

A test is worth what it catches. Each rule here came from a test that passed with the code wrong, a run that failed for a reason outside the code, or a timing that measured the machine instead of the change. The repo's own testing doc, which its CLAUDE.md names, adds its harness, its helpers and its budgets.

## Writing a test

- **Each test earns its place.** If another test already checks the same thing at the same level (unit, browser, end-to-end), merge the two or drop one. And it must fail when the code it guards breaks: break that code by hand (flip a condition, drop a call), see the test go red, and put the code back. A bug fix's test, red on the old code (the `change` skill's Survey), has shown that already (2026-11-19: nothing checked a new test against the others, or against broken code).
- **Every check can fail.** Before breaking the code by hand, say what each check would see with the code wrong. An absence check first shows where the thing would be: the page settled, the menu that would hold the action open. A text match is exact, or reads the text from where the app holds it (a tour's steps from its data). A hidden-check on a page still loading, a count of 0 after an action moved into a menu, and a substring match on a retyped title each passed with the code wrong (empire-cleaning #331, #409, #336).
- **A test no PR runs** (nightly, or against a sandbox) finds what it acts on through the helpers the PR's tests use, so a change that would break it breaks them first. empire-cleaning #444 moved a button, and only the next night's sandbox run went red (2026-11-14).

## Changing how tests run

- **A speed-up runs the same checks faster** (more workers or shards, a quicker setup), **never fewer or weaker ones.** Cutting checks for speed was offered and turned down twice: skipping or thinning a slow suite's tests (empire-cleaning's seed tests, 2026-11-05), and less coverage (2026-11-06).
- **A change to how tests start, stop or wait checks how they fail beside how they pass**, before its review: a port already held, a process that dies, a setup step that fails, each failing at once and saying what. A start only seen passing can run the tests against the wrong server, or wait out its timeout: on empire-cleaning #312 an API on a held port said it was listening and served nothing, and a failed start held the run for 120 s (PR #325, review F3 and F10).
- **A run's shared resources are named for the run** (its databases, its scratch folders, its ports), never for the checkout or the machine. Two runs in one checkout happen: named per checkout, the second recreated the first's databases under it, and 48 of 51 files failed (empire-cleaning #375), and two e2e runs took the same ports (empire-cleaning #558). So a run leases its ports, a free block it holds for as long as it lives, and nobody hands it one or picks one by hand. A port still picked by hand (a dev server, a repo whose runs don't lease) stays below 32768, where Linux hands out ports for outgoing connections, and outside the range the repo's runs lease (its docs say): hand-picked blocks above 32768 were refused with nothing listening four times (empire-cleaning's testing log, 2026-11-22 to 25).
- **A project sets the time budget for its kind of test, and says why in its config.** A single test past it says so beside it, with why, and the issue that will bring it back when there is one; raising the project's budget to fit one slow test would hide a hang or a slowdown in all the others. The tests nearest the budget are the ones that fail under load, so read each one's duration from a run's report (Vitest's `--reporter=json`, Playwright's report): empire-cleaning's slowest server test passed 5 s with two checkouts' runs at once (PR #323).

## Timing a run, or chasing a failure

How a cause is shown is the global CLAUDE.md's Evidence and the `change` skill's Survey. For tests:

- **Runs already going.** Before timing, look for the repo's test runners by their command lines: `ps -eo pid,args | grep -E "[p]laywright|[v]itest"`, the brackets keeping grep from matching itself (`pgrep -af` matches the shell that runs it, so it always finds one: empire-cleaning de908e75).
- **Before against after: in turns, on tests both share.** Other runs start and stop mid-measurement: on empire-cleaning PR #379 the load went from 9.2 to 12.2 as another checkout's run started, and five runs of one file drifted from 6.7 s to 9.6 s. So time the default branch and the change in turns, each in a worktree of its own, never one series and then the other. Time only tests both sides have: tests the change adds time themselves, not the change.
- **A run alone against one beside another.** A test red only beside another run is load or something shared, such as a port or a database name. Many copies of one test at once (Playwright's `--repeat-each`, several workers) tell a race apart from state left behind (empire-cleaning #310).

## Tools

- **Playwright's `--project` takes several values**, so in `--project phone e2e/bills.spec.ts` the spec is read as a second project: write `--project=phone e2e/bills.spec.ts`, or the spec first (empire-cleaning, kept in memory until 2026-11-19).
