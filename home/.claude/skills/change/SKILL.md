---
name: change
description: Survey the patterns a code change touches before its first edit, get a fresh change review before its PR, write the PR's body, and close with its lessons. Use when starting any change in a git repo, or when a hook asks for a survey, a review or lessons.
---

# Change

Each change leaves the codebase with less entropy, never more. Left alone, an agent judges this after its approach is already chosen, grades its own work, and extends whatever pattern is there because extending is the easy path. So the survey comes before the plan and holds facts, a fresh reviewer argues against the change, and extending is the choice that needs a reason.

A **pattern** is any shape the change follows or adds: a helper, a table, a layer, a test harness, a hook, a doc convention, a copy of code across packages.

## Rules

- **Ratchet.** A change may leave the code no simpler, but it never adds a third copy of a pattern, never bends a pattern that fights the change, and never edits one idea in many places (shotgun surgery: fold the idea into one place first).
- **A removal leaves nothing behind.** A change that removes a feature, or the last caller of something, finds what only it used (props, states, words, stories, route guards, endpoints, its tests) and deletes them in the same change: empire-cleaning#404's review found two such leftovers, a round each (F22, F26). It also searches every test for the words and values it removes, not only the tests the quick run takes: on empire-cleaning PR #109 a list row's trimmed text failed a spec nobody ran locally, on CI alone.
- **The simplest shape is the plan.** When the survey finds a simpler shape than extending, build that. Extending instead takes a written reason, which goes in Change.
- **One kind of work per commit**: a refactor, a change, or a cleanup. A PR carries them in that order: refactor commits, then the change, then cleanups. That order holds up to round 1; fixes and later scope go on top, never before a refactor commit.
- **Refactor first.** A refactor that changes no behaviour goes in the PR's first commits, and the change is built on top of it.
- **Fix what you see, on a screen as in the code.** A problem outside the change, seen while building or by a reviewer, goes on the survey's `Seen nearby:` list and is fixed in a cleanup commit after the change's. A screen the change touches counts: it's left truer than it was found, so what's untrue, stale or said twice there is fixed in this PR, whether or not the brief names it, a design pick or a rework included. Nothing is filed for later but a later pass's `[polish]` (Review): outside what the change touches, one too big for this PR goes by Big work (below), or to the open issue or PR that already plans it, named with its why in the report and the PR's Change. A stale doc in a repo with a docs map is fixed by a note (Build). On empire-cleaning #509 the build agent fixed a Site Visit's badge its brief named and left the line beside it, untrue once the visit had been, as "I left it alone", with no reason; three review rounds passed it (2026-11-22).
- **Keep open issues true.** An open issue's body is the plan the next agent builds from. A change that makes one wrong (a file it names, where something lives, a placeholder issue number) edits that body in the same PR, and merging the default branch into a branch rechecks the bodies of the issues it plans: empire-cleaning #337 moved the shared messages while #302 still planned them a second home (#308, review F11).
- **Big work.** The survey splits a change the moment it outgrows one reviewable PR (~20 files): the rest goes into an issue the first PR links, and the report says so. A refactor or cleanup over ~10 files, or one that crosses packages: stop and ask the user one thing, whether it rides in this PR or gets its own. A refactor's own PR merges first, and the change's branch then starts from the default branch; a cleanup's follows the change's.
- **Phases.** The survey with its plan review, the build, and the review with the PR can each run in a fresh agent, so none carries another's reading: the main session briefs each with the survey's and reviews' paths and the user's calls since, as the survey, its reviews and the branch's `git log` are the handover. A phase ends with a commit and a report.
- **Every change** but a dictated one or a prototype (below) gets a survey, a plan review and a review. A small change writes a one-line survey; one for a bug carries its Cause.
- **Dictated config:** a change to one Claude settings file that the user dictated exactly (they named the permission rule, model or theme), that only makes Claude ask or refuse more (an allow rule removed, a deny or ask rule added) or sets the model or theme to a value they named, touching no code, hook or rule text, gets a one-line survey, `dictated: "<their words>" <the file's path>`, and no plan review or review; the report to the user says it went with no reviewer. The gates hold it: they find the quote in a message the user typed, and each entry the change makes named in it; anything wider (another file, a plugin, a rule that widens what runs, an entry the quote doesn't name as a whole, more than five entries) gets the full flow. Its lessons still run (a `None:` line is enough); a PR's Change section says `Review: none, dictated`.
- **Prototype:** a branch named `prototype-<name>` holds a throwaway look (made-up data, pushed as the record) and gets no survey, plan review or change review (its UX review: the `ui` skill, Settling a screen). It never reaches the default branch, by PR or by merge: the gate turns its PR down, and the pick is built on its own branch with the full flow.
- **A step's reads go in one turn.** Gather what a step needs to read (the files, the searches, the read-only commands) and send them as several tool calls in one turn, then work from all of them; a read that needs an earlier one's answer waits for it. Each turn re-reads the whole context: on 2026-11-22, 47% of builders' turns and 76% of change-reviewers' were a single read, about 12% of a 5-hour window (the usage audit, `~/.claude/process/audit/2026-11-22-usage/report.md`).
- The repo's own rules (CLAUDE.md, ADRs) add to these.

## 1. Survey

Before the first edit: the survey gate turns edits down until it exists and names a file by its path from the top of the checkout (`home/.claude/hooks/lib.mjs`, not `lib.mjs`), and its turn-down names the survey's path. (The survey lives in the git dir, one per branch. On `main` in a checkout whose origin is on GitHub the gate turns down every edit of a file git doesn't ignore: branch first, a worktree off origin's `main`, and a PR. An ignored file there (`.claude/settings.local.json`, in every checkout, by the global git ignore home.nix sets), and `main` with no GitHub origin, keep the session's survey.)

```
Change: <one line>
Stakes: none | money | sign-in | security: <what of it the code touches>
Cause: <what's wrong>, shown by <evidence> | <what's wrong>, to show: <how> | none: no bug
Design:                       (at stakes)
  1. <the approach, a step a line>
Patterns touched:
  - <name>: <n> copies — <path>, <path>, … — fits | fights the change
Simplest shape: <what> (~<n> files)
Plan: refactor first | extend — <the reason, when extend>
Commits:
  - refactor | change | cleanup: <what>
Expected files: <n>
Seen nearby:
  - <problem> — <path>
```

A bug (wrong behaviour, a failing or flaky test, a run that's too slow) has a cause, and the cause is a claim until evidence shows it: a reproduction, a trace, numbers before and after, a test red on the old code, each taken as the code runs (the same handler, PATH, shell, data). Evidence that takes an edit (a red test, a trace needing instrumentation) is `to show:`, and the branch shows it before round 1. Count copies by searching the repo for each pattern, by its shape and by its values and words (a key's value, a sentence's phrase), not from memory: a copy can go by another name. Done when a bug's Cause is shown or says how it will be, every pattern the change touches is listed with every copy's path, and the simplest shape has a file count. `Seen nearby:` grows while you build; each item becomes a cleanup commit.

**Stakes** says whether the code the change touches moves money (a charge, a refund, a price, a bill), knows who someone is (sign-in, a session, a reset), or decides who may reach what (permissions, secrets, and input from outside where it reaches one of these: a webhook, a redirect URL, an id in a request that picks whose record). A mistake there hurts a real person before anyone sees it, so a change at stakes gets the `critical-reviewer` on its plan and its diff: "our best eyes on the critical stuff we cant afford to mess up … hopefully invoked only when critical stuff is being touched" (the user, 2026-11-23), after a client could be charged twice for one Bill in merged code, found as an aside (empire-cleaning#533), which set off an audit of every money path (#534). Judge it by what the code touches, not the change's size. At stakes, `Design:` is the approach step by step, what the critical reviewer reads as the plan.

## 2. Plan review

Run the `change-reviewer` agent in **plan** mode, with the survey's path and the plan review's path (`plan-review-…` beside the survey; the gate names it). It reads the survey before any code exists, when a wrong shape or an unshown cause costs a paragraph rather than rework. Revise the survey for each finding, or give round 1 your reason against it (round 1 carries the plan review's findings forward). One plan review per change, whose header records the survey's Expected files (a survey redone with new ones gets another: Build); edits go through once it's written.

**At stakes**, run the `critical-reviewer` agent beside it in **plan** mode, briefed as its description says and with nothing more: the commit is the one the plan starts from, its output's path is `critical-review-…` beside the survey, and any ports it's given are a share of yours. Its findings (`C<n>`) are fixed on the survey as the plan review's are, its diff pass checks them, and Build waits for both.

Post the survey in chat, then go on, unless it has Big work to ask about, or departs from what the user picked (a prototype, an option they chose): put each departure to them then, not at the PR (empire-cleaning #435: three waited from the plan review to the PR, and held it there).

## 3. Design review

A change a person sees is reviewed as a design before its code, sized as the `ui` skill's Settling a screen says (a new flow or look, a change to how a flow behaves, a wording change), once the plan review is in and before the screen's code is written. Run the `ux-reviewer` on the design as on after-shots, its output `ux-review-design-…` beside the survey (a prototype's lives on its own branch), so the after-shots' review in Review starts a file of its own. Fix its findings there, with a later pass while its `<r> to recheck` is above 0 (Review); a new flow or look then goes to the user with its versions, and Build starts from their pick. A change no person sees skips this step.

## 4. Build

A change that writes or edits a test, or changes how tests run, loads the `testing` skill first; one that changes a screen, or words a person reads, the `ui` skill.

Keep the survey true where it steers the work: its Cause (`shown by` what, once a `to show:` is shown), its patterns and their copies. The build stops at 1.5x the files the plan review counted: an edit past that is turned down until the change is split (commit what's built for its own PR, the rest in an issue it links, then end and report) or the survey is redone, its new Expected files with a plan pass of its own. Its `Commits:` list is the first plan and stays as written: from round 1 the branch's own `git log` is the record, and the PR's Change is written from that and the reviews, so a commit list or file count behind the branch is no finding. On empire-cleaning PR 14 (2026-11-23) ten of 41 findings were the survey and docs gone stale after later commits, each a fix and a recheck.

**A doc change is a note** in a repo with a docs map (`docs/map.md`): only the `doc-curator` writes the files it lists (a hook turns other writes down, and CI any commit of one without its trailer), so each fact sits in one home and the docs every agent reads stay short (.dotfiles#61). Add each fact the change makes true, or a doc it makes stale, to the branch's `claude/doc-notes-<branch>.md` in the git dir, beside the survey; a fact found outside any branch goes to the repo inbox, `~/.claude/process/doc-inbox/<project>.md`:

```
- fact: <one sentence>
  evidence: <a path and line, a commit, a test, or the user's words>
  kind: rule | decision | screen | term | how-to
  doc: <the file it belongs in>
  quote: "<the user's exact words>"   (decision only)
  rules out: <what it rules out>   (decision only)
  finding: F<n>   (when a review finding asked for it)
```

History (what happened, when) is no note: git and the PR keep it.

**Edit through Edit, read first.** A script that rewrites text (a string replace, a cut between two markers) hits what matches, not what you meant: in the week to 2026-11-23 about 25 redos came from replaces that caught a longer name (`t.w.cancel` in `cancelledFree`), text Prettier had reflowed, a `` $` `` in a replacement string, or swapped bounds, and from Edit calls refused after a script changed the file under them. A script earns its place for one mechanical change across many files; read its diff before the next step, and Read the file again before an Edit.

**No `git stash` in a worktree.** Every worktree of a repo shares one stash, so a pop can bring another agent's work into yours (empire-cleaning, 2026-11-22), and `git checkout -- .` drops your own uncommitted fixes. Keep work with a commit, or a patch in your scratch folder.

When a change touches what a build ships or the order things load in: that a build leaves something out (test-only code kept out of production) is a claim too. Build it as the host does and count a marker, a string only that code holds, in both builds' output, while building: tree-shaking guessed at was wrong three times in one day. When load order changes, check the first paint too, throttled. The repo's own docs say how its host builds.

## 5. Review

"if the review is actually catching things that need to be caught, it is a good spend. if were just burning tokens for trivial things, this is bad spend" (the user, 2026-11-26). In six changes (333 findings, 28M reviewer tokens) first passes found nearly every real bug and problem for a reader, and broad re-reads after them mostly polish, repeats and fixes of fixes: #538's rounds 5-12 and #517's 3-7 spent 5.5M reviewer tokens for no real one. A narrow read of a fix did catch real bugs: #508's C10 and C12 grew out of C7's fix, and #561's fixes made 12 (the review-worth study, 2026-11-25). So the first look runs in full, and after it a reviewer comes back only to read fixes worth a second look. Every pass's prompt lists the issues filed so far and their findings, so it leaves them be. The change-reviewer runs nothing that writes, so run the repo's quick tests beside it.

1. **The first look**, once the change is committed: with doc notes, the `doc-curator` first, in per-PR mode on the branch and its notes, so its commit is part of what round 1 reads; then round 1 of the `change-reviewer`, with the branch, the repo root, which commits are refactors (subjects led by `Refactor:`), the survey's and plan review's paths, its output `review-…` beside the survey. **At stakes** the `critical-reviewer`'s diff pass runs beside it, briefed as in Plan review, same output path, or once a round finds the Stakes call wrong (the change-reviewer's hunt 11). **A change a person sees** gets the UX review's first pass: take the after-shots at a phone's width and a laptop's, as the repo's CLAUDE.md says (empire-cleaning: `pnpm pr:shots` with `--desktop`), and brief the `ux-reviewer` as its description says, its output `ux-review-…`.
2. **`[recheck]`** marks a finding whose fix most needs a second read, as each reviewer's file says, and each header counts those its later passes haven't seen fixed: `<r> to recheck`. What a person reads means the product's words (a screen, an email, a server message), not the survey, the PR body or a review file: a fix to those is paperwork no pass comes back for, and closes as the PR body's Review line says. On empire-cleaning #565 two such findings (a survey's file size) held a draft with no pass that could read them, until the user ruled (2026-11-26).
3. **Fix every finding**, with any failure the quick tests found, each commit naming the ids it fixes (`F3 U2`, or `CI` for a check's failure): one fixing none is new work, read by the change-reviewer before `gh pr ready`. Rerun a critical finding's proof on the code before acting on it. Retake the shots a fix changes. A finding a doc's change fixes is a note carrying its `finding: F<n>`, and another per-PR run of the `doc-curator`, whose commit names it.
4. **A later pass** goes through (agent-gate) only while its own review's `<r> to recheck` is above 0, the critical-reviewer's while any review's is, and only on fixes committed since that reviewer's last read. A screen is new to the UX review when a commit since its shots changes what a person sees (a screen's file, or its words) and names no `U<n>`: retake those screens' shots, tell it which are new work, and it gives them a first look, as #561's and #508's screens changed after a pass owing none (2026-11-26). A later pass's `[polish]` finding needs no fix: its line in the body's Change ends `listed`, or `filed in #<n>`. A design review passes again while its own count is above 0, as a design is fixed in place.
5. **Draft PR** (`gh pr create --draft`): the gate takes it once round 1 is of a commit on the branch and the body closes every finding. Where the full suite is CI's (the repo's CLAUDE.md says), push each fix it needs as it's made, and `gh pr edit --body-file` after each later pass. `gh pr ready` waits for no review owing a recheck, the commits named, the closings, each doc note marked by the curator, and the lessons.

**The reviewer has the last word.** A finding exists to make the work better for whoever meets it, a person on a screen or the next builder in the code, so it's fixed: "If there is a finding, it needs to be fixed" (the user, 2026-11-23). A turn-down makes sense only when fixing it isn't this change's to do: the owner's business call (to the owner's list the repo's CLAUDE.md names), the app's frame or shared header (the user's, as the `ui` skill says), or a screen the change doesn't touch (to the issue or PR that plans it). A rare state, a call on one screen or a recorded pick still costs the finding's reader, and a pick a finding shows wrong is changed with its record (by a note, where the record is a doc and the repo has a docs map). Give a turn-down or your case in the prompt of that reviewer's next pass, a UX finding's with its shot; its `turned down:` or `conceded:` closes the finding, and one it holds is fixed. With no pass owed, fix it or put your case to the user, whose ruling closes it (`ruled by the user: "<their words>"`, as typed). On empire-cleaning #527, #536 and #538 builders answered UX findings away and the user caught the same thing after a green build (2026-11-22, 23).

**Done** when no review owes a recheck, the body closes every finding, and every check is green. A loop (a fix undone by the next pass, the same point back in new words, two findings that can't both be met) goes to the user with its paths.

## 6. PR body

A PR body says what a reader needs to check the change, and nothing else, written as the global CLAUDE.md's "Writing for me" says. Write it to `pr-body-…` beside the review (the gate names it) and open the PR with `gh pr create --body-file <that path>`. This shape replaces any other PR template, such as `mattpocock-skills:pr`'s. In this order:

```
**Problem:** <one sentence>

**Fix:** <one sentence>

**Check these:**
- [<path>:<lines>](https://github.com/<owner>/<repo>/blob/<sha>/<path>#L<a>-L<b>): <a few words on why>

**Before / after:**
<the screenshots, side by side>

**Tests:**
- [<test>](<permalink>): <what it shows>; red on the old code

<details><summary>Change</summary>

## Change
- Extended | Retired | New: <pattern> — <paths>
- Simpler shape considered: <a real shape>; <why not, or "done in <sha>">
- Review | UX review | Critical review: F<n> | U<n> | C<n> <finding> → fixed in <sha> | listed | filed in #<n> (a later pass's `[polish]`) | ruled by the user: "<their words>" | fixed in the survey | fixed elsewhere: <where> (on the body's word alone for a finding owing no recheck; one owing one takes its review's own word, which only a pass a later commit brings can give, or else the user's ruling) | its review's own word on it: conceded: <why> | turned down: <reason>
- Seen nearby: <problem> → fixed in <sha>
- Rework: <n> later passes, <n> polish listed or filed; late catches: <each by its id (F3, C2), or what and who caught it where it has none, then the step that let it in> | none
- Harder to change: <what, or nothing>

</details>

<the attribution footer>
```

- **Problem** and **Fix**: one sentence each, in the repo's own words.
- **Check these**: 3 to 5 links to the lines that matter most, each a permalink at HEAD's full sha as the body is written, with a few words on why.
- **Before / after**: only for a change a person sees, and then always: screenshots of each screen it changes, before and after side by side, made as the repo's CLAUDE.md says.
- **Tests**: only for a change to the server or other code a person doesn't see: permalinks to the most relevant tests, at HEAD's full sha too, saying which one was red on the old code.
- **Change**, collapsed: the blank line after `</summary>` lets GitHub draw the heading. One line per pattern, per review finding and per `Seen nearby:` item. `Rework:` counts each late catch as the `lessons` skill defines it. The weekly review reads it there, as the review files go with the worktree (the dotfiles' `docs/token-review.md`). When the PR has refactor commits, Change names what they retired and says how behaviour was shown unchanged.

No other headings or labels (a line led by bold is a label): no summary of runs, no list of commits. The gate turns the PR down until the body is in this shape, its permalinks at commits on the branch, and Change closes every finding of each review by id in a closing the template gives (`answered:` closes nothing); a body with Before / after also waits for the UX review.

## 7. Lessons

Once every check is green, run the `lessons` skill: before the PR leaves draft (`gh pr ready`, or `gh pr create` without `--draft`). It writes what the work cost to the process layer's inbox and commits nothing: the curator places every lesson (the dotfiles' `docs/process.md`). The gate holds a PR in draft until its lessons file says where every cost went, beside Review's checks.

**A PR merges on the user's word**, which they often give ahead ("merge when green", 2026-10-31), or, for a process batch, on their verdicts (the dotfiles' `docs/process.md`, Landing); the dotfiles' own rule is stricter (their CLAUDE.md).
