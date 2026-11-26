# Process decisions

Status: accepted, 2026-11-19. Step 1 built (CristianCrane/.dotfiles, process-layer).

## Context

The user corrects Claude many times a week, and agrees with it on things that matter, and too much of it was getting lost: "I'm spending the time to correct and hope that our system evolves over time but I do feel that a lot of these things are getting lost." Lessons were placed by the session that made the mistake, with only the files it had loaded in view, so they landed in the wrong place. On 2026-11-19 the context audit put the vendor-guide and mergeable rules into empire-cleaning's CLAUDE.md, and the user moved them out the same day.

The user wants a layer that keeps using their feedback and the conclusions both sides reach, so each lesson lands in the right form (a rule line, global or a repo's; a skill; an agent type; a hook; a removal) and place, judged by a curator that learns the user's reasons over time. They grilled the design on 2026-11-19; the decisions follow as they made them. [process.md](process.md) is the policy and design built from them.

## Decisions

### Round 1
- **D1 Scope:** everything an agent reads or obeys that we own: global CLAUDE.md, repo CLAUDE.md, the repo docs it says to read first (in a repo with no docs map: D32), memory, our skills, agent types, hooks, settings, start-of-session messages. Third-party plugin skills count only as on or off. The layer also decides the *form* a lesson takes: a rule line (and where), a new skill, a new agent type, a hook.
- **D2 Measure:** the main measure is learning: repeated mistakes, and corrections the user has to make that a rule should have caught. Size, tokens per PR and PR grades are guard rails.
- **D3 Signals:** corrections in conversation, and also moments where we both reach an understanding ("this one's important"), plus lessons, review findings and the weekly numbers.
- **D4 Home:** one policy and one log in the dotfiles, for every repo; repos keep only their own specifics.
- **D5 The policy itself:** changes always go to the user, never graduate to automatic.
- **D6 One weekly process review:** cost, PR quality and guidance, one log, one reminder.

### Round 2
- **D7 Capture:** both. A background pass reads each conversation and pulls out candidate signals (the safety net that doesn't depend on anyone noticing), plus in-the-moment capture when either side flags one, with its context.
- **D8 Capture is separate from deciding:** capture writes raw signals (quote, what was proposed, what the user said, session, date) to one inbox; it decides nothing. Deciding happens in a batch, with the inbox, the policy and every rules file in view, so repeats show.
- **D9 A curator agent type does the deciding:** a fresh view (not the session that made the mistake), reads everything, writes only its proposals and the log, high effort; the policy doc is its brief. It never edits rules itself: approved changes are applied by a normal agent through the change skill.
- **D10 Speed:** a lesson the user explicitly agrees to make a rule is applied right then (through the curator's placement check, logged); the rest wait for the weekly review.
- **D11 Form, least machinery first:** a rule line by default (global or repo by what it's about); a hook when the same rule is broken twice despite its line; a new skill when 3+ related rules or steps cluster on one kind of task; a new agent type only for a fresh view, limited tools, or its own model or effort; removed when stale or never needed. Thresholds tuned by the user's verdicts in the log.
- **D12 Memory:** only temporary project state and facts about the user. Every lasting rule lives in a versioned file.

### Round 3
- **D13 Inbox local, log committed:** raw signals (quotes, which can name clients) stay in `~/.claude/process/inbox.jsonl`, never committed; the dotfiles log holds the decisions: what changed, why, the user's verdict.
- **D14 Background pass timing:** when a main session ends or compacts, over what's new; at each session start, a catch-up for conversations that never ended cleanly. Main sessions only.
- **D15 What it looks for:** disagreement or redirection, "yes exactly" / "that's important", a decision made, a claim retracted, the user explaining something twice, frustration. Cheap fast model, wide net: the curator drops noise, a missed signal is lost.
- **D16 In-the-moment capture:** a small command run when either side flags something or when Claude is corrected; the instruction lives in the main-session start message.
- **D17 Fast path:** the curator picks where a user-agreed rule goes and shows it in one line ("→ global CLAUDE.md, Evidence") for the user's OK before it's applied.
- **D18 Weekly batch:** a short numbered list in the session (what was seen, proposal, recommendation), answered in one line; the curator logs each verdict against its proposal.
- **D20 The lessons skill keeps only noticing:** at the end of a PR the agent writes what the work cost to the inbox as raw signals, and places nothing; the curator owns placement for every signal. The PR gate stays, so every PR still reports. (It is agents' only channel into the inbox: the background pass reads main sessions only.)

### Q19: how the curator earns autonomy
The user wants their judgement to become the curator's over time, without being the bottleneck, and without one wrong call cascading. What a rule says and where it lives matter equally.
- **D19a The curator learns reasons, not just a score:** each override's reason becomes a written curation principle in the policy (user-approved, D5), read by the curator on every call. First one: scope comes from what a rule is about, not where it has been used.
- **D19b Reach limits autonomy:** never automatic for the global CLAUDE.md, the policy and its principles, and hooks that gate every session; autonomy can be earned only for repo files, one skill, memory.
- **D19c Safety for automatic changes:** a second opinion first (the change reviewer checks it against the principles; a disagreement goes to the user), one revertible commit per change with its reason, and a "done without asking" section in the weekly list; a veto undoes it and counts as an override.
- **D19d The bar:** per kind of call and per reach, 8 matching verdicts in a row over at least 4 weeks; one override sends the kind back to asking and restarts its count. Rare kinds just stay "ask".

### Round 4
- **D21 Start with history:** the first batch comes from the last 30 days of main-session conversations; it tests the pass on real data and gives the curator its first verdicts.
- **D22 Budgets:** global CLAUDE.md 1,200 tokens, each repo CLAUDE.md 1,000, memory index 400, start-of-session message 600. Over budget is a weekly item (trim, move, or raise); raising one is a policy change.
- **D23 Seeing it learn:** each signal tagged with the rule that should have caught it, or "no rule"; the main number is repeats per week, which should fall. Health: captured, decided, backlog, oldest signal's age; zero captured shows as a failure, never as quiet. After 8 weeks, if repeats aren't falling, revisit the design.
- **D24 Local only:** the layer runs on this machine alone. Cloud sessions, and the repo copies of the change rules they'd need, come back only if the user starts using cloud sessions (2026-11-20).
- **D25 Cost cap:** the whole layer under 3% of the plan's week, measured weekly; over it, it trims itself and says so.

### Round 5
- **D26 Build order:** (1) foundation: policy doc with its first principle, inbox, in-the-moment capture command, curator agent type, lessons skill cut down; first curator run is the 30-day history. (2) automatic capture: background pass, size measure. (3) weekly review: batch list, verdict log, learning and health numbers, cost cap, graduation tracking.
- **D27 Landing:** one PR per repo per batch, one commit per change naming its log entry; the user's verdict is the approval, so the agent merges once the change reviewer is clean and CI is green. Earned automatic changes land the same way and show under "done without asking". (The dotfiles ruleset needs a PR but no approving review.)
- **D28 Off switch:** `process.enabled` in a dotfiles file stops the pass and the curator, keeping the inbox; any kind of call can be frozen to "ask" with one log line.
- **D29 Existing lines:** the first curator run checks every existing line against the policy (reason, one copy, end condition, right place); a line with no reason found gets "keep, cite a reason" or "remove".
- **D30 One gate for every route:** the change reviewer checks any diff touching guidance against the policy and principles, whoever wrote it; dictated settings changes stay exempt.
- **D31 Written down:** `docs/process.md` in the dotfiles (policy, principles, design), with an ADR-style decision record beside it.
- **D32 Repo docs go to the doc curator** (2026-11-26, .dotfiles#61 Q1, Q11): in a repo with a docs map (`docs/map.md`), its `docs/`, READMEs, `GLOSSARY.md` and ADRs are the `doc-curator`'s, which alone writes them, from notes. This layer keeps the CLAUDE.md files, skills, agents, memory and `process.md`, and forwards a lesson that teaches one of that repo's rules to its doc inbox. The dotfiles' own docs stay here. Supersedes D1's "repo docs it says to read first" for such a repo.

## Calls made while building step 1

Where the decisions were silent, step 1 took the simplest option. Each is the user's to change.

- **The off switch** is `docs/process.json` (`{ "enabled": true }`), beside this file: Claude Code's `settings.json` isn't ours to add keys to, and home.nix links only what `~/.claude` needs.
- **Capture keeps writing while the layer is off:** D28 names the pass and the curator; the inbox keeps what comes in, so nothing is lost meanwhile.
- **The log** is `docs/process-log.md`; [token-review.md](token-review.md)'s log joins it when step 3 makes one weekly review (D6).
- **A batch's branch** is `process-batch-<date>-<slug>`, and the agent merges it with a bare `gh pr merge` from its checkout. review-gate lets that through once the branch's review reads HEAD and owes no recheck, and every commit after the first names a log entry the branch adds with the user's `yes` or `edit`: the user's verdict, not the branch's name, is the key. A fast-path change is a batch of one.
- **CI for the dotfiles** (D27's "CI is green"): `.github/workflows/hooks.yml` runs the hook tests on each PR. Making it a required check in the ruleset is the user's step.
- **The curator writes the log's entries into its output** (under `~/.claude/process/curator/`, where reviewer-gate holds it), and the agent applying the batch commits them as the batch's first commit: the log is committed in the dotfiles, where every change rides a PR.
- **Each signal has an `id`** (8 hex), which proposals and log entries cite.
- **The lessons file is capture's output:** `capture.mjs --source lessons` adds each cost's line to it, so the PR gate reads one record, not a hand copy of the inbox.

## Consequences

- Placement moves from the session that learned something to the curator: lessons stop landing by the nearest file, and repeats become visible.
- The user's time goes to one short list a week, and to the reasons they give when they override, which become principles.
- Every route that changes guidance (the curator's batches, the user's own asks, any agent's PR) passes one check: the change reviewer against [process.md](process.md) (D30).
- Until step 2's background pass, new signals come only from the in-the-moment command and the lessons step (the history run's came from a one-off pass: [process.md](process.md), Build order); a week with none captured is a failure to look into.
