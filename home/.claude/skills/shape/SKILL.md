---
name: shape
description: Survey the patterns a code change touches before its first edit, get a fresh shape review before its PR, and write the PR's Shape section. Use when starting any change in a git repo, or when a hook asks for a survey or a review.
---

<!-- The shape rules: edited in github.com/CristianCrane/.dotfiles (home/.claude); repos carry copies made by hooks/sync.mjs. -->

# Shape

Each change leaves the codebase with less entropy, never more. Left alone, an agent judges this after its approach is already chosen, grades its own work, and extends whatever pattern is there because extending is the easy path. So the survey comes before the plan and holds facts, a fresh reviewer argues against the change, and extending is the choice that needs a reason.

A **pattern** is any shape the change follows or adds: a helper, a table, a layer, a test harness, a hook, a doc convention, a copy of code across packages.

## Rules

- **Ratchet.** A change may leave the code no simpler, but it never adds a third copy of a pattern, never bends a pattern that fights the change, and never edits one idea in many places (shotgun surgery: fold the idea into one place first).
- **The simplest shape is the plan.** When the survey finds a simpler shape than extending, build that. Extending instead takes a written reason, which goes in Shape.
- **One kind of work per commit**: a refactor, a change, or a cleanup. A PR carries them in that order: refactor commits, then the change, then cleanups.
- **Refactor first.** A refactor that changes no behaviour goes in the PR's first commits, and the change is built on top of it.
- **Fix what you see.** A problem outside the change, seen while building or by the reviewer, goes on the survey's `Seen nearby:` list and is fixed in a cleanup commit after the change's. Nothing is filed for later.
- **Big work.** A refactor or cleanup over ~10 files, or one that crosses packages: stop and ask the user one thing, whether it rides in this PR or gets its own. It's done either way.
- **Every change** gets a survey, a plan review and a review. A small change writes a one-line survey.
- The repo's own rules (CLAUDE.md, ADRs) add to these.

## 1. Survey

Before the first edit: the survey gate turns edits down until it exists, and its turn-down names the path. (The survey lives in the git dir, one per branch, or on `main` one per session.)

```
Change: <one line>
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

Count copies by searching the repo for each pattern, not from memory. Done when every pattern the change touches is listed with every copy's path, and the simplest shape has a file count. `Seen nearby:` grows while you build; each item becomes a cleanup commit.

## 2. Plan review

Run the `shape-reviewer` agent in **plan** mode, with the survey's path and the plan review's path (`plan-review-…` beside the survey; the gate names it). It reads the survey before any code exists, when a wrong shape costs a paragraph rather than rework. Revise the survey for each block; answer each note in Shape. One plan review per change; edits go through once it's written.

Post the survey in chat, then go on, unless it has Big work to ask about.

## 3. Build

Keep the survey true: when the plan or the file count changes, update it. A hook compares the branch's size with `Expected files` every 25 files.

## 4. Review

Once the change is committed, before opening the PR (`gh pr create` is turned down until the review is of the last commit and, before round 3, has no open blocks), run the `shape-reviewer` agent: **round 1**, with the branch, the repo root, which commits are refactors (the survey's `Commits:`), the survey's path and the review's path (`review-…` beside the survey).

A round is the reviewer and you arguing about shape. The reviewer reads shape, not behaviour, so tests never hold it up: start each round as its commit lands, and run the repo's quick tests beside it (its CLAUDE.md or AGENTS.md names them, and its full suite).

- **Blocks** start the next round: fix them, with any failure the round's quick tests found, commit, and run the reviewer again, **round 2** then **round 3**. A follow-up round checks only the fixes, against the previous review in the same file.
- **A recheck** reviews a commit that answers no block: a fix to a failing test, typecheck, lint or CI. It checks only that commit, keeps the round's number and costs no round; a block it finds starts the next round. Rechecks have no cap.
- **Notes** never start a round. Answer each in Shape, from every round (later rounds carry them forward): rebutted, or filed as a follow-up issue. Fixing one here costs another round.
- **The full suite** runs once, after a round or recheck finds no blocks, before the PR. A fix it needs gets a recheck, and only what failed runs again, with the quick tests.
- **Done** when a round or recheck of the last commit finds no blocks, and the full suite has passed.
- **After round 3**, any block still open goes to the user: stop and put each one to them with its paths. A round 4 runs only when they say so.

## 5. Shape section

Every PR body ends with:

```
## Shape
- Extended | Retired | New: <pattern> — <paths>
- Simpler shape considered: <a real shape>; <why not, or "done in <sha>">
- Review: <finding> → fixed | rebutted: <why>
- Seen nearby: <problem> → fixed in <sha>
- Harder to change: <what, or nothing>
```

One line per pattern, per review finding and per `Seen nearby:` item. When the PR has refactor commits, Shape names what they retired and says how behaviour was shown unchanged.
