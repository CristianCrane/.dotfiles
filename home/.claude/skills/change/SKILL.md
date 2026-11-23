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
- **Fix what you see, on a screen as in the code.** A problem outside the change, seen while building or by a reviewer, goes on the survey's `Seen nearby:` list and is fixed in a cleanup commit after the change's. A screen the change touches counts: it's left truer than it was found, so what's untrue, stale or said twice there is fixed in this PR, whether or not the brief names it, a design pick or a rework included. Nothing is filed for later: outside what the change touches, one too big for this PR goes by Big work (below), or to the open issue or PR that already plans it, named with its why in the report and the PR's Change. On empire-cleaning #509 the build agent fixed a Site Visit's badge its brief named and left the line beside it, untrue once the visit had been, as "I left it alone", with no reason; three review rounds passed it (2026-11-22).
- **Keep open issues true.** An open issue's body is the plan the next agent builds from. A change that makes one wrong (a file it names, where something lives, a placeholder issue number) edits that body in the same PR, and merging the default branch into a branch rechecks the bodies of the issues it plans: empire-cleaning #337 moved the shared messages while #302 still planned them a second home (#308, review F11).
- **Big work.** A refactor or cleanup over ~10 files, or one that crosses packages: stop and ask the user one thing, whether it rides in this PR or gets its own. It's done either way. A refactor's own PR merges first, and the change's branch then starts from the default branch; a cleanup's own PR follows the change's.
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

**Stakes** says whether the code the change touches moves money (a charge, a refund, a price, a bill), knows who someone is (sign-in, a session, a reset), or decides who may reach what (permissions, secrets, input from outside). A mistake there hurts a real person before anyone sees it, so a change at stakes gets the `critical-reviewer` on its plan and its diff: "our best eyes on the critical stuff we cant afford to mess up … hopefully invoked only when critical stuff is being touched" (the user, 2026-11-23), after a client could be charged twice for one Bill in merged code, found as an aside (empire-cleaning#533), which set off an audit of every money path (#534). Judge it by what the code touches, not the change's size. At stakes, `Design:` is the approach step by step, what the critical reviewer reads as the plan.

## 2. Plan review

Run the `change-reviewer` agent in **plan** mode, with the survey's path and the plan review's path (`plan-review-…` beside the survey; the gate names it). It reads the survey before any code exists, when a wrong shape or an unshown cause costs a paragraph rather than rework. Revise the survey for each finding, or give round 1 your reason against it (round 1 carries the plan review's findings forward). One plan review per change; edits go through once it's written.

**At stakes**, run the `critical-reviewer` agent beside it in **plan** mode, with the branch, the repo root, the commit the plan starts from, the survey's path, its output's path (`critical-review-…` beside the survey), ports it may use (a share of yours), and a line on who the product serves and what's at stake for them. Give it nothing else: no list of what to look for, as the user put it, "i dont want to pigeonhole their expertise under a single lens" (2026-11-23), and no model or effort, which would override the ones a blind trial picked for it. Its findings (`C<n>`) are fixed on the survey as the plan review's are, with a later pass, and Build waits for both.

Post the survey in chat, then go on, unless it has Big work to ask about, or departs from what the user picked (a prototype, an option they chose): put each departure to them then, not at the PR (empire-cleaning #435: three waited from the plan review to the PR, and held it there).

## 3. Design review

A change a person sees is reviewed as a design before its code, sized as the `ui` skill's Settling a screen says (a new flow or look, a change to how a flow behaves, a wording change), once the plan review is in and before the screen's code is written. Run the `ux-reviewer` on the design as on after-shots, its output `ux-review-design-…` beside the survey (a prototype's lives on its own branch), so the after-shots' review in Review starts a file of its own. Fix its findings on the design, with a later pass, as Review's "The reviewer has the last word" says; a new flow or look then goes to the user with its versions, and Build starts from their pick. A change no person sees skips this step.

## 4. Build

A change that writes or edits a test, or changes how tests run, loads the `testing` skill first; one that changes a screen, or words a person reads, the `ui` skill.

Keep the survey true where it steers the work: its Cause (`shown by` what, once a `to show:` is shown), its patterns and their copies, and Expected files when the plan grows (a hook compares the branch's size with it every 25 files). Its `Commits:` list is the first plan and stays as written: from round 1 the branch's own `git log` is the record, and the PR's Change is written from that and the reviews, so a commit list or file count behind the branch is no finding. On empire-cleaning PR 14 (2026-11-23) ten of 41 findings were the survey and docs gone stale after later commits, each a fix and a recheck.

**Edit through Edit, read first.** A script that rewrites text (a string replace, a cut between two markers) hits what matches, not what you meant: in the week to 2026-11-23 about 25 redos came from replaces that caught a longer name (`t.w.cancel` in `cancelledFree`), text Prettier had reflowed, a `` $` `` in a replacement string, or swapped bounds, and from Edit calls refused after a script changed the file under them. A script earns its place for one mechanical change across many files; read its diff before the next step, and Read the file again before an Edit.

**No `git stash` in a worktree.** Every worktree of a repo shares one stash, so a pop can bring another agent's work into yours (empire-cleaning, 2026-11-22), and `git checkout -- .` drops your own uncommitted fixes. Keep work with a commit, or a patch in your scratch folder.

When a change touches what a build ships or the order things load in: that a build leaves something out (test-only code kept out of production) is a claim too. Build it as the host does and count a marker, a string only that code holds, in both builds' output, while building: tree-shaking guessed at was wrong three times in one day. When load order changes, check the first paint too, throttled. The repo's own docs say how its host builds.

## 5. Review

Once the change is committed, before opening the PR (`gh pr create` is turned down until the review is of the last commit, or of one before it with only comment lines changed since, and has no open change findings), run the `change-reviewer` agent: **round 1**, with the branch, the repo root, which commits are refactors (the branch's `git log`, their subjects led by `Refactor:`), the survey's and plan review's paths, and the review's path (`review-…` beside the survey).

**A change a person sees** gets a UX review beside round 1. Take its after-shots at a phone's width and a laptop's, as the repo's CLAUDE.md says (empire-cleaning: `pnpm pr:shots` with `--desktop`, whose copies stay in the git dir's `pr-shots/`), and run the `ux-reviewer` agent with the after-shots' paths, each shot's screen, case, reader and moment, the commit they show, and its output's path (`ux-review-…` beside the survey). Give it nothing of the change (the diff, the brief, the survey, a fix list, the before-shots): a review that reads a change against its brief sees what the brief names, and on empire-cleaning #509 three rounds and 18 findings passed an untrue line on a screen the change touched, which a cold read of its after-shot caught (2026-11-22). Each finding (`U<n>`) is fixed, with new shots and a later pass on them, as "The reviewer has the last word" says, and passes go on while each finds something real (When rounds stop); the PR's Change closes each by id.

**A change at stakes** (the survey's Stakes, or as round 1 finds it) gets the `critical-reviewer` once more, in **diff** mode, once a round leaves no change finding open and before the draft PR: briefed as in Plan review, on the last commit, with the same output path. It's there mostly to confirm, as what it finds now got past the plan: a late catch (the `lessons` skill). Each finding is fixed, with a later pass on the fix, and the change-reviewer's next round or recheck covers the fix like any other.

A round is the reviewer and you arguing about shape, and about a bug's evidence. The change-reviewer reads the diff and the survey and runs nothing that writes (a gate holds it to reading), so tests never hold it up: start each round as its commit lands, and run the repo's quick tests beside it (its CLAUDE.md or AGENTS.md names them, and its full suite).

- **Every finding is a fix**, made now and never filed for later. Each has an id (`F<n>`) and a severity:
  - **`[change]`**: a shape decision, or a bug's unshown cause (the reviewer's impact list). Fix it, with any failure the round's quick tests found, commit, and run the reviewer again: **round 2**, **round 3**, and on. A follow-up round checks only the fixes, against the previous review in the same file. Only these fixes count rounds.
  - **`[text]`**: a comment or doc that's false, stale or missing. A fix that changes only comment lines in code needs no review: the PR gate lets it through. A fix to Markdown gets a recheck.
- **A recheck** reviews the commits since the last review when none of them fixes a change finding: a text fix in Markdown, a cleanup from `Seen nearby:`, a fix to a failing test, typecheck, lint or CI. One recheck per round: make the round's text fixes and cleanups, a commit each, then run it once on the last of them. On 2026-11-22 rechecks ran one per commit, often 2 to 4 within minutes, and 40 of them cost 7.6% of a 5-hour window for 5 change findings (the usage audit). It checks only those commits, keeps the round's number and costs no round; a change finding it raises starts the next round.
- **The reviewer has the last word.** A finding exists to make the work better for whoever meets it, a person on a screen or the next builder in the code, so it's fixed: "That is their job. They review. If there is a finding, it needs to be fixed" (the user, 2026-11-23). Turning one down is rare, and makes sense when fixing it isn't this change's to do: the owner's business call (it goes on the owner's list, which the repo's CLAUDE.md names), the app's frame or shared header (the user's, as the `ui` skill says), or a screen the change doesn't touch (to the open issue or PR that plans it). Ask who the finding's reader is before reaching for one: a state that's rare, a call on one screen, a part other screens share or a recorded pick still costs that reader, and a recorded pick a finding shows wrong is changed, with its record. Give a turn-down, or your case that a finding is wrong, in the prompt of the reviewer's next pass (a recheck of the same commit, when nothing else changed). The reviewer weighs it, with evidence: its `turned down: <reason>` or `conceded: <why>` closes the finding, and one it holds is fixed. A critical finding comes with its proof, so your check before acting on it is to rerun that proof on the code; one whose proof doesn't hold there goes back as your case, the same way. Only a loop goes to the user (When rounds stop), and their ruling, in the next pass's prompt, closes it. On empire-cleaning #527, #536 and #538 builders answered UX findings away ("a rare state … a screen call", "a recorded pick") and parked them on an issue, and on #538 the user caught the same thing after a green build (2026-11-22, 23).
- **The full suite** runs once, after a round or recheck leaves no change finding open, before the PR; where it's CI's (the repo's CLAUDE.md says so), on the PR: open it as a draft (`gh pr create --draft`) once the review leaves no change finding open and the quick tests pass, and mark it ready once every check is green and the Lessons step is done (empire-cleaning ADR-0026). Push each fix it needs as it's made (nothing gates a push to a draft), and only what failed runs again, with the quick tests; once every check is green, one recheck covers every fix since the last review, before `gh pr ready`.
- **Done** when the last review leaves no change finding open, every text finding is closed, and the full suite has passed, and, for a change a person sees, the last UX pass leaves no finding open.
- **When rounds stop.** Rounds, and UX passes, go on while each finds something real: a defect a user, a reader or the next builder would hit. They stop when a round finds nothing real, only preferences that change nothing true. A loop is what reaches the user: a fix undone by the next round, the same point back in new words, or two findings that can't both be met. Put that to them, with its paths. A long run isn't a reason to stop, but the report says how many rounds it took and what the last ones found, so its cost is seen (empire-cleaning #524, 2026-11-22: a stop at round 5 on a real one-line finding).

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
- Review: F<n> <finding> → fixed in <sha> | the review's own word on it: fixed in the survey | fixed elsewhere: <where> | conceded: <why> | turned down: <reason> | ruled by the user: <ruling>
- UX review: U<n> <finding> → fixed in <sha> | the UX review's own word on it: conceded: <why> | turned down: <reason> | ruled by the user: <ruling>
- Critical review: C<n> <finding> → fixed in <sha> | the critical review's own word on it: fixed in the survey | conceded: <why> | turned down: <reason> | ruled by the user: <ruling>
- Seen nearby: <problem> → fixed in <sha>
- Harder to change: <what, or nothing>

</details>

<the attribution footer>
```

- **Problem** and **Fix**: one sentence each, in the repo's own words.
- **Check these**: 3 to 5 links to the lines that matter most, each a permalink at HEAD's full sha as the body is written, with a few words on why.
- **Before / after**: only for a change a person sees, and then always: screenshots of each screen it changes, before and after side by side, made as the repo's CLAUDE.md says.
- **Tests**: only for a change to the server or other code a person doesn't see: permalinks to the most relevant tests, at HEAD's full sha too, saying which one was red on the old code.
- **Change**, collapsed: the blank line after `</summary>` lets GitHub draw the heading. One line per pattern, per review finding and per `Seen nearby:` item. When the PR has refactor commits, Change names what they retired and says how behaviour was shown unchanged.

No other headings or labels (a line led by bold is a label): no summary of runs, no list of commits. The gate turns the PR down until the body has Problem and Fix with their sentences, Check these with 3 to 5 permalinks, every permalink at a commit on the branch, and Change in its closed `<details>`, with no other heading or label, and until Change closes every finding of the last review by id, as fixed or in the review's own word on it (`answered:` closes nothing). A body with Before / after also waits for a UX review whose last pass, of a commit on the branch, leaves no finding open, its findings closed the same way, and `gh pr ready` waits for it again.

## 7. Lessons

Once the full suite has passed, run the `lessons` skill: before the PR leaves draft (`gh pr ready`, or `gh pr create` without `--draft`). It writes what the work cost to the process layer's inbox and commits nothing: the curator places every lesson (the dotfiles' `docs/process.md`). The gate holds a PR in draft until its lessons file says where every cost went and the review is of the last commit.

**A PR merges on the user's word**, which they often give ahead ("merge when green", 2026-10-31), or, for a process batch, on their verdicts (the dotfiles' `docs/process.md`, Landing); the dotfiles' own rule is stricter (their CLAUDE.md).
