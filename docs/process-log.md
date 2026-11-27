# Process log

The process layer's decisions ([process.md](process.md)): each proposal the curator made, the user's verdict on it, and what landed. The inbox (`~/.claude/process/inbox.jsonl`, local) holds the raw signals; this log holds no quotes that could name a client. Entries are newest first. How a batch's PR carries its entries: [process.md](process.md), Landing.

## Format

An entry, under its run's heading (`### <date>: weekly | fast path | history | audit`):

```
- L<n> <verdict> · <kind of call> · <reach> · recommended <yes|no>
  <the proposal, in a line> · signals <the inbox `id`s it decided> · caught by <the rule that should have, or "no rule"> · repeat of <L<m>, or "—">
  <the user's words, when they said more than yes or no>
```

- **verdict:** yes, no, or edit (the user's own words follow).
- **kind of call:** the form and the place, written as process.md's Form and Place name them: `rule line → global CLAUDE.md`, `hook → dotfiles`, `remove → repo CLAUDE.md`, `place → memory`.
- **reach:** `global` (the global CLAUDE.md, this policy, a hook that gates every session: never automatic), or `repo`, `skill`, `memory` (D19b).
- **matched:** the verdict equals the recommendation. Graduation counts matching verdicts in a row per kind of call and reach (D19d).

A freeze, at the top of Counts: `- <date> freeze <kind of call> · <reach>: <why>` (D28).

## Counts

Kept from step 3 on: per kind of call and reach, the matching verdicts in a row, since when, and whether it asks or is automatic.

| Kind of call | Reach | In a row | Since | Mode |
|---|---|---|---|---|

## Entries

### 2026-11-27: fast path, analogies

The user's verdict, 2026-11-27 (inbox 530bcd3f): "im noticng a lot of forced/awkward analogies. lets tone that down and make sure theyre only used when trying to convey something very complex that normal explanations are failing to get across", then, to the main session's rewrite of the line and its place (the global CLAUDE.md, Working with me), "Yeah go ahead. It's kind of annoying." The same correction came first on 2026-11-25 (inbox 60fd1f36) and went undecided for two days. L188 is its one item, reach global. It puts the global CLAUDE.md a little further over its budget, ~1,263 to ~1,276 of 1,200 tokens (5,053 to ~5,102 characters ÷ 4, an estimate), by the user's approved words: a weekly item (D22), whose trim goes elsewhere in the file.

- L188 yes · rule line → global CLAUDE.md · global · recommended yes
  Working with me's "Writing for me" drops "an analogy where one fits" and the Feynman example, and says instead: "An analogy only when something is very complex and a plain explanation hasn't got it across (… 2026-11-27: forced analogies)." Memory's copy goes in the same batch: current-work.md's "plain, relaxed, Feynman-style writing" sentence (a memory edit, outside this repo) · signals 530bcd3f, 60fd1f36 (its analogies half; its "way too verbose again" half, a repeat of L162, waits for the weekly review) · caught by no rule · repeat of —
  It narrows L162, whose "an analogy where one fits … as Feynman" agents read as a nudge to add one every time; builder briefs carried that line word for word, and no other guidance restates it (dotfiles plan review F1, F2, F3)

### 2026-11-23: fast path, care

The user's verdict, 2026-11-23 (inbox ecb29ead): "i dont care about the cost. this is paramount to everyones purpose here.", to the main session's wording (the signal b5694f7a's `note`), which it put to them with its place ("Can I add this to the Aim section of the global CLAUDE.md?") and its cost (the file already ~1,209 of 1,200 tokens). The main session wrote the words from the user's own, the same evening: "i actively seek to eliminate noise. i just want truth. i want to be surrounded by people who care, quality, genuine concern for what were doing" (21:05:39Z, not in the inbox), its reply naming the setting where caring is the easy path, which the user called "a beautiful summary … it really resonates with me", and then (b5694f7a) "my only real desire is for every agent to appreciate this sentiment." No curator proposal came before it. L187 is its one item, reach global, and the user said yes to it. Puts the global CLAUDE.md further over its budget, ~1,263 of 1,200 tokens (5,053 characters ÷ 4, an estimate), by the user's call: a weekly item (D22), where the next weekly review trims elsewhere in the file and leaves this paragraph as it is, as the main session told the user (21:11:49Z).

- L187 yes · rule line → global CLAUDE.md · global · recommended yes
  Aim gains a third paragraph, after "We build for the person…": "We work as people who care: truth over noise; "I don't know" said freely, as it starts the test; a mistake recorded as a lesson, held against no one; and results, not rank or volume, settling a question (2026-11-23)." · signals b5694f7a, ecb29ead · caught by no rule · repeat of —
  Its own paragraph, not folded into the second's "empathy, quality and care": the main session offered that fold as the weekly trim, then told the user this paragraph would be left alone, and the user answered "ty". In the Aim, which every agent and the main session read first, so no agent file restates it. Global, as it's about how anyone works with the user, in any project (principle 1). It names the spirit Evidence and this layer's lessons run on, not their mechanics, so it copies neither (dotfiles plan review F1 for the record of who wrote the words, F2 for the budget's numbers).

### 2026-11-23: fast path, critical reviewer

The user's verdict, 2026-11-23 (inbox a98166c8): "i think thats a great idea. basically i want our best eyes on the critical stuff we cant afford to mess up. hopefully invoked only when critical stuff is being touched. i would also caution explicitly telling our agent what to look for. i dont want to pigeonhole their expertise under a single lens. i want a true review from the approach to the implementation", to the main session's proposal (the signal's `proposed`): a reviewer for money, sign-in and security, run only when a change touches them, with no checklist, tried first in a blind trial. The trial, on the plan for empire-cleaning's money batch 3, picked Opus at high effort over Fable at high (inbox 89c8e15e): "B should be tablestakes, thats a given we should always prove what were claiming. however, A gave additional insight on top of that - it uncovered something B didnt even consider. to me that wins"; Opus cost ~4.0% of a 5-hour window, Fable ~7.4% (its note). Then (inbox 838c27b4): "all this 'rework' 'audits' etc. this should not be part of our normal process. this is a sign our process is broken". No curator proposal came before it. The rest, a plan pass and a diff pass, the builder checking each finding before acting, each late catch traced to the step that let it in, and the weekly review counting rework and late catches per change, with the places named here, is the main session's brief for this batch, which gives them as the user's calls; the inbox holds the user's words for the reviewer, its model and its proof (a98166c8, 89c8e15e) and for the aim behind the rest (838c27b4), not for each of these, so the PR shows each place for their OK, and the user merges it as that OK: no agent runs its bare merge, though these yes verdicts would let one through (dotfiles review F13). L182 is the agent; L183 its runs in the change skill; L184 the change-reviewer's check of the Stakes call; L185 late catches; L186 the weekly counts. None is reach global: the global CLAUDE.md is at its budget (~1,209 of 1,200 tokens, characters ÷ 4) and none of this is about every session.

- L182 yes · agent type → dotfiles · skill · recommended yes
  A `critical-reviewer` agent type (`home/.claude/agents/critical-reviewer.md`), model opus, effort high: the reviewer for a change at stakes (money, sign-in, security), asking the pitch's two questions, is this approach even good, and if it is, what's wrong in how it's planned or built, with no list of what to look for. Each finding is shown (a red test, a reproduction, a trace) or called a suspicion with how sure; a claim about a third-party service is checked as the global CLAUDE.md's Evidence says (dotfiles review F9). It runs tests in a detached worktree of its own, as the test-sweep skill proves a suspect, never in the author's checkout (empire-cleaning#374), on the ports its prompt gives it, and reads cold: not the change's other reviews, GitHub or the inbox. Its findings are `C<n>`, in `critical-review-<key>.md` beside the survey; its diff pass says of each new one whether the plan held it or the build brought it in, and with no plan pass weighs the approach too · signals a98166c8, 89c8e15e · caught by no rule · repeat of —
  An agent type (Form 4): its own model and effort, a fresh view, and tools the change-reviewer is kept from (it runs tests). Its stance is the trial's brief, which won. Its prompt carries no model or effort, as a per-spawn value would override the picked ones.
- L183 yes · rule line → skill · skill · recommended yes
  The change skill runs the critical-reviewer at stakes. The survey gains `Stakes:` (none, or the money, sign-in or security the code touches) and, at stakes, `Design:` (the approach, step by step). Plan review runs it in plan mode beside the change-reviewer, and Build waits for both; Review runs it once more in diff mode once a round leaves no change finding open, before the draft PR, mostly to confirm; when a round finds the Stakes call wrong, the survey gains Stakes and `Design:` and the diff pass runs then, with no plan pass (dotfiles review F12). Stakes' outside input is the input that reaches money, sign-in or whose record (F10), and Done and When rounds stop name the critical passes (F11). Its findings close in its own words like any reviewer's, a `Critical review:` line each in the PR's Change. "The reviewer has the last word" gains that the check before acting on a critical finding is to rerun its proof on the code, and one whose proof doesn't hold goes back as the author's case, closed in the reviewer's words · signals a98166c8, 838c27b4, 89c8e15e · caught by no rule · repeat of —
  The brief's "findings go back to the builder, who checks each against the code before acting" is the proof rerun, not a weighing of the finding, which stays the reviewer's (dotfiles plan review F1). No gate holds the PR for a critical review: there's no case yet of one skipped (Form 2), and L184 is the check.
- L184 yes · rule line → agent type · skill · recommended yes
  change-reviewer.md gains a hunt, Stakes, in plan mode and round 1: the survey's `Stakes:` against what the change touches, so a wrong `none`, or a diff that grew into money, sign-in or security in the build, doesn't skip the critical review; its fix is the critical-reviewer's pass, closed `fixed in the survey` once it's written, and the impact list names it · signals a98166c8 · caught by no rule · repeat of —
  Round 1 as well as the plan, as a plan can be vague where a diff isn't (dotfiles plan review F5).
- L185 yes · rule line → skill · skill · recommended yes
  A late catch, defined once in the lessons skill's costs, growing its "a bug reached review, CI or the user": a problem found after the plan review, by a review of the diff, CI, an audit or the user, its note naming the step that let it in. The change skill's PR body gains a `Rework:` line: the rounds after round 1 (as Review counts them), the rechecks, the UX passes after the first, and each late catch by its id where it has one, with the step that let it in; how merged work counts is said in the lessons skill alone (dotfiles review F7, F8) · signals 838c27b4 · caught by no rule · repeat of —
  The PR body holds the count, as the review files are pruned on merge and a signal holds no branch. main-session.md's "a rework I caught" stays: it's the main session's watch, not a definition (dotfiles plan review F2).
- L186 yes · rule line → token-review.md · repo · recommended yes
  docs/token-review.md: each week counts rework and late catches per change, from the `Rework:` lines of the week's merged PRs, whose fields the change skill alone lists, beside the week before, with the steps that let the late catches in, and apart those caught by a review of the diff from those that got past every review (dotfiles review F7, F8); step 5's rounds read the same line, so there's one count (dotfiles plan review F3). After 8 weeks, if late catches in money, sign-in and security changes aren't falling, the critical reviewer's cost (~4.0% of a 5-hour window a plan pass) is weighed against them, and it's changed or dropped · signals 838c27b4, 89c8e15e · caught by no rule · repeat of —
  The user expects both to fall (the brief). process.md's Measures keeps learning as the main measure; these are the change skill's health (dotfiles plan review F6).

### 2026-11-23: weekly

The user's verdict, 2026-11-23 (inbox 0368e712): "Yes to all.", to the curator's weekly list (`~/.claude/process/curator/weekly-2026-11-23.md`), items 1 to 12, each as recommended. L166–L171 (items 2, 4, 5, 7's date line and 8) fold into .dotfiles#48 before it merges, as they change a line it adds or contradicts one; L172–L181 (items 1, 3, 6, 7's gate, 9, 10, 11 and 12) land as the batch after it. Item 1's two moves (the red-PR line and Opening a URL, out of the global CLAUDE.md into main-session.md) land with item 2 in L166, so both ends of each move are one commit. This run read every lessons and capture signal up to 0368e712 (2026-11-23T16:18:50Z): the next weekly run starts after it. Budgets after it, characters ÷ 4, estimates: the global CLAUDE.md ~1,200 of 1,200, main-session.md ~916 of 1,000.

- L166 yes · rule line → main-session message · global · recommended yes
  main-session.md trimmed, its two bullets from #48 (L160, L163) included: "Updates to me" becomes short and need-to-know "after a compaction too"; "carry the Aim's care into every brief and review you run" goes, as the Aim is global; "While I'm iterating on a look" gets its reason ("as I'm waiting on each tweak") for "(moved from memory 2026-11-08; no earlier event found)"; and it takes two lines from the global CLAUDE.md, both about main sessions only (principle 1): "While an open PR in a repo is red, start nothing new there" (from No red tests' second sentence) and "Opening a URL" (with its /wizard line), which leave the global file in the same commit · signals 098ef34c, 0368e712 · caught by main-session.md, Updates to me (098ef34c: updates that grew long after a compaction) · repeat of —
  Words: the verdicts file's L166. The iterating line's reason is the curator's reading, no event on record (two runs found none); the user's yes takes it · landed in —
- L167 yes · rule line → process.md · global · recommended yes
  process.md, Budgets: the main-session message's budget goes from 600 to 1,000 tokens. It was set on 11-19, when the file was ~515 tokens; every line since is a role the user gave the main session (L2, L160, L161, L163), and it loads into one context only · signals 0368e712 · caught by no rule (Budgets: over budget is a weekly item) · repeat of —
  A policy change (D22) · landed in —
- L168 yes · rule line → agent type · skill · recommended yes
  ux-reviewer.md, Findings, after "no fixes, rules or prototypes": a line that misleads usually wants a truer word, not more of them, as every word added spends the reader's attention (the ui skill's intro); on empire-cleaning #536 passes that asked for more explaining took four rounds over one line, until the user cut the card to "Payment pending" and one short line · signals 79afd5a6, 7f318e4e, 033bdada, 7fd4803e, 0368e712 · caught by no rule for the reviewer (the ui skill's "Few words, each fact once" holds for builders) · repeat of —
  The one PR-quality lesson #48 left open · landed in —
- L169 yes · rule line → agent type · skill · recommended yes
  ux-reviewer.md, Read first, item 2's last sentence: a screen that follows a recorded decision is read by that decision's reason, so it's a finding where the shot shows it costing its reader, naming the record's line, as a recorded pick a finding shows wrong is changed with its record (the change skill, Review); empire-cleaning #512's hover labels, bent on a tablet · signals 3a059b6b, 956d73dd, 8cd4e3bf, a8957c42, 0368e712 · caught by no rule (ux-reviewer.md:12 contradicted #48's change skill, Review) · repeat of —
  "A screen that follows a recorded decision isn't a finding, unless the skill now says otherwise: say which line." goes · landed in —
- L170 yes · rule line → skill · skill · recommended yes
  change skill, Review, "When rounds stop" ends with its event: "(empire-cleaning #524, 2026-11-22: a stop at round 5 on a real one-line finding)" · signals 93696c28, 0368e712 · caught by process.md, Every line (a reason, with the event that showed it) · repeat of —
  The "date line" of .dotfiles#45's question; the cap's removal is L175 · landed in —
- L171 yes · rule line → process.md · global · recommended yes
  process.md, Form, item 1: "**A rule line**, by default." becomes "**A line**, by default: a principle with its reason (principle 3). The log's kind of call `rule line` names it." No sweep of older lines: the change skill's Rules and PR body are rewritten as each line is next touched (L174, L177, L178 begin it), with one curator audit of the change skill alone once empire-cleaning#493's build ends; the ui skill's firm lines when the next UX batch touches them · signals 0368e712 · caught by curation principle 3 (#48's Seen nearby) · repeat of —
  The audit is a later run, not a change here · landed in —
- L172 yes · rule line → global CLAUDE.md · global · recommended yes
  The global CLAUDE.md trimmed to ~1,200 tokens, with L166's two moves: Evidence becomes one principle led by "Say only what you've seen", keeping every case it held (where work stands, a handover or summary is a claim, an issue names its symptom, an option shown working and checked against what's decided, the vendor's guide, a timing's load), with #527's handover claim as its newest event; Change stops restating what the skill does; A long wait, My own repos, No GUI and Merged work shortened; One-off scripts drops its second "no python3 until .dotfiles#5"; the zsh line drops "Drop this line once .dotfiles#5 lands", its second end condition, and gains "`echo ====` fails" · signals 29fd619b, 1aaacd58, fe050133, 682a4108, af9e6f97, ec8f7383, 944f0235, ae1c482d, 7617bc64, ee65338d, 58ca7080, e392d607, c16441b2, 4ee6be0e, c3885548, 08db9a53, aadb8785, 0368e712 · caught by the global CLAUDE.md, Evidence ("never from the conversation, memory or a handover"), which these broke · repeat of L1
  No hook: no gate can tell a relayed claim from a checked one, so the line carries it, shorter so it holds. Words: the verdicts file's L172 · landed in —
- L173 yes · keep → dotfiles · global · recommended yes
  The token batch's comparison, one full window of the two metrics.md asks: L149, L150, L152 and L154 stay; L153's compaction trial (`autoCompactWindow` 185000) is judged on a session started after 2026-11-23T07:04:39Z, as 11 compactions since went at a median of 267k, the same as before; metrics.mjs runs again after the next full build window, from 07:04:39Z; builder-hours per window is the measure to watch, not the window's length · signals 0368e712 · caught by no rule · repeat of —
  The one window, 10:30–15:30 UTC: 5.0 h to 90% at 1.6 builders at once, 10.8–11.0% a builder-hour against the baseline's 11.6%; rechecks 7.5% → 3.6% of the weighted, cache reloads 6.8% → 2.5%, change-reviewers' single-read turns 76% → 51%; change findings per PR 7.2 → 5.2 over 9 smaller PRs, to read against PR size. Lands nothing · landed in —
- L174 yes · rule line → skill · skill · recommended yes
  The survey is the plan, kept true where it steers: the change skill's Build keeps its Cause, patterns and Expected files current, and its `Commits:` list stays as first written, as from round 1 the branch's `git log` is the record the PR's Change is written from; change-reviewer.md's Findings: the survey's commit list or file count behind the branch after round 1 is no finding · signals b9ac54f4, f63f93fd, 8e03401c, aaf997b4, f5737adb, 9f9e1c01, 52873f58, 167dcd74, 995d442e, 96844fb7, cc9e353b, a692cafb, 0368e712 · caught by no rule (the change skill's "Keep the survey true" drove it) · repeat of —
  Ten of empire-cleaning PR 14's 41 findings were the survey and docs gone stale after later commits · landed in —
- L175 yes · hook → dotfiles · global · recommended yes
  .dotfiles#45 as its body plans it: `LAST_ROUND` and its comment go from lib.mjs, `gh pr create` and `gh pr ready` wait for no open change finding in any round, and the turn-down names a loop as the change skill does; `review()` stops returning `open`, and `batchUnapproved` reads "no review of its own" from the file's existence; review-gate.mjs:4-5's and the change skill's "before round 5 (until .dotfiles#45)" go; the test for the old branch goes, and a round-6 header with an open change finding, turned down at `gh pr create --draft`, is the red test · signals 0c5ee286, 5329f024, 1086023b, 0368e712 · caught by no rule · repeat of —
  From round 5 the cap let open change findings through, a hole in #48's "the reviewer has the last word" (L156). Its date line is L170 · landed in —
- L176 yes · rule line → process.md · global · recommended yes
  process.md, Verdicts, the fast path: whoever put the lesson to the user, the curator or the main session, shows its place in one line for their OK, the batch's agent writes its log entries, and the batch's change reviewer is its fresh view (One gate for every route); The curator: "commits the curator's log entries" becomes "commits the run's log entries"; process-log.md, Format: the third line's "· landed in <repo>@<sha>, or "—"" goes, as each commit names its `L<n>` (`git log --grep`), and a kind of call is written as Form and Place name it · signals 43ae98f2, 8280c6f6, 03faac7a, dc613bce, e212d7d4, b842c4c6, 9dc7d735, c4b4e320, d55f934c, 55178180, 96c7beab, 3fccbed3, c61b112a, 0368e712 · caught by no rule · repeat of —
  The last four fast-path batches (L146–L165) ran with no curator. Earlier entries keep their "landed in —" as written · landed in —
- L177 yes · rule line → skill · skill · recommended yes
  change skill, Build: "Edit through Edit, read first": a script that rewrites text hits what matches, not what you meant; a script is for one mechanical change across many files, its diff read before the next step, and a file is Read again before an Edit · signals 19941441, 6ce35fd1, 711a6617, c9fc9dbb, e929a166, 973e38d1, 06e574b0, 23841cc4, 43a6aa6f, 2c5c7d27, 8200ce07, 13027660, 6f2fb7e7, 61f19be6, dc9aab89, 8cd195c8, 317db403, 3334988a, 5e3c88c5, 7222cc7d, 82f41512, 4c5573e4, ce114602, 22387934, 3d7a9c29 · caught by no rule · repeat of —
  The change skill rather than the global file, as it loads before every edit · landed in —
- L178 yes · rule line → skill · skill · recommended yes
  change skill, Build: "No `git stash` in a worktree": every worktree of a repo shares one stash, so a pop can bring another agent's work into yours, and `git checkout -- .` drops your own uncommitted fixes; work is kept with a commit, or a patch in the scratch folder · signals 8bb5d72a, 9242cf1c, 2eb56271, d169586c · caught by no rule · repeat of —
  A firm line, with its harm beside it (principle 3: breaking it costs another agent's work) · landed in —
- L179 yes · snag → dotfiles issue · repo · recommended yes
  A .dotfiles issue, "PR gates: the turn-downs agents hit most", listing the shapes and counts for a fix in the gate: the PR body written in the same command as `gh pr create` (7), `gh pr ready` chained or given a number (6), a reviewer's output path refused (3), and the closing words (8), which #48's one vocabulary should cut, to recount after it · signals 266d3adb, 109bdbe9, 71c06d55, b4d157d3, f730d98e, 861b5ea2, a48dc805, 453d5a40, 6444f2b3, 2782ce92, 624e5773, 8d22a2d5, f232fcc9, 035378e0, da3c38db, 29e78843, 8e689002, 5970b7bf, 7402f722, 65a8ad83, 3f40ff3c, 0331ffaf, 591af9d2, 52b40815, 25e176bd, eed1965d, 0884fc91, 43a58da2, 19945b42, b0c55919, 75fc3737 · caught by no rule (a snag: Form) · repeat of —
  An issue, not a line: the gate is the source · landed in —
- L180 yes · snag → repo issue · repo · recommended yes
  An empire-cleaning issue, "pr:shots: a before for a test new on the branch, and every run's shots kept": a test new on the branch gives no before-shot (it fails on the base), so builders write throwaway specs; and each run replaces the local copies of the last, so a UX pass's after-shots are fetched back from pr-media · signals 852b2192, b67db833, 44a504e4, 908f893d, b3a5ece8, 5a68842e, 13ab0b9b, 58fe6a38, f5d7fa79, aed28493, 61f78c73, 1386acca, 61065881, 5783cdd4, deb1c92b · caught by no rule (a snag: Form) · repeat of —
  landed in —
- L181 yes · snag → repo config · repo · recommended yes
  empire-cleaning `.gitattributes`: `docs/ux-log.md merge=union` and `docs/testing-log.md merge=union`, git's built-in driver that takes lines from both sides (https://git-scm.com/docs/gitattributes#_built_in_merge_drivers), shown first on two of this week's real conflicting row pairs, since the curator couldn't run a merge; a row edited in place beside another branch's new row can come out twice, which the recheck after each merge reads for · signals 85262be0, 0f7b7181, 795128b3, 6e6b962d, 7e326585, b0f17b8d, ce8d23e8, 4a1bdd1b, daba4bef, e0b263f1, d150b885, 488f6d7a, df0e51d7 · caught by no rule (a snag: Form) · repeat of —
  GitHub's own mergeability check doesn't use it: a PR still shows conflicting until main is merged in locally, where the driver resolves the rows. The recheck after each merge named above exists nowhere (inbox b33d523b, a claim retracted after the user's yes): the user kept union knowing a replay of 17 merges came out other than the hand resolution in 4 of 34 file results, put to them as 3 rows doubled and 1 edit lost (b9da4ab4: "No, that's fine."), and agreed to try a lint check for doubled rows instead, packages/lint/src/log-rows.ts in root lint (1c11685e: "Sure willing to try it out."); the PR's review then found union drops no line, so no edit was lost: 2 merges doubled 4 rows, which the check flags, and in the other 2 the hand resolution reworded or dropped a row. It can't see one row under two keys (a reworded Question, one finding logged twice in other words) · landed in —

### 2026-11-23: fast path, builder

The user's verdict, 2026-11-23 (inbox b3092286): "I think yes, we need a builder agent with the mindset built in … The reviewer has the last word. That is their job. They review. If there is a finding, it needs to be fixed that is the entire point. Only in exceptional cases can it be turned down … Yeah, I agree with everything", to the main session's five proposals (the signal's `proposed`): "A: a builder agent type with the mindset built in (owns the experience of every screen it touches; done when the person on it is well served), owning an outcome rather than a change list. B: the reviewer has the last word; a finding is fixed, or turned down only in exceptional named cases (Jen's call, global frame, a screen the PR doesn't touch), judged by the reviewer. C: review the design before code. D: reviewer reads the user's fresh corrections. E: main session triages anything parked before the user sees it." It followed "I do not like this 'i only do my task and don't care any further attitude' … Everyone working on this project should have one goal in mind: how can we provide the best user experience possible" (inbox 6f623e5a) and the loop that set it off (inbox 902a50a6): on empire-cleaning #538 the cold UX reviewer caught a Cancel bill offered and then refused on the press (U2), the builder answered it away as "a rare state … a screen call, sent to #493", and the user caught it after a green build. #527 (U3, U16, U34 to U36: "the shared PlanTotals; sent to #493") and #536 (pass 7's U1, U4, U7: "a recorded pick or there before. Sent to #493") went the same way. No curator proposal came before it: the placements are the main session's brief for this batch, as its plan review moved them. L155 is A; L156 and L157 are B (L157 its gate); L158 C; L159 D; L160 E, with the user's addition the same day, relayed: "We have specific instructions for you too I think, right? The main agent I interface with"; L161 and L162 place two earlier signals the brief named; L163 and L164 are the user's next two (inbox 41fb3358, e481a216). The gate's five-round cap (.dotfiles#45) isn't in the batch: nothing shows the user's yes covered it (dotfiles plan review F9), so it stays theirs. L157 and L160 to L164 are reach global. The yes to A to E covered L160 and L163 by their asks; the places of L157's UX-review check, L161, L162 and L164 were put to the user one line each after round 1 (dotfiles review F14), and they said "Yep, agree with all 4. Proceed." (inbox e45df7f0). The user's next word the same day shaped how every line is written (inbox d1548ec1): "I honestly hate rules. They stifle critical thinking. I want to encourage guiding principles. Rules should be a last resort or for very obvious clear cut things where there's no grey area." So each line here is a principle with its reason, and the gates (L157) are the backstop, where the principle alone failed. Puts main-session.md further over its budget (~900 of 600 tokens) and the global CLAUDE.md (~1,640 of 1,200), characters ÷ 4, estimates: weekly items (D22).

- L155 yes · agent type → dotfiles · skill · recommended yes
  A `builder` agent type (`home/.claude/agents/builder.md`): it owns the experience of every screen and flow its change touches and is done when the person there is well served; its description asks for an outcome in that person's terms and the user's latest calls, not a change list or a scope fence. It holds only what's a builder's own (the stance, ports, ending to report, its report) and points to the `change` skill for the rest. process.md's Form, item 4, gains the reason it needed, with its event: a role's stance that every brief would otherwise restate · signals 6f623e5a, b3092286 · caught by no rule · repeat of —
  The session's build brief for #493 went piece by piece to where each lives (the survey's map): most was held already (the change skill, the global CLAUDE.md, the ui skill, empire-cleaning's docs). Its fence, "Build only your PR", goes; its reason (neighbouring screens built at once) stays as L156's third turn-down. Its escape hatch ("If one needs a design pick or a rework, it goes to #493") goes. Not placed: "don't `;`-chain a push" (no event found) · landed in —
- L156 yes · rule line → skill · skill · recommended yes
  The reviewer has the last word, as a principle: a finding exists to make the work better for whoever meets it, so it's fixed. Turning one down is rare, when fixing it isn't the change's to do (the owner's business call, the app's frame or shared header, a screen the change doesn't touch: examples, weighed once in the change skill, which the reviewers point at, as their copies had drifted, dotfiles review F15), given in the reviewer's next pass, which weighs whether it stands; one it holds is fixed, and only a loop goes to the user. One vocabulary, the reviewer's own words, which the PR body copies: `fixed in <sha>`, `fixed in the survey`, `fixed elsewhere: <where>`, `conceded: <why>`, `turned down: <reason>`, `ruled by the user: <ruling>`; "answered" closes nothing. In the change skill (Fix what you see, Review, PR body), change-reviewer.md (Pushback, template), ux-reviewer.md (Findings, A later pass, template) and the ui skill's prototype line. "Fix what you see" loses its exit for a touched screen ("or to the open issue that already plans it"), which now holds only outside the change · signals 902a50a6, b3092286 · caught by the change skill, Review ("or put to the user, or left with its why"), which allowed it · repeat of —
  A held change finding no longer goes "to the user with both sides": it's fixed. UX passes, like rounds, go on while each finds something real (the user's edit on L151, inbox 769cae15). The Lessons step is named, not numbered, in the skill and review-gate's turn-down, as L158 adds a step (dotfiles plan review F7) · landed in —
- L157 yes · hook → dotfiles · global · recommended yes
  review-gate: a PR body line that closes a finding without a fix on the branch passes only when the review's own line for that finding gives the same word; `answered:` is turned down with the new words. A PR body with **Before / after:** needs a UX review (`ux-review-<key>.md` beside the survey) of a commit on the branch whose last pass leaves no finding open, at `gh pr create` and `gh pr ready`, and create waits until the body closes each `U<n>` as each `F<n>` · signals 902a50a6, b3092286 · caught by no rule (the gate read the change review alone, and took any `answered:`) · repeat of —
  The user's yes was to B, "judged by the reviewer", and to the UX-review check's place (inbox e45df7f0). The gate is the backstop for the reviewer's last word, not a rule of its own: the principle alone, in words, failed three times. It reads the reviewer's word after the last → of its line, as a finding's text can quote one (dotfiles review F13). Three PRs in two days (#527, #536, #538, 2026-11-22 and 23) parked UX findings in Change lines no gate read. Its cost: one file read at create and ready, nothing per session. The pass need not be of HEAD, which would take a pass per commit that changes no screen (dotfiles plan review F6) · landed in —
- L158 yes · rule line → skill · skill · recommended yes
  A design review before code, sized to the change, once in the ui skill's Settling a screen: a new flow gets a prototype with versions for the user to pick from; a change to how a flow behaves, a few still screens of its planned steps, drawn as the repo draws prototypes, read cold before the real code; a wording change, its words in place, as text, read cold the same way. The change skill gains step 3, Design review, before Build, which says when it runs and points there; ux-reviewer.md reads a design as it reads shots, its pass written beside the survey as `ux-review-design-<key>.md` · signals b3092286, 902a50a6 · caught by no rule · repeat of —
  The user: "What exactly do you mean by a quick sketch, though? Like a prototype? I see." A new look for a screen keeps its prototype and pick, as before (empire-cleaning review F3). empire-cleaning's docs/ux.md, Changing a screen, its closing line ("A change that only applies these rules needs no prototype"), follows in that repo's batch PR, naming L158 · landed in —
- L159 yes · rule line → agent type · skill · recommended yes
  ux-reviewer.md, Read first, on its first pass: the user's own signals of the last 14 days (`capture` or `pass`; correction, decision or important) from the inbox, this repo's, the user's words alone, which a SubagentStart hook (`hooks/user-words.mjs`) writes to the agent's scratch folder and names at its start, as a Grep returned Claude's `note` and `proposed` too (dotfiles review F12), as what they've said lately: raw, not rules (the teaching-loop skill, step 4), so a signal is a reason to look and a finding still names what it breaks; cited by `id` alone, nothing quoted, as findings reach a PR and the inbox can name clients (D13). process.md's The inbox names it as a reader beside the curator · signals b3092286 · caught by no rule · repeat of —
  The proposal: "D: reviewer reads the user's fresh corrections"; the user, "I agree with everything". Its cost: about 39 KB of the user's words alone for empire-cleaning's last 14 days, ~10k tokens on each first pass (~31k with Claude's fields, as the Grep read them: dotfiles review F12). `note` and `proposed` are Claude's words and often describe the work under review, which the cold read leaves unread (dotfiles plan review F8). The change-reviewer doesn't read them, though the brief said "if it fits": its job is the code's shape, it runs many rounds a change, and the user's calls on how we build reach it through the curator · landed in —
- L160 yes · rule line → main-session message · global · recommended yes
  main-session.md, "What a builder sends on": the main session owns the experience too, so before anything of a builder's reaches the user it reads the shots and findings against the screen, sends back what should have been fixed, and brings the user only what's theirs, checked. How a builder is briefed lives in builder.md's description (the outcome and the user's latest calls, no fence), which the main session reads when it spawns one, and the team's goal in the Aim (L164), so neither is restated here · signals 902a50a6, 6f623e5a, b3092286 · caught by no rule · repeat of —
  The main session wrote the escape hatch into the brief, briefed with change lists, and relayed parked items as "calls for you" (902a50a6's note) · landed in —
- L161 yes · rule line → main-session message · global · recommended yes
  After-shots go to the user in chat, in reading order, as a gallery, beside the PR's (in L160's bullet) · signals cdd707b2 · caught by no rule · repeat of —
  The user: clicking through a PR's shots "is actually pretty tedious … it's very easy to lose the scroll position" · landed in —
- L162 yes · rule line → global CLAUDE.md · global · recommended yes
  Working with me gains "Writing for me" (a PR body, a report, chat): plain relaxed words, big picture first, an analogy where one fits, then the detail in as few words as it takes, Feynman's heat as atoms "jiggling". "Anything sent as me" stays, its own reason. main-session.md's "plain words" and ux-reviewer.md's "Plain words" go to it; the change skill's PR body step points at it · signals 8e61bd9f · caught by no rule · repeat of —
  Global: it covers every repo's PRs and every agent's report. Its own line, as merged into "Anything sent as me" it would lose one of two reasons (dotfiles plan review F4) · landed in —
- L163 yes · rule line → main-session message · global · recommended yes
  main-session.md, "Keep the process true to its spirit": the main session, which sees every workstream, helps the user streamline the process; it notices work that keeps a rule's letter and misses its reason (a finding answered away, a loop round twice, a rework the user caught, a cost spike, an agent stuck on a gate) and a rule gone arbitrary, raises each before the user has to, with its evidence and a fix (dropping the rule included), and captures it as the next bullet says, so the curator weighs it: the capture and curator flow there is, no new channel · signals 41fb3358, e481a216 · caught by no rule · repeat of —
  The user: "I want a key responsibility for you to be noticing these gaps/friction points in our process … you have the global oversight", then "helping me streamline the process, notice things that aren't following the spirit of what we're trying to achieve, make sure we're all not just blindingly following arbitrary rules" · landed in —
- L164 yes · rule line → global CLAUDE.md · global · recommended yes
  Aim gains the goal and the culture every agent works in: the best experience possible for the person who uses what we make is everyone's one goal, carried with empathy, quality and care, by a rule's reason rather than its letter. In the Aim, which every agent and the main session read first, so builder.md, the reviewers and main-session.md don't restate it · signals 6f623e5a, e481a216 · caught by no rule · repeat of —
  The user: "Everyone working on this project should have one goal in mind: how can we provide the best user experience possible", and "building a shared culture of empathy, quality, and care". Global though said of one project (principle 1): it's about anything a person uses · landed in —
- L165 yes · rule line → process.md · global · recommended yes
  Curation principle 3 becomes: a line is a guiding principle with its reason, written so the reader thinks it through, not a rule to obey; a hard rule is the last resort, for what has no grey area, with its harm beside it. It builds on principle 3's "strong default with its reason" rather than adding a second copy; the rest of it (older lines treated when next touched, no sweep) stays · signals d1548ec1, c310661e · caught by no rule · repeat of —
  The user: "I honestly hate rules. They stifle critical thinking. I want to encourage guiding principles. Rules should be a last resort or for very obvious clear cut things where there's no grey area" (d1548ec1); to the wording put to them, "Yep, agreed." (c310661e). Added after the batch's first commit, so review-gate's batch merge, which reads approvals from that commit, won't take this PR: the user merges it · landed in —

### 2026-11-23: fast path, tokens

The user's verdict, 2026-11-23 (inbox 6d76d22c): "Regarding the token efficiency improvements let apply then all except downgrading the model and retest. Ensure we capture before after metrics so we can compare", to the 2026-11-22 usage audit's recommendations (`~/.claude/process/audit/2026-11-22-usage/report.md`), as the main session put them (the signal's `proposed`, items 1 to 8). No curator proposal came before it: the placements are the audit's and the main session's. L149–L154 are items 2, 3, 4, 5, 7 and 8, in order. Item 1 (2 builders at once, the report's pacing) stays with the main session, whose brief for this batch kept it; item 6 (Sonnet reviewers) is the model downgrade the user left out. L151 lands nothing: its evidence was a misread, and the user's correction (inbox 769cae15) came after. L153 and L154 are reach global (`settings.json`, and the global CLAUDE.md), and the user said yes to both. Before and after: `metrics.md` beside the audit, one command over any range (`node ~/.claude/process/audit/2026-11-22-usage/metrics.mjs --since <ISO> --until <ISO>`), compared after the next two full 5-hour windows of build work; its quality guard is the change findings per review and per PR, which must not drop.

- L149 yes · rule line → skill · skill · recommended yes
  A step's reads go in one turn: the change skill's Rules gain "**A step's reads go in one turn.** …" (the reason and the audit's numbers), and `change-reviewer.md` (Hunt) and `ux-reviewer.md` (Read first) each a line saying the same for their work, as neither loads the change skill · signals 6d76d22c · caught by no rule · repeat of —
  The audit's item 2: 93% of builders' turns and 94% of change-reviewers' made one tool call, and 47% and 76% were a single read, each re-reading the whole context (`out-batching.txt`); about 12% of a window (up to 25%), no quality cost. Three files, one per agent context: the yes names builders and reviewers, the agents the audit measured, and each file is the only one of ours its agent reads for how it works; the global CLAUDE.md, which all of them get, is over budget (~1,442 of 1,200), and the curator, which wasn't measured, isn't covered. main-session.md:5 ("Calls that don't depend on each other go in one turn") stays as the main session's copy (dotfiles plan review F1) · landed in —
- L150 yes · rule line → skill · skill · recommended yes
  One recheck per round: the change skill's recheck covers every commit since the last review that fixes no change finding, run once, after the round's fixes and cleanups; the full suite's fixes are pushed as they're made, and one recheck covers them before `gh pr ready`; `change-reviewer.md`'s recheck reads the commits since the previous review · signals 6d76d22c · caught by no rule · repeat of —
  The audit's item 5: 40 rechecks cost 7.6% of each window and found 5 change findings (`review-yield-windows.txt`), run one per commit, often 2 to 4 within minutes (icon-rail's round 3: 3 rechecks 02:12–02:15 UTC on 11-22). The gate needs no change: it asks for a review of the last commit only at `gh pr create`, `gh pr ready` and a batch's merge (review-gate.mjs, lib.mjs's `review()`), never per commit · landed in —
- L151 edit · rule line → skill · skill · recommended yes
  The audit's item 4, as proposed: no repeat UX review of a commit already reviewed · signals 6d76d22c, 769cae15 · caught by — · repeat of —
  The audit's 6 repeats of a reviewed commit (`out-duplicates.txt`, 1.3M) were later passes on new commits after fixes (706f1590, 67bcf07c, 7f33bf03, 82709348, 40a582f5 twice), each appended under the first pass's header, which `duplicates.mjs` read as their commit: none re-ran a reviewed commit (`metrics.mjs` counts 0). A pass already follows new shots (the change skill, Review; `ux-reviewer.md`, A later pass), so a line would have no event behind it. The user's edit (inbox 769cae15), after their yes: "repeating ux review is important. If there are findings they should continue." So nothing lands: passes go on while each finds something real, and a re-run of the same commit with the same shots didn't happen to skip. The override counts against "rule line → skill" (D19d). The appending, against `ux-reviewer.md`'s "Your pass replaces what's there", went to the inbox (c2b4add0) · landed in —
- L152 yes · hook → dotfiles · repo · recommended yes
  `usage.mjs` weighs a cache read at 0.05, not 0.1, its comment citing the price page ("Cache hits and refreshes on Claude Opus 5.5 and Claude Sonnet 5.5 are priced at 0.05x the base input price", platform.claude.com/docs/en/about-claude/pricing) and the fit (the plan's readings over 77 half-hour bins on 10 days: rms 0.95 at 0.05, 1.18 at 0.1); its tests' numbers follow · signals 6d76d22c · caught by no rule · repeat of —
  The audit's item 8. Every report recomputes from the ledger's raw counts, so `--week`'s two columns both move to 0.05 · landed in —
- L153 yes · setting → settings.json · global · recommended yes
  `settings.json`'s `autoCompactWindow` 300000 → 185000, a trial: the agents and the main session compact near 160k instead of 268k. It ends after the next two full 5-hour windows of build work: `metrics.md`'s after numbers go beside its baseline in docs/token-review.md's next weekly entry, which keeps 185000, moves it or sets it back to 300000; a line under that file's Log names the open comparison (dotfiles plan review F5) · signals 6d76d22c · caught by no rule · repeat of —
  The audit's item 3 (`compact-sim.mjs`: ~10% of a window, an estimate). At 300000 the 58 auto-compactions of 11-17 to 11-22 fired at a median 267.6k (p10 267.0k, p90 270.0k), about 89% of the window or 32k under it; the docs don't say which, so 185000 puts it at 152k–165k. The key is the top-level `autoCompactWindow`, "For every model" (code.claude.com/docs/en/model-config.md#set-the-auto-compact-window); subagents inherit it (code.claude.com/docs/en/sub-agents.md#set-the-auto-compact-window-for-one-subagent). `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` is a percentage of that same window (code.claude.com/docs/en/env-vars.md), so it isn't needed. Replaces the 2026-11-10 trial's 300000 (b7b147f), kept on 2026-11-18 (docs/token-review.md). Live after catch-up, no `rebuild` · landed in —
- L154 yes · rule line → global CLAUDE.md · global · recommended yes
  Working with me, the long-wait line keeps its rule and gains the agents' case: "In an agent, whose cache lasts 5 minutes, a wait past that is checked every ~4 minutes, as a later turn re-writes its whole context: the work runs in the background, and a foreground call with a 240000 ms timeout waits on it, not runs it (`timeout 230 gh pr checks --watch`, or an until-loop on its output), again until done (2026-11-23)." · signals 6d76d22c · caught by no rule · repeat of —
  The audit's item 4: a gap past an agent's 5-minute cache re-writes its context, about 250k (0.7% of a window), where a check costs about 10k; builders waiting on a command paid 16 reloads, 3.7% of each window (`out-ttl-reloads.txt`, `out-cache-writes.txt`). Amended in place, one rule with both readers (the signal's note: it "amends the 2026-11-10 long-wait rule for agents only"; dotfiles plan review F3), not a second line in the change skill that an agent would read against it. It holds while agents' prompt cache lasts 5 minutes (`subagentPromptCacheTtl` unset). process-gate.mjs's pgrep turn-down, a copy of the wait advice, points at the line for an agent in place of "(or a Monitor with a time limit)", its words only, the turn-down unchanged (dotfiles review F3). The slice waits on the work and never wraps it, or a build or test run past 4 minutes would be killed and start over (review F7). Puts the global CLAUDE.md further over budget, ~1,530 of 1,200 tokens (6,106 characters ÷ 4, an estimate), a weekly item (D22) · landed in —

### 2026-11-22: fast path, rounds

The user's verdict, 2026-11-22 (inbox 53ae903a): "You draft is a much better way of defining the end condition. Agreed", to the main session's draft of a stopping rule for the change skill's review. It came from the user's correction on empire-cleaning #524, where an agent stopped after round 5 on a real one-line finding (F25, a test that checked nothing) and had to ask: "I'm not happy with this arbitrary cap on rounds, the spirit of it was just to prevent infinite loops but as long as we're finding real things that improve stuff we should keep going" (inbox 1d3a7bd6). No curator proposal came before it: the placement is the main session's (the change skill, Review). L148 is its one item. The gate's own copy of the cap, lib.mjs's `LAST_ROUND = 5`, under which `gh pr create` and `gh pr ready` go through with change findings open from round 5 on, isn't in it: removing it changes a hook that gates every session, which waits for the user's own verdict (process.md, Reach), so it goes to them as its own item.

- L148 yes · rule line → skill · skill · recommended yes
  change skill, Review, SKILL.md:77: "**After round 5**, any change finding still open goes to the user: stop and put each one to them with its paths. A round 6 runs only when they say so." → "**When rounds stop.** Rounds go on while each finds something real: a defect a user, a reader or the next builder would hit. They stop when a round finds nothing real, only preferences that change nothing true. A loop is what reaches the user: a fix undone by the next round, the same point back in new words, or two findings that can't both be met. Put that to them, with its paths. A long run isn't a reason to stop, but the report says how many rounds it took and what the last ones found, so its cost is seen." · signals 1d3a7bd6, 53ae903a · caught by no rule · repeat of —
  Past the user's words, as the lines it makes stale (process.md, Prune): SKILL.md:76's "Going nowhere" goes, as the new bullet's loop holds it (only its "with both sides" differs: a loop goes "with its paths", as approved, and a finding the reviewer holds keeps "both sides" in Push back); :72's "Rechecks have no cap." goes, as it reads as if rounds had one; :63's "before the last round" → "before round 5 (until .dotfiles#45)", what the gate does until its cap's own item, .dotfiles#45, lands; the gate's comments that cited the old line say the same (lib.mjs above LAST_ROUND and `review()`, review-gate.mjs's header), comment lines only (dotfiles plan review F1, F3; review F6, F7) · landed in —

### 2026-11-22: fast path, aim

The user's verdict, 2026-11-22 (inbox 13b1f558): "yes", to the main session's proposal after the user sharpened what they want to scale: "what i think captures my intent more is scaling good judgement", and "this is more of a guiding principle for everything we do while working together. at least for now". No curator proposal came before it: the placement is the main session's (process.md, Place: how the user works, any project). L146–L147 are its two parts. L146 is reach global, and the user said yes to it, then took the plan review's edit to it (F1).

- L146 edit · rule line → global CLAUDE.md · global · recommended yes
  A first section, "# Aim", above Change: "We're scaling good judgement; quality is what it produces (2026-11-22). Each call is made for the reason I'd give, and says that reason, so I check the reason rather than redo the call. Held for now: revisit at the weekly review once empire-cleaning#493 is built." · signals 0d83d450 · caught by no rule · repeat of —
  The user's edit, the plan review's (F1: in this file "you" is Claude and "I" the user): "yep makes sense. good catch". "Each call is made for the reason you'd give, and says that reason, so you check the reason rather than redo the call." → "Each call is made for the reason I'd give, and says that reason, so I check the reason rather than redo the call." "#493" is written "empire-cleaning#493", the file's form for another repo's issue (.dotfiles#5). Puts the global CLAUDE.md further over budget: ~1,441 of 1,200 tokens (5,491 characters ÷ 4 now, ~1,373, plus ~68; an estimate), with nothing else trimmed to make room; over budget makes it a weekly item (D22) · landed in —
- L147 yes · rule line → skill · skill · recommended yes
  teaching-loop skill, SKILL.md:8: the measure stops quoting "im trying to scale quality, not quantity" (2026-11-21) and points at the Aim: "The measure is the global CLAUDE.md's Aim, scaling good judgement: judgement that carries to the next case, not cases done", so the aim has one copy, the global CLAUDE.md · signals 0d83d450 · caught by no rule · repeat of —
  Prunes the quote L141 moved in; the 2026-11-20 and 21 origin and the "15 years" quote stay · landed in —

### 2026-11-22: fast path, teaching loop

The user's verdict, 2026-11-22 (inbox 8118c1a4), on the curator's batch from their ask to make the UX round's teaching loop something to run again, in both directions, and to add a reviewer that reads screens cold (`teaching-loop-2026-11-22.md`): "all yes." L137–L145 are its items 1–9, in order, places as it gives them. Items 2 and 5 were put as their own items because each goes past words the user had already approved (the nine steps; L131's measure), and the same "all yes" covers both. Two are reach global, and the user said yes to both: L139 (the main-session message) and L142 (the `ux-reviewer` agent type, with its line in `reviewer-gate.mjs`, a hook that gates every session). L145 is a repeat: the change skill's "Fix what you see" and the global CLAUDE.md's Change line held for code and docs but not for a screen a change touched (empire-cleaning #509). Item 1's 18 signals decided earlier, read there as each step's evidence, aren't decided again here. The fixes from the plan reviews are not the user's edits; each is noted on its entry's third line.

- L137 yes · skill → dotfiles · skill · recommended yes
  `home/.claude/skills/teaching-loop/SKILL.md`, the batch's Appendix A: the user's nine steps in their order, each with its reason, what the teacher and the learner do, a one-line example from the UX round, and when it's done, written as defaults (principle 3); the teacher can be the user or Claude, and where Claude teaches each step says it's untried until its first round; its description names `grilling` and `/teach` as the other skills and leaves out grilling's "shared understanding", so neither picks up the other's moment; ~2,500 tokens (9,955 characters ÷ 4, an estimate), loaded only on its trigger · signals 3d7615e9, cbd83191, 445a1fa4 · caught by no rule · repeat of —
  landed in —
- L138 yes · rule line → skill · skill · recommended yes
  teaching-loop skill, "How the steps run", above step 1, the nine steps kept as written and in their order: 1 to 3 go round per case and 4 runs throughout; the transfer test (6) lets the teacher call a round complete, and the write-up (5) closes it; 7 starts the next round from the write-up; the root (8) is named once the cases show it; trust (9) widens across rounds · signals cbd83191 · caught by no rule · repeat of —
  It goes past the words the user approved for the steps, so it was its own item · landed in —
- L139 yes · rule line → main-session message · global · recommended yes
  main-session.md, the capture bullet: L116's teaching sentence becomes a pointer, "While either of us is teaching the other a way of judging (a review across several screens), load the `teaching-loop` skill: it says what waits until the round is complete (2026-11-20)"; the rule and its reason now live in the skill's step 4 (L137), and the line widens to rounds where Claude teaches · signals 7b67f9a3, c84e97cd (decided in L116) · caught by no rule · repeat of —
  Prunes L116's wording; takes ~10 tokens off a message over its budget (~683 of 600, 2,730 characters ÷ 4, an estimate) · landed in —
- L140 yes · none → skill · skill · recommended yes
  No examples file for the teaching-loop skill: each step carries a one-line example from the UX round, and its last section, "The UX round, whole", points at empire-cleaning #493's comments and this log, L85 to L136, as the round is already recorded there and in the ui skill's examples.md; an examples file is weighed once a round where Claude teaches gives a second example · signals cbd83191 · caught by no rule · repeat of —
  landed in —
- L141 yes · remove → skill · skill · recommended yes
  ui skill, Settling a screen, SKILL.md:67 drops L131's "The measure is judgement that carries to the next screen, not screens done (…)", the line keeping its own reason ("ux is everything for a user facing product"); it goes into the teaching-loop skill's intro as "The measure is judgement that carries to the next case, not cases done", with the user's quote; memory current-work.md:13's pointer → "the measure is the `teaching-loop` skill's" · signals fe7ff706 (decided in L131) · caught by no rule · repeat of —
  Moves a line the user said yes to on 2026-11-21 (L131), so it was its own item: the user said it of the teaching round, not of how a screen is built (principle 1) · landed in —
- L142 yes · agent type → dotfiles · global · recommended yes
  `home/.claude/agents/ux-reviewer.md`, the batch's Appendix B: a cold read of a change's or a prototype's after-shots (a phone's width and a laptop's) as their readers see them; tools Read, Grep, Glob and Write, with no Bash, so no diff; given each shot's screen, case, reader and moment and the commit they show, not the diff, the brief, the survey, a fix list or the before-shots; the root first, then every mechanic; findings only (`U<n>`, high, medium or low), with Not drawn and Gaps; output `<git dir>/claude/ux-review-<branch>.md`. `hooks/reviewer-gate.mjs`'s HELD table gets `ux-reviewer`, which may write only a `ux-review-*.md` in a git dir's `claude/` folder, its header comment naming the agent, and `change-hooks.test.mjs` two cases (its own file goes through, any other path is turned down). The 2026-11-21 audit brief becomes this agent; a whole-app audit is this review run per area, on shots drawn first (#502) · signals ff632e48, 0f02b8ab, 84f23878 · caught by no rule (no agent reads screens) · repeat of —
  Reach global for the reviewer-gate.mjs line, a hook that gates every session; the agent's file alone is skill reach. Beyond the proposal: reviewer-gate.mjs:6–8's, change-hooks.test.mjs:6's and :709–710's comments, which said reviewer-gate holds the change-reviewer alone, name HELD's agents; the HELD row's turn-down names the place, a ux-review-<branch>.md in the git dir's claude/ folder, and the helper runs git from the git dir so the folder needn't exist yet, as a prototype's branch may have none (dotfiles plan review F3, F4) · landed in —
- L143 yes · rule line → change skill · skill · recommended yes
  change skill: (a) Review, a paragraph after its first: a change a person sees gets a UX review beside round 1, its after-shots at a phone's width and a laptop's, the `ux-reviewer` run with nothing of the change, each `U<n>` fixed with new shots and a later pass, put to the user, or left with its why (empire-cleaning #509, 2026-11-22); (b) Review's Done, SKILL.md:73, adds "and, for a change a person sees, the last UX review's findings are each answered"; (c) the PR body's Change, after the Review line (SKILL.md:100): "- UX review: U<n> <finding> → fixed in <sha> | answered: …", which the PR gate accepts and doesn't check; (d) Prototype, SKILL.md:24: "no survey, plan review or review" → "no survey, plan review or change review (its UX review: the `ui` skill, Settling a screen)" · signals ff632e48, 84f23878 · caught by no rule (the skill asks only for before and after shots, SKILL.md:111) · repeat of —
  An ask, not a gate: a gate comes if a change a person sees skips it twice (process.md, Form 2). Not the user's: change SKILL.md's next paragraph after (a), "The reviewer reads the diff and the survey", → "The change-reviewer reads …", so it can't be read as the ux-reviewer's; (a) stays where item 7 puts it (dotfiles plan review F6) · landed in —
- L144 yes · rule line → skill · skill · recommended yes
  ui skill, Settling a screen, a bullet after "Draw it at its edges" (:65): "A prototype gets a fresh read before the user sees it": once its shots are drawn, the `ux-reviewer` reads them told only each screen's reader and moment, since an author knows what they meant to show (empire-cleaning #509, 2026-11-22); its findings are settled on the prototype, or put to the user with their why; a change's screens get theirs in the change skill's Review (L143) · signals 84f23878 · caught by the ui skill, "Draw a call before trusting it" (in part: the author's own read of its shots) · repeat of —
  landed in —
- L145 yes · rule line → change skill · skill · recommended yes
  change skill, Rules, SKILL.md:19: "Fix what you see" → "Fix what you see, on a screen as in the code": a screen the change touches is left truer than it was found, so what's untrue, stale or said twice there is fixed in this PR whether or not the brief names it; nothing is filed for later, and one too big for the PR goes by Big work or to the open issue that plans it, named with its why in the report and the PR's Change (empire-cleaning #509, 2026-11-22). It folds in ff632e48's other two changes (a screen the change touches is in scope whatever the brief lists; a call to leave something alone carries its why); nothing goes in the main-session message, and the global CLAUDE.md's Change line stays as it is, as it covers work outside a change · signals 137e2f85, ff632e48 · caught by the change skill's Rules, "Fix what you see", and the global CLAUDE.md's Change, "Stale text, config or docs you find get fixed in the work at hand" · repeat of the change skill's "Fix what you see" (a355c43, 2026-11-04, no log entry) and the global CLAUDE.md's Change line (2026-11-10)
  It broke because it read as code and docs, so the new words name the screen; broken again, the next step is a hook (process.md, Form 2) · landed in —

### 2026-11-21: fast path, ux gaps

The user's verdict, 2026-11-21 (inbox 5ce69d52), on the curator's proposals from their 25 answers to the screen audit (`ux-2026-11-21-gaps.md`): "all yes, with your edit on 1. were now speaking the same language. great stuff." L120–L135 are its items 1–16 and L136 its Existing lines, places as it gives them. The edit on 1 was the main session's suggestion, which the user took as their own: the root paragraph leads with its question (L120, `edit`, its before → after on the third line). Item 15(d), the Home card's tile stepping aside, which the proposal flagged as not ruled directly, is covered by the same "all yes" (L134). Two are reach global, and the user said yes to both: L130 (the global CLAUDE.md, Evidence) and L132 (process.md, curation principle 3). The caution on absolutes holds for every line this batch writes: no bare "never" or "always"; a default carries its reason, and an absolute stays only with its harm beside it (L136 rewords the four moved lines the morning's run held, and keeps three with their harm). L132 lands that caution as principle 3, so the morning's "candidate curation principle" note is now decided (D19a). The fixes from the plan reviews are not the user's edits; each is noted on its entry's third line.

- L120 edit · rule line → skill · skill · recommended yes
  ui skill, the intro's first paragraph, above "attention is the budget": the root, the goal of the person on the page. A screen is for the person using it, and so is everything on it; each call turns on one question, what is this person's goal on this page?; a call carried to other screens carries the question, not one screen's answer; where two next steps compete, the page's goal isn't defined yet: sharpen it before ranking either. SKILL.md:8 then starts "Their budget is their attention: …", and L121 joins it there. Prunes: Relevance's lead (L85, as L119 edited it), SKILL.md:12, keeps its bold words and "came to see" and points up ("which is what their goal here rests on (the intro)"), its last two sentences moving into the root; L122, L124, L125 and L128 name "this page's goal" rather than restate the question; examples.md:3's "reader and moment" → "reader and goal", examples.md:22's "Listing the moments first" → "Listing her goal at each moment first" · signals c5694e0a, f68bba13, 60acf589, d6e6899d, 7ae91927, be441f06, 357bbf61, cb4badde · caught by no rule · repeat of —
  The user's edit (the main session's suggestion, taken as theirs): the root paragraph leads with its question, reordered as little as the sense allows. "A screen is for the person using it, and so is everything on it: … (the user, empire-cleaning's screen audit, 2026-11-21). Each call turns on one question: what is this person's goal on this page? The same row, mark or choice …" → "Each call turns on one question: what is this person's goal on this page? A screen is for the person using it, and so is everything on it: … (the user, empire-cleaning's screen audit, 2026-11-21). The same row, mark or choice …"; the rest as proposed. Not the user's: (b)'s "name this page's goal" holds for L122 and L128; L124 and L125 land as approved (dotfiles plan review F5) · landed in —
- L121 yes · rule line → skill · skill · recommended yes
  ui skill, the intro, after "so each thing on it must pay that back.": "What a thing costs turns on how often this reader meets it and how long they'll give it": a form used every day needs little explained, a rare case can bear a message slightly off when fixing it costs more than it saves, and a stranger giving a public page a few seconds has no attention to spare. The public site becomes a third screen in examples.md once its prototype round settles it, not now · signals 60acf589, be441f06, 357bbf61, c5694e0a · caught by no rule · repeat of —
  landed in —
- L122 yes · rule line → skill · skill · recommended yes
  ui skill, Relevance, SKILL.md:13 becomes "What this reader can't use yet is absent, not hidden, unless this page's goal needs it": what the goal needs but can't be done yet shows greyed, with its reason beside it (Send, while a quote has no email), and a line about it shows only while it applies; its sentence on a state that isn't true yet moves to L123 · signals 60acf589, be441f06 · caught by no rule (refines L95) · repeat of —
  landed in —
- L123 yes · rule line → skill · skill · recommended yes
  ui skill, Relevance, a new bullet after L122: "A screen says only what's true for this reader now": a value waits for what sets it (a price before the size is known is an empty state saying what's missing, not a number); the reader isn't drawn in a crew before they've confirmed; an all-clear doesn't show while work waits elsewhere; where two states hold, the badge shows the one waiting on the reader (Move asked, not Booked); a rare case can bend it, as the intro says (an out-of-area ZIP is thanked like any other) · signals 60acf589, d6e6899d · caught by no rule (refines L95) · repeat of —
  landed in —
- L124 yes · rule line → skill · skill · recommended yes
  ui skill, Relevance, a new bullet after L123: "A form fills in what it knows, and what this reader picks nearly every time, not what it would guess": a form one person fills again and again starts on their usual answers; a first-time stranger's starts blank, as a preset answer is a claim about them that isn't true · signals 60acf589 · caught by no rule · repeat of —
  landed in —
- L125 yes · rule line → skill · skill · recommended yes
  ui skill, Rank and order, SKILL.md:21 ("The facts come before the decision they lead to"): a page's or a sheet's action is pinned at the foot on a phone and sits top right on a wide screen; in an exceptional state (a price change to answer, a bill unpaid), an alert in its sentiment's colour says why, and the primary does it, in the primary's colour, as red marks what destroys; the usual step stands aside until it's done · signals c5694e0a, f68bba13, d6e6899d · caught by no rule (refines L97) · repeat of —
  Not the user's: "as red marks what destroys" → "as a red button marks what destroys", so a red alert (a late bill) keeps its meaning under "one meaning per colour" (dotfiles plan review F2) · landed in —
- L126 yes · rule line → skill · skill · recommended yes
  ui skill: when room runs out, the lesser part gives way. (a) SKILL.md:20: a badge drops under the title before the button moves, a table's rows on a phone keep who and what the list is sorted and judged by, and a button's label drops what its card already says; (b) SKILL.md:30: "A row's title wraps rather than cuts", and where nothing can wrap (a calendar block) the block keeps what tells it apart and drops what its place already says, and a phone shows fewer days; (c) SKILL.md:38: on a wide screen, a page with no side column keeps a readable width, its header's buttons lined up with it · signals 7ae91927 · caught by no rule (refines L96, and bends "wraps, never cuts") · repeat of —
  Not the user's: SKILL.md:20's citation adds "its screen audit, 2026-11-21" (dotfiles plan review F8). Beyond the proposal: empire-cleaning docs/ux.md:515's pointer "A row's title and line wrap, never cut" → "wrap rather than cut" (dotfiles plan review F3) · landed in —
- L127 yes · rule line → skill · skill · recommended yes
  ui skill, a long page read in pieces: (a) SKILL.md:28: it keeps each fact once within a section, what any reader needs wherever they land (how to reach you) stays in reach, and a section runs about a phone's screen; (b) SKILL.md:42: it may show its one action again where a reader lands, in the same words and look, so it reads as one action, not two · signals 357bbf61 · caught by no rule (refines L91/L109 and "one primary per page") · repeat of —
  landed in —
- L128 yes · rule line → skill · skill · recommended yes
  ui skill, Buttons: SKILL.md:43 becomes "Red is for losing what can't be got back", not for every no (declining a quote is a quiet secondary); a page whose only action destroys has no primary, its action top right, outlined in red, not filled and not in a menu, and the dialog that confirms it fills it. A new line: "What can be pressed looks pressable, and what can't doesn't." Prunes empire-cleaning docs/ux.md:351's "Nothing pressable looks inert." → "What's pressable looks it, and the reverse (the `ui` skill)." · signals f68bba13, d6e6899d · caught by no rule (refines the Buttons section) · repeat of —
  Not the user's: the lead "Red is for losing what can't be got back" → "A red button is for losing what can't be got back" (dotfiles plan review F2); "the action sits top right, outlined in red, not filled and not in a menu" → "the action sits where a page's action does ("The facts come before the decision", above), outlined in red, not filled, and not in a menu, where a menu of one would hide the page's only action" (dotfiles plan review F1); the Buttons footnote "All three are from empire-cleaning's UX pass (#96)" goes, its citation inline on the one-primary line and the sign-in line (dotfiles plan review F6). Beyond the proposal: #493's body lists the places of the lone destructive action's marker (Button.tsx, PageHeader.tsx:125, Patterns.stories.tsx:852–861, ux-log.md:19) (empire-cleaning plan review F1) · landed in —
- L129 yes · rule line → skill · skill · recommended yes
  ui skill, how much to explain: (a) SKILL.md:28: a mark keeps its whole form under a heading that groups it (a date tile keeps its month), and one form beats one mention; (b) SKILL.md:15: help sits at what it helps with, as its describing line, not in a paragraph the reader must carry to it · signals be441f06 · caught by no rule (refines L91 and "The first view stays focused") · repeat of —
  Not the user's: (b) also cuts SKILL.md:15's "No step is shown before it applies:", the sentence now "What matters only once a button is pressed (…) comes after the press, not before the button, as the reader can't use it until then": a bare absolute on a touched line (principle 3), and against L122's greyed Send (dotfiles plan review F9) · landed in —
- L130 yes · rule line → global CLAUDE.md · global · recommended yes
  global CLAUDE.md, Evidence, after "that's what blocks the decision.": an option put to the user is "checked against what's already decided too (the owner's business calls, a recorded pick, an ADR), and one that would change a decision says so" · signals 60acf589, b8bfbea5, 276b9ae0 · caught by the change skill, 2. Plan review, L62's line (in part, for b8bfbea5) · repeat of L62 (in part)
  Puts the global CLAUDE.md further over budget: ~1,360 of 1,200 tokens (5,209 characters ÷ 4 now, ~1,300, plus ~60; an estimate), with nothing else trimmed to make room · landed in —
- L131 yes · rule line → skill · skill · recommended yes
  ui skill, Settling a screen, SKILL.md:64 adds: "The measure is judgement that carries to the next screen, not screens done" · signals fe7ff706 · caught by no rule · repeat of —
  landed in —
- L132 yes · principle → process.md · global · recommended yes
  process.md, Curation principles: "3. A line states its rule as a strong default with its reason, not as an absolute." Its reason is what lets an agent tell the case where it bends apart; an absolute stays only where breaking it does real harm, with that harm beside it. Older lines get the same treatment when each is next touched, with no sweep through them all (principle 2) · signals 63bb46cf (047d3cae as context) · caught by no rule · repeat of —
  Decides the morning run's candidate curation principle (D19a; a policy change, D5) · landed in —
- L133 yes · record → #493 · repo · recommended yes
  empire-cleaning #493: a comment, "The 2026-11-21 audit: your 25 calls", the hinge first, the record until each build writes its docs/ux-log.md row (L115); #493's body: the Notices bullet adds the Quote pages, the Site visit and the unpaid Bill, and marks "put Change quote in the alert" and "Keep: the action inside the alert" overturned; it adds docs/ux-log.md:55 (overturned by G5.3) and a page not found inside an area, which drops the area's frame and language against docs/ux.md:249–251 (G6.4) · signals c5694e0a, f68bba13, 60acf589, d6e6899d, 7ae91927, be441f06, 357bbf61 · caught by the change skill, Rules, "Keep open issues true" (L66) · repeat of —
  Beyond the proposal: #493's body lists each new docs/ux.md marker's places outside ux.md (empire-cleaning plan review F1); it names docs/ux-log.md:78 (three days at first) as a pick L134(f) overturns, which the G4 answer reverses, as the report to the user says, as L130 asks (empire-cleaning plan review F3); and it lists a Service's Retire, red though Offer again brings it back, as against L128's rule (empire-cleaning plan review F6). The comment is the 25 calls, as proposed · landed in —
- L134 yes · rule line → repo doc · repo · recommended yes
  empire-cleaning docs/ux.md, the lines the answers overturn, each marked "(#493 builds it)": (a) :280–282 a page whose only action destroys has no primary; (b) :349–350 `danger` alone in a dialog, a page's lone destructive action outlined in red; (c) :355–356 declining a quote is a quiet secondary; (d) :142–145 the Home's answer card: what waits on the reader leads, money owed first, its tile stepping aside while a price change waits; (e) :187–189 a price is an empty state until what sets it is known; (f) :544–545 a day on a phone; (g) :579–580 the hero leads with what we clean and where, marked "(the public site's prototype round builds it)" · signals c5694e0a, f68bba13, 60acf589, d6e6899d, 7ae91927, be441f06, 357bbf61 · caught by no rule (each line said otherwise) · repeat of —
  (d)'s tile stepping aside, which the proposal flagged as not ruled directly, is covered by the same "all yes". Not the user's: (a) follows the phone clause, in the page's action place (empire-cleaning plan review F8); (c) "declining a quote is a quiet secondary" → "declining a quote is `quiet` (it backs out of the quote), not red, as the Client can ask again, and its confirm isn't red either" (F5), and Deactivate gets its loss, "the places it frees on Jobs" (F6); (d) also rewrites docs/ux.md:156–158 ("is a tile, never cut for a shortcut" → a tile so it stays in reach, unless the card holds it), and where its alert sits among the Home's parts is settled on #493's prototype (F2, F10); (e) "an empty state saying what's missing" → "it says what's missing in its place, not a number", "a business's size" → "a business's floor area" (F9); (g) drops "in the header", as the line keeps "no header bar", and its marker names #505, a new issue for the public site's prototype round, which lists the picks it overturns (ux-log.md:58, :64, :66) (F4); the logo line's "never redrawn …" gets its reason, as it's the business's own mark (F10) · landed in —
- L135 yes · snag → issue · repo · recommended yes
  empire-cleaning #502's body ("Prototype kit on main"), a new bullet, "Audits use it too": an audit draws the app's own cases with the e2e harness through the same shots mode, which shoots without scrolling the page itself; the harness sets the browser's clock (`page.clock`) and gets a fixture for a plan with many cleans booked; its helpers say their preconditions where they're declared · signals 06337430, 68462867, 0c0e083f, db826328, a49dd0d9, 07692b9e, a84545f7, 933151a4 · caught by process.md, Form (a snag is fixed at its source) · repeat of —
  Not the user's: the bullet names packages/web/e2e/staff.spec.ts:265–267 and schedule.spec.ts:473 as the copies the clock helper replaces, reading the API's own now with `setFixedTime`, and cites docs/testing-log.md:17 (a clock paused for a whole test stops the page's timers) (empire-cleaning plan review F7) · landed in —
- L136 yes · rule line → skill · skill · recommended yes
  ui skill, SKILL.md:14, :26, :29, :51, four lines moved word for word that keep a bare absolute (held by the morning's run, L119), each say their reason instead: :26 "never rides in the value" → "doesn't ride in the value"; :14 "never reaches another reader" → "stays off another reader's screen …, as it leaves them doing the office's sums and reading its words"; :29 "No box in a box: a card in a card, or an alert in an alert, reads as two things where there's one."; :51 "not how the system works, and no codes, which the reader can't act on". Kept, each with its harm beside it: :56, :52, :36 · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —

### 2026-11-21: fast path, ux consolidation

The user's verdict, 2026-11-21, on the curator's UX consolidation (`ux-2026-11-21.md`), asked for before any more UX work: "all yes, with a word of caution: be careful with infinitives - 'never' 'always', a scenario can always come up where it might make one of these hard rules bend and even break." L93–L118 are its items 1–26 and L119 its Existing lines, places as it gives them. The held L86 lands as L98 (its size-and-weight clause in L96), and the held L88 as L103. The main session applied the caution to every line the batch writes: an absolute ("never", "always", "every", "ever") becomes a strong default that carries its reason, so a reader can tell the rare case where it bends. Nine entries are `edit` for it (L95–L100, L108, L110, L118), each with its before → after on the third line. Absolutes kept, each with its reason beside it: colour alone (L98: a colour-blind reader can't tell the colours apart; the reason is added); the intro's "must pay that back" (L94: attention is the budget); a phone's bars on a laptop (L101) and a Record's actions in the header on a wider screen (L111), both the user's "no bottom action bar, ever"; "settled on the prototype" (L107, the user's own words); a history stays whole (L109: a log with entries missing costs trust); History last at every width (L112: a side column competed with the page); and the main session's hold on rules until the feedback is complete (L116, the user's instruction, with its end). Lines moved word for word (L87's first sentence, L89, L90, L92) keep their absolutes until the next run. The fixes from the plan reviews and the review rounds are not the user's edits; each is noted on its entry's third line. One point went to the user: the kept L85 ("came to see or do, and shows it first and largest") against L97 (the facts come before the decision). They ruled that a screen leads with what its reader came to see (L119, `edit`).

Candidate curation principle, for the curator's next run (D19a: an override's reason becomes a principle once the user approves its words; process.md is unchanged, D5): a line states its rule as a strong default with its reason, not as an absolute, since a case can come up where it bends or breaks. An absolute stays only where breaking it does real harm, with that harm beside it.

- L93 yes · skill → dotfiles · skill · recommended yes
  The ui skill becomes the one UX skill, laid out by mechanic (Relevance, Rank and order, Compact, Consistency and habit, Buttons, Words, Rules the server keeps, Settling a screen, Reworking a screen), its trigger widened to designing, prototyping, reviewing or changing a screen and any UX call; empire-cleaning CLAUDE.md's UX line starts "Before designing, prototyping, reviewing or changing any screen", and docs/ux.md:48–49's pointer becomes "the `ui` skill says how" · signals 43fc4fbe · caught by no rule · repeat of —
  Beyond the proposal: docs/ux.md:3–6's copy of the trigger is widened too (empire-cleaning plan review F5) · landed in —
- L94 yes · rule line → skill · skill · recommended yes
  ui skill, the intro: a screen's budget is its reader's attention; good UX is frictionless; the mechanics are terms of one equation; examples.md is read before making the calls on a screen · signals e4fb2e02, 6e6fce66, 4bfa2b3b, 15b41484, 232428c4, 3a872f81 · caught by no rule · repeat of —
  landed in —
- L95 edit · rule line → skill · skill · recommended yes
  ui skill, Relevance: what this reader can't use yet is absent, not hidden (not drawn locked, blurred or "shows later"), judged per fact, and the reader isn't drawn in a state that isn't true yet. Prunes L87's "Something hidden until later looks hidden …"; empire-cleaning docs/ux-log.md:127's withdrawn note is reworded · signals 96513cbe, 76b82b63, 9bd7ad53, aa11332a, 46063e49, 8ab387e4, 6e40e02a · caught by ui skill, L87 (which said the opposite) · repeat of —
  The user's caution: "Never draw the reader in a state that isn't true yet (…)" → "The reader isn't drawn in a state that isn't true yet (…), as the screen would then tell them something false." Not the user's: the lead "doesn't need yet" → "can't use yet", as "The first view stays focused" keeps what isn't needed yet behind a tap (dotfiles plan review F5); a client's number waits "until it's accepted" → "until the cleaner has confirmed": "accept" is on empire-cleaning's glossary's avoid list (F6), and the picked layout D shows the number once the job is the cleaner's, not on its day as F6 had it (dotfiles round 1, F10) · landed in —
- L96 edit · rule line → skill · skill · recommended yes
  ui skill, Rank and order: rank shows by position, size, weight, colour and grouping, and they agree; carries L86's "size and weight carry the ranking" · signals 14ab2068, 96513cbe, 4366099a, 619cecfa, 5470c84c, ba3a4687 · caught by no rule · repeat of —
  The user's caution: "One divider parts it from the rest, and none parts equals." → "One divider parts it from the rest; equals go without one, as a line between them reads as a change of rank." · landed in —
- L97 edit · rule line → skill · skill · recommended yes
  ui skill, Rank and order: the facts come before the decision they lead to, and the page's next step is its primary, not an alert's button; empire-cleaning docs/ux.md's Notice line goes (L110) · signals 4366099a, ba3a4687, 8afacadf, 9bd7ad53 · caught by no rule (empire-cleaning docs/ux.md:54 said the opposite) · repeat of —
  The user's caution: "The page's next step is always its primary, never a button in an alert, which buries it …" → "The page's next step is its primary, not a button in an alert, which buries it …" · landed in —
- L98 edit · rule line → skill · skill · recommended yes
  ui skill, Compact: "A picture, not a paragraph": state as a mark that says it once and says what it means; lands the held L86 with a tick, not a status dot. The colour line becomes "never colour alone: a shape or a word carries the meaning, and colour agrees" · signals 15b41484, 6e40e02a, 203a33b6, 1b6d4481 · caught by ui skill, L91 (in part: a tick beside "Confirmed") · repeat of L91 (in part)
  The user's caution, an absolute kept with its harm beside it: "app-wide, and never colour alone: a shape …" → "app-wide, and never colour alone, which a colour-blind reader can't tell apart: a shape …". Not the user's: "an open place in a crew" → "a cleaner still needed", as empire-cleaning's ADR-0019 retired "Open Place" (dotfiles plan review F6) · landed in —
- L99 edit · rule line → skill · skill · recommended yes
  ui skill, Compact: a detail is one icon, one value and one line saying what it is, the line by the value; a long single fact goes last and full width · signals 4366099a, d0b3729d, 619cecfa · caught by no rule · repeat of —
  The user's caution: "…, the same in every row." → "…, the same shape row after row, so the eye reads each the same way." · landed in —
- L100 edit · rule line → skill · skill · recommended yes
  ui skill, Consistency and habit: one thing, one form, one place; a difference that means nothing is noise · signals aa11332a, 8ab387e4, ba3a4687, 46063e49, 203a33b6, d0b3729d · caught by empire-cleaning docs/ux.md:286 (in part: where a section's title sits) · repeat of —
  The user's caution: "… one place, on every screen. The same control does the same job in every case, a section's title sits where every section's does, and an entry's time is always on the same line: each variation makes the reader learn it again." → "… one place, screen to screen. The same control does the same job in each case, a section's title sits where the others' do, and an entry's time sits on the same line in each entry: each variation makes the reader learn it again, so one has to be worth that." · landed in —
- L101 yes · rule line → skill · skill · recommended yes
  ui skill, Consistency and habit: each device keeps its own habits; a bottom action bar and a tab bar are a phone's, and a wide screen keeps its actions in the header · signals aa11332a, 59fcab56, f582d76b, 46063e49 · caught by no rule · repeat of —
  landed in —
- L102 yes · rule line → skill · skill · recommended yes
  ui skill, Consistency and habit: aligned, even and balanced · signals ba3a4687, 5470c84c · caught by no rule · repeat of —
  landed in —
- L103 yes · rule line → skill · skill · recommended yes
  ui skill, Words: words from the reader's side, and ADR-0029 limited to a term's word; lands the held L88. empire-cleaning ADR-0029's second paragraph ends on a status being the reader's, and docs/ux.md:375 points at it · signals 5f93cd77, 9bd7ad53, 14ab2068 · caught by empire-cleaning docs/ux.md, Words, "Everyday words" (in part) · repeat of —
  Beyond the proposal: docs/agents/domain.md:47's copy of ADR-0029's rule gets the same pointer (empire-cleaning plan review F5) · landed in —
- L104 yes · rule line → skill · skill · recommended yes
  ui skill, Settling a screen: draw a call before trusting it, at a phone's width, a laptop's and each width where the frame changes · signals 6ad0f259, 8afacadf, 5470c84c, f582d76b, 44faf9fd · caught by no rule · repeat of —
  landed in —
- L105 yes · rule line → skill · skill · recommended yes
  ui skill, Settling a screen: draw it at its edges (none, one, many, the longest text, the reader alone) · signals 1b6d4481, d0b3729d, 435f4cdd · caught by no rule · repeat of —
  landed in —
- L106 yes · rule line → skill · skill · recommended yes
  ui skill, Settling a screen: a call that reaches every screen is the user's, put with what it does on each device · signals 59fcab56, f582d76b · caught by no rule · repeat of —
  landed in —
- L107 yes · rule line → skill · skill · recommended yes
  ui skill, Settling a screen: a detail seen in review is settled on the prototype, not noted for the build · signals 4c64f851, b7851ddd · caught by no rule · repeat of —
  landed in —
- L108 edit · skill → dotfiles · skill · recommended yes
  ui skill, examples.md: empire-cleaning's Cleaner's Job and Office's Job by mechanic, with the calls that failed and why, linking #493's two pick comments; the intro (L94) points at it · signals 43fc4fbe, 4bfa2b3b, 6e6fce66 · caught by no rule · repeat of —
  The user's caution: "The next step is always the primary; …" → "The next step is the primary; …". Not the user's: the number waits "until the job is accepted" → "until they've confirmed", and "An open place" → "A cleaner still needed", as in L95 and L98 · landed in —
- L109 yes · rule line → skill · skill · recommended yes
  ui skill, "Few words, each fact once": a count and the list it heads are two facts at two ranks, and a record the reader opens on purpose stays whole · signals 619cecfa, 93d2a72b, d012602c, ba3a4687 · caught by ui skill, L91 (stretched past its meaning) · repeat of —
  landed in —
- L110 edit · remove → repo doc · repo · recommended yes
  empire-cleaning docs/ux.md:54–55, "A blocked step's unblocking action sits in the Notice that explains it", goes; :355 (Notices) adds that a Notice's action isn't the page's next step · signals 8afacadf, ba3a4687 · caught by no rule (docs/ux.md:54 said the opposite) · repeat of —
  The user's caution: ", and never the page's next step, …" → ", and not the page's next step, …". Not the user's: "(#493 builds it)" added, as the code doesn't do it yet (empire-cleaning plan review F2) · landed in —
- L111 yes · rule line → repo doc · repo · recommended yes
  empire-cleaning docs/ux.md: the page's actions are one split button (:280–281), a part's title line no longer holds an offer's answers (:76–77), the foot bar is a phone's only (:85–86, :336–337), each marked "#493 builds it"; the Quote Draft's desktop foot bar goes to #493 (L114) · signals aa11332a, 46063e49, 9bd7ad53, 4366099a, 203a33b6, f2546d41 · caught by no rule (docs/ux.md:76, :85, :280, :336 said otherwise) · repeat of —
  Not the user's: the width split (the header on a wider screen, the foot bar on a phone) is a Record's, as L101 and #493's Cleaner's Job pick have it: the proposal's :280 gave the title row no width, so a phone read its actions in two places (empire-cleaning plan review F1), and :280 is every page type's header, whose List and Home actions aren't settled (round 1, F6). The foot bar keeps a form's price and its button (the Quote Draft's Send, New quote's Draft a quote) on a wider screen until #493 settles it with a prototype (round 1 F6, round 2 F11, round 3 F14; L114); :336 spliced without its repeat (plan review F3) · landed in —
- L112 yes · rule line → repo doc · repo · recommended yes
  empire-cleaning docs/ux.md:81–83: a Record's History goes last, at every width, in one column (#493 builds it); the build updates :89's story name and FormPage's Beside line · signals ba3a4687, 43fc4fbe · caught by no rule (docs/ux.md:81–82 said otherwise) · repeat of —
  landed in —
- L113 yes · rule line → repo doc · repo · recommended yes
  empire-cleaning docs/ux.md: three copies of ui skill rules point at it (:389 a field's limit, :277–279 a subtitle, :519–520 an empty place) · signals 0c2af858 · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L114 yes · remove → #493 · repo · recommended yes
  empire-cleaning #493's body: its principles are cut to a pointer at the ui skill, the overturned notes are marked, and The audit names what the build changes (docs/ux.md's lines changed here, the icon rail, PageHeader's split-button slot, their docs/ux-log.md rows, the Quote Draft's desktop foot bar by prototype) · signals 96513cbe, 203a33b6 · caught by the change skill, Rules, "Keep open issues true" · repeat of —
  Beyond the proposal: the principles' "a clear home", this product's and not in the ui skill, stays; the crew's status-dot note is marked overturned too; The audit lists the places that describe today's shape for the build to change (docs/ux-log.md:24, :44, :114 among them), and the foot bar it settles is a form's, the Quote Draft's and New quote's (empire-cleaning plan review F4, round 1 F7, F10, round 2 F11); The audit also names when a Cleaner sees the client's number, which layout D (on prototype-cleaner-job) shows once they've confirmed, while GLOSSARY.md:25, `onTheDay` (assignments.ts:361), docs/screens.md:347–348 and docs/ux-log.md:127 (#230's row) hold it until the Job's day (round 3 F13) · landed in —
- L115 yes · keep → repo doc · repo · recommended yes
  empire-cleaning docs/ux-log.md: the six decisions picked in #493 get their rows in the build PRs (docs/ux.md, Changing a screen, step 5); #493's pick comments are the record until then · signals 43fc4fbe, 20168ca9 · caught by docs/ux.md, Changing a screen, step 5 · repeat of —
  landed in —
- L116 yes · rule line → main-session message · global · recommended yes
  main-session.md, the capture line: while the user teaches a way of judging, capture and talk, with no rule wording, landing or fast path until they say the feedback is complete; a yes to a point isn't a yes to a rule · signals 7b67f9a3, c84e97cd · caught by no rule · repeat of —
  landed in —
- L117 yes · snag → issue · repo · recommended yes
  empire-cleaning, a `ready-for-agent` issue, "Prototype kit on main": PrototypeSwitcher and a route shell that passes the layout lint, the lint's marked way for a prototype's layout part, one shot script for prototypes and audits; docs/ux.md:586 then names the kit · signals eda38adc, 601b67fa, 3d4f76a2, 0a7f232a, d63f1d1a, d164a7dc, 8f78a295, 1772d7f5, 96c0c41b, d3461715, d976f938, 41bc10a2, 275844c4, 331ef283, 14a31686, 68aecf2d, 7bca5bf2, ffdef31d, 388c2954, d1a73a93, fb79f995, f8cbd8d7 · caught by process.md, Form (a snag is fixed at its source) · repeat of —
  landed in —
- L118 edit · rule line → agent type · skill · recommended yes
  curator.md, step 2's Words: what a proposal contradicts is searched for (the file it joins, the repo's ADRs and glossary) and resolved in the proposal's own words · signals c344a88f, 0bd287d2, 5071a33c, 18a6fefe · caught by no rule (curator.md asked what a proposal prunes, not what it contradicts) · repeat of —
  The user's caution: "…, never leave it for the review (L86, L88 …)" → "… rather than leave it for the review, where each one costs the user a second ruling (L86, L88 …)" · landed in —
- L119 edit · keep → skill · skill · recommended yes
  ui skill, the lines landed 2026-11-20: L89, L90 and L92 kept word for word under their new headings; L85 edited by the user; L87's first sentence kept under Compact, its second cut (L95); L91 edited (L109); the colour line edited (L98); "Simplest option first" moves to Settling a screen; the owner's "clear, focused, simple, peaceful" note moves under Relevance · signals b7fe4edd · caught by no rule · repeat of —
  The user, on L85 against L97: "maybe the confusing part is the 'see or do' part. i think you can only do after you see". L85's "came to see or do, and shows it first and largest" → "came to see", with its reason: a person acts only after seeing what the action rests on, so the action follows the facts (L97); "Everything else ranks below it" goes, as rank is L96's. Not the user's: the note's "These three are …" → "This and the first line, with "Few words, each fact once" (Compact), are …", as "These" would have covered lines from 2026-11-20 and 21 under "since #431" and missed Few words (dotfiles plan review F7) · landed in —

### 2026-11-20: fast path, ui principles

The user's verdict, 2026-11-20: yes to all 8, as written, after agreeing to write the UI principles they taught reviewing #490's screenshots (empire-cleaning #493) down ("beautiful summary/takeaways, yes. agreed."). L85–L92 are this run's proposals 1–8 (`fast-2026-11-20-ui.md`), places as it gives them. Two wait for the user's ruling on a conflict the change review found, and land once they rule: L86's status dot is a colour with no label, against the ui skill's "One meaning per colour and per icon" (the curator's Existing lines checked, 1, left it to #493's people-badge pick); L88's status clause asks for a status word per reader, against empire-cleaning's ADR-0029 (one word per concept, for every reader), where a Sent Quote already reads "Sent" to the Office and "To answer" to a Client.

- L85 yes · rule line → skill · skill · recommended yes
  ui skill, What a screen shows: the first bullet becomes "Lead with what this reader, on this screen, needs"; a call carried to every screen like it carries that question, not one screen's answer (empire-cleaning #490) · signals aa98a573, 06fcfd6e · caught by no rule (06fcfd6e's writing-down half is held by docs/ux.md, Changing a screen, step 5) · repeat of —
  landed in —
- L86 yes · rule line → skill · skill · recommended yes
  ui skill, What a screen shows: "A picture, not a paragraph": keep all the information, cut the noise; show state, don't tell it; size and weight carry the ranking · signals 15b41484, 6e40e02a, 14ab2068 · caught by no rule · repeat of —
  landed in —
- L87 yes · rule line → skill · skill · recommended yes
  ui skill, What a screen shows: "A value is only the value": context never rides in it; hidden-until-later looks hidden; a row with nothing this reader needs isn't shown. empire-cleaning docs/ux-log.md's #485 row is marked withdrawn, and #230's row's words too, both redone in #493 · signals 5f93cd77, 6e40e02a · caught by no rule (docs/ux-log.md's #485 row held the opposite) · repeat of —
  landed in —
- L88 yes · rule line → skill · skill · recommended yes
  ui skill, Words: "Words from the reader's side": a field is named by its reader's question (how long, who, where), a status from their side. empire-cleaning docs/ux.md's "Everyday words" points at it · signals 5f93cd77, 14ab2068 · caught by docs/ux.md, Words, "Everyday words" (in part: it never said whose words) · repeat of —
  landed in —
- L89 yes · rule line → skill · skill · recommended yes
  ui skill, What a screen shows: "Each reader sees only their own concerns": one role's working never reaches another, even through a shared component · signals 14ab2068 · caught by no rule · repeat of —
  landed in —
- L90 yes · rule line → skill · skill · recommended yes
  ui skill, What a screen shows: "No box in a box": no card in a card, no alert in an alert. empire-cleaning docs/ux.md's three copies (Record's Notice, Page structure, Lists' empty place) are cut to pointers · signals 14ab2068 · caught by docs/ux.md, Page structure, "never a box in a box" · repeat of —
  landed in —
- L91 yes · rule line → skill · skill · recommended yes
  ui skill, "Few words" becomes "Few words, each fact once": a fact shows once on a screen · signals 14ab2068 · caught by ui skill, What a screen shows, "Few words" (in part) · repeat of —
  landed in —
- L92 yes · rule line → skill · skill · recommended yes
  ui skill, "The first view stays focused": what matters only once a button is pressed (which card, how a deposit is held) comes after the press, not before the button · signals 14ab2068 · caught by ui skill, What a screen shows, "The first view stays focused" ("No step is shown before it applies") · repeat of —
  landed in —

### 2026-11-20: fast path, local only

The user's decision, 2026-11-20, relayed in the audits' session: local only. L82–L84 are its three parts; no curator proposal came before it.

- L82 yes · remove → dotfiles · global · recommended yes
  The repo copies of the change rules go, and everything that exists only to keep them current: `hooks/sync.mjs`, copy.mjs, stale-copy.mjs (the session-start "this repo's copy … differs" warning) and its settings.json entry, lib.mjs's stand-aside for a copy, review-gate's reading of the copies' older lessons spelling, their tests, and each line that tells an agent to sync (the change rules' headers, CLAUDE.md, process.md). empire-cleaning's `.claude/` loses the synced copies (skills/change, skills/lessons, agents/change-reviewer.md, hooks/change/) and the hooks sync registered in its settings.json, keeping what sync didn't write; its #475 (the sync PR) closes · signals — · caught by no rule · repeat of —
  The user: remove the repo copies of the change rules and everything that exists only to keep them current; cloud sessions are out until they start them · landed in —
- L83 yes · principle → process.md · global · recommended yes
  D24 becomes: local only; cloud sessions, and the repo copies they'd need, come back only if the user starts using cloud sessions. The cloud route goes with it: the lessons skill's issue fallback, process.md's line on it and the reviewer's public copy of the policy (process.md, One gate; change-reviewer's hunt 10), and the decision record's "Cloud sessions" call · signals — · caught by no rule · repeat of —
  landed in —
- L84 yes · principle → process.md · global · recommended yes
  process.md, The inbox, records the tradeoff: the inbox and memory are local only, with no backup; a sudden disk loss costing up to a week of undecided signals is accepted for simplicity. The dotfiles get a README whose one line on moving machines says to copy `~/.claude/process` and `~/.claude/projects` across · signals — · caught by no rule · repeat of —
  landed in —

### 2026-11-20: audit

The user's verdicts, 2026-11-20, on two curator audits of guidance already written, read line by line rather than from signals: `audit-2026-11-20-testing.md` (empire-cleaning's docs/testing.md; L36–L54 are its items 1–19, L81 its Also noted) and `audit-2026-11-20-empire-docs.md` (the rest of empire-cleaning's guidance; L55–L80 are its items 1–26). Every item as the audit recommended, but where an entry says. The re-timings (L53, L76) wait for a quiet machine and an agent of their own, and nothing their numbers rest on changes here. Cloud sessions are out of scope (the user: local only), so the new skills stay out of sync.mjs.

- L36 yes · remove → repo doc · repo · recommended yes
  empire-cleaning docs/testing.md: "The machine's own faults" goes; .dotfiles#8 fixed its cause (2026-11-07), and the global CLAUDE.md names .dotfiles#5 · signals — · caught by process.md, Every line (an end condition) · repeat of —
  landed in —
- L37 yes · remove → global CLAUDE.md · global · recommended yes
  The Windows-CPU clause goes from docs/testing.md's "Time on a quiet machine", and from the global CLAUDE.md's Evidence once WSL is 3.0.1 or later (microsoft/WSL#41173); Evidence keeps "time things on a quiet machine: give the load and the runs already going" · signals — · caught by process.md, Every line (an end condition, the right place) · repeat of —
  The user updated WSL to 3.0.5, shown 2026-11-20 by `wsl.exe --version` (3.0.5.0) and `uname -r` (6.18.58.1) · landed in —
- L38 yes · remove → repo doc · repo · recommended yes
  docs/testing.md: the three log rows on the spinning `wsl.exe` threads (2026-11-03, 2026-11-07 twice) go; configuration.nix and .dotfiles#8 hold the cause · signals — · caught by process.md, Every line (the right place) · repeat of —
  landed in —
- L39 yes · skill → dotfiles · skill · recommended yes
  A `testing` skill (home/.claude/skills/testing) holds the test rules for any repo: writing or editing a test, changing how tests run, timing one or chasing one that fails. L30's and L31's lines move from the change skill into it, and the change skill's Build keeps one pointer; the change reviewer's hunt 1 and the test-sweep skill point at it; empire-cleaning CLAUDE.md's Tests line loads it before docs/testing.md · signals — · caught by process.md, Form (3 or more related rules on one kind of task) · repeat of —
  The user: the two change-skill rules move too, so the change skill keeps only the pointer · landed in —
- L40 yes · rule line → skill · skill · recommended yes
  testing skill: every check can fail (say what it would see with the code wrong; an absence check first shows where the thing would be; a text match is exact or read from where the app holds it; empire-cleaning #331, #409, #336). docs/testing.md drops its tour-data line (packages/web/README.md holds `walkTour`) and cuts the hidden-check and menu rules to their helpers · signals — · caught by process.md, Place (one kind of task, every repo) · repeat of —
  landed in —
- L41 yes · rule line → skill · skill · recommended yes
  testing skill: a project sets its kind of test's budget with its reason, one test past it says so beside it, raising the project's would hide hangs, and the tests nearest it fail under load (PR #323). docs/testing.md keeps this repo's budgets · signals — · caught by process.md, Place, and Every line (a reason) · repeat of —
  landed in —
- L42 yes · rule line → skill · skill · recommended yes
  testing skill: a change to how tests start, stop or wait checks how they fail beside how they pass (#312, PR #325), from docs/testing.md · signals — · caught by process.md, Place · repeat of —
  landed in —
- L43 yes · rule line → skill · skill · recommended yes
  testing skill: a run's shared resources are named for the run, never the checkout (#375). docs/testing.md's line is cut to `claimTestDatabase` as the one way a run gets its databases, and ports per checkout (#312) · signals — · caught by process.md, Place, and Every line (one copy) · repeat of —
  landed in —
- L44 yes · rule line → skill · skill · recommended yes
  testing skill: before against after in turns, on tests both share (PR #379), and a run alone against one beside another (#310), from docs/testing.md; ADR-0028's pointer names the skill · signals — · caught by process.md, Place · repeat of —
  landed in —
- L45 yes · rule line → skill · skill · recommended yes
  testing skill's timing rule: check for the repo's test runners already going, with docs/testing.md's `ps` line as the example (`pgrep -af` matches its own shell, de908e75); docs/testing.md's bullet goes. Reverses L12's keeping the `ps` line in docs/testing.md (principle 1) · signals — · caught by process.md, principle 1 · repeat of —
  landed in —
- L46 yes · remove → repo doc · repo · recommended yes
  docs/testing.md: "Show the cause before fixing it" and "Reproduce a failure as the tool runs it" go, copies of the global Evidence and the change skill's Survey; the section's lead points at the testing skill · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L47 yes · rule line → change skill · skill · recommended yes
  Change skill, "A removal leaves nothing behind": search every test for the words and values it removes, as the quick tests run only part of the suite (empire-cleaning PR #109); docs/testing.md's grep line goes · signals — · caught by process.md, Place · repeat of —
  landed in —
- L48 yes · rule line → skill · skill · recommended yes
  testing skill: a test no PR runs (nightly, a sandbox) finds what it acts on through the helpers the PR's tests use (empire-cleaning #444, 2026-11-14); docs/testing.md keeps `payAndBook`, `payThisBill`, `saveACard` and the sandbox's dispatch · signals — · caught by process.md, Place · repeat of —
  landed in —
- L49 yes · keep → repo doc · repo · recommended yes
  docs/testing.md: the 2026-11-09 wall-time-bound row stays a log row, a skill rule if it comes up again · signals — · caught by no rule · repeat of —
  landed in —
- L50 yes · keep → repo doc · repo · recommended yes
  docs/testing.md's own rules stay (`expectAccessible`, `saved`, `switchArea`, Payments, UTC, what a build leaves out here, the shared Postgres, the intro); the intro's "how to time things on this machine" becomes this repo's specifics for showing a cause and timing · signals — · caught by no rule · repeat of —
  landed in —
- L51 yes · remove → repo doc · repo · recommended yes
  docs/testing.md: "Record what you find in the log below" goes; CLAUDE.md's Tests line holds it · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L52 yes · keep → repo doc · repo · recommended yes
  docs/testing.md's repo budgets stay, naming the plan-change test rather than `changing.test.ts:113` (it moved); its own 10 s waits for L53's re-timing · signals — · caught by process.md, Every line (a stale reference) · repeat of —
  landed in —
- L53 yes · keep → repo doc · repo · recommended yes
  The 21 log rows timed before .dotfiles#8 stay as history; what rests on them (ADR-0026's 2 local e2e workers and its 157 s and 225 s, the #316 row's starved figure) is re-timed on a quiet machine by an agent of its own · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —
- L54 yes · place → repo doc · repo · recommended yes
  docs/testing.md's findings log moves to docs/testing-log.md; CLAUDE.md's Tests line says to read it before chasing a failure or timing a change, and to record each finding there · signals — · caught by no rule (a must-read's size) · repeat of —
  landed in —
- L55 yes · rule line → repo CLAUDE.md · repo · recommended yes
  empire-cleaning CLAUDE.md: "a screen never keeps its own copy of a server rule" goes to the `ui` skill (L61); the line keeps `@empire-cleaning/models` as the one copy, and its stale tail names `hasRoomFor` in ScheduleCalendar.tsx and a new issue for the Schedule drag's copy · signals — · caught by process.md, Every line (one copy, the right place, an end condition) · repeat of —
  landed in —
- L56 yes · rule line → change skill · skill · recommended yes
  Change skill, Review: where the full suite is CI's, the PR opens as a draft once the review leaves no change finding open and the quick tests pass, what fails there is rerun locally and fixed with its recheck before the push, and it's marked ready once every check is green and its lessons are written (empire-cleaning ADR-0026). CLAUDE.md's Tests paragraph keeps the quick tests, the full suite's place and the cancelled-runs sentence · signals — · caught by process.md, principle 1 · repeat of —
  landed in —
- L57 yes · rule line → change skill · skill · recommended yes
  Change skill, Lessons: a PR merges on the user's word, which they often give ahead ("merge when green", 2026-10-31); the dotfiles' rule is stricter. empire-cleaning CLAUDE.md's copy goes · signals — · caught by process.md, principle 1 · repeat of —
  landed in —
- L58 yes · remove → repo CLAUDE.md · repo · recommended yes
  empire-cleaning CLAUDE.md's UX line: "record each new decision there, and add a Storybook pattern" is cut to a pointer at docs/ux.md's Changing a screen · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L59 yes · rule line → repo CLAUDE.md · repo · recommended yes
  empire-cleaning CLAUDE.md, "Human tasks go on two lists", cites its reason: eleven human-task issues (#43 to #196) folded into #205 and #206 (d152bee3, 2026-11-02) · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —
- L60 yes · place → repo doc · repo · recommended yes
  docs/ux.md's decisions log moves to docs/ux-log.md; CLAUDE.md's UX line says to read it before reworking a screen and to record each new decision there · signals — · caught by no rule (a must-read's size) · repeat of —
  landed in —
- L61 yes · skill → dotfiles · skill · recommended yes
  A `ui` skill (home/.claude/skills/ui) holds the UI rules for any repo with screens, each with its reason: lead with what the person came for, a focused first view, few words; simplest option first; what loads holds its room; one primary button, destructive actions red, a third-party sign-in keeps its owner's look; a problem says what's wrong then how to fix it, a field says its limit; words that state a rule are checked against its code; a screen keeps no copy of a server rule and a message both show is written once; a rework drops nothing by accident; one meaning per colour and per icon, no colour without a label, a row's title wraps. docs/ux.md keeps this product's choices and its rules open with "The `ui` skill's rules hold here too"; the change skill's Build points at it; it stays out of sync.mjs · signals — · caught by process.md, Form (3 or more related rules on one kind of task), principle 1 · repeat of —
  landed in —
- L62 yes · rule line → change skill · skill · recommended yes
  Change skill, Plan review: a plan that departs from what the user picked (a prototype, an option they chose) puts each departure to them then, not at the PR (empire-cleaning #435); docs/ux.md step 4's copy goes · signals — · caught by process.md, principle 1 · repeat of —
  landed in —
- L63 yes · remove → repo doc · repo · recommended yes
  docs/ux.md step 4's `pnpm pr:shots` sentence goes; CLAUDE.md and packages/web/README.md hold it · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L64 yes · rule line → repo doc · repo · recommended yes
  docs/ux.md step 2: `PrototypeSwitcher` isn't on main; it's copied from the latest `prototype-*` branch · signals — · caught by process.md, Every line (a stale name) · repeat of —
  landed in —
- L65 yes · remove → repo doc · repo · recommended yes
  docs/agents/domain.md's copy of docs/ux.md's Words is cut to what's about glossary entries (the `_On screen_` line's shape, searching each reader's strings), pointing at Words (ADR-0029) · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L66 yes · rule line → change skill · skill · recommended yes
  Change skill, Rules: keep open issues true (empire-cleaning #308, F11); docs/agents/issue-tracker.md's line goes · signals — · caught by process.md, principle 1 · repeat of —
  landed in —
- L67 yes · keep → repo doc · repo · recommended no
  The mattpocock plugin's template text in docs/agents/ stays: its setup skill wrote it and would write it back · signals — · caught by no rule · repeat of —
  landed in —
- L68 yes · remove → repo doc · repo · recommended yes
  docs/screens.md's "Keep it true" is cut to a pointer at docs/ux.md's Changing a screen, keeping "each fact is in one place" · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L69 yes · remove → repo doc · repo · recommended yes
  README.md's "The PR opens as a draft, and is marked ready once CI is green" goes, with L56 · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L70 yes · rule line → skill · skill · recommended yes
  testing skill: Playwright's `--project` takes several values, so a spec path after it reads as a project; moves from packages/web/README.md (L28 put it there) · signals — · caught by process.md, principle 1 · repeat of —
  landed in —
- L71 yes · keep → repo doc · repo · recommended no
  packages/web/README.md's "search the specs for the old value" of a URL stays: `test:change` takes specs from git, so each is named · signals — · caught by no rule · repeat of —
  landed in —
- L72 yes · keep → repo doc · repo · recommended no
  "2 workers (why: ADR-0026)" in packages/web/README.md and packages/landing/README.md stays until L53's re-timing · signals — · caught by no rule · repeat of —
  landed in —
- L73 yes · keep → repo doc · repo · recommended no
  packages/ui/README.md's NixOS `nix-ld` libraries stay: setup help for people cloning on NixOS · signals — · caught by no rule · repeat of —
  landed in —
- L74 yes · remove → repo doc · repo · recommended yes
  packages/server/README.md: "speed comes from more jobs, not fewer instants" goes, the testing skill's speed-up rule holds it; "All 28 stay" stays · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L75 yes · rule line → repo doc · repo · recommended yes
  packages/server/README.md's title "Express server starter" (the boilerplate's, 2026-08-18) becomes "Server" · signals — · caught by process.md, Every line (a stale name) · repeat of —
  landed in —
- L76 yes · keep → repo doc · repo · recommended no
  packages/server/README.md's "web e2e took 3.6 min alone and 4.7 min beside" is re-timed with L53 · signals — · caught by no rule · repeat of —
  landed in —
- L77 yes · keep → repo doc · repo · recommended no
  packages/server/README.md's drizzle-kit rename (until drizzle-orm#5307), one-off `pg` scripts and stored-words migration lines stay · signals — · caught by no rule · repeat of —
  landed in —
- L78 yes · human task → #205 · repo · recommended yes
  empire-cleaning #205, section 5, gets a box: weigh ADR-0028 again before launch (should edited end-to-end specs run 3 times before a PR?), its own end condition, tracked nowhere · signals — · caught by process.md, Every line (an end condition) · repeat of —
  landed in —
- L79 yes · keep → repo doc · repo · recommended no
  ADR-0026 and ADR-0028 stay ADRs, this repo's test process; ADR-0028's pointer per L44 · signals — · caught by no rule · repeat of —
  landed in —
- L80 yes · keep → repo doc · repo · recommended no
  The glossary and the other 29 ADRs hold no how-we-work lines; ADR-0025's "an agent drafts the Spanish" is a product decision · signals — · caught by no rule · repeat of —
  landed in —
- L81 yes · remove → dotfiles · global · recommended yes
  configuration.nix's `reg.exe` cover goes now WSL is 3.0.5 (microsoft/WSL#41173, fixed since 3.0.1), giving back Claude in Chrome's registration from WSL; anthropics/claude-code#108203 gets a follow-up. Its own PR, which the user merges and then runs `rebuild`, not this batch's · signals — · caught by process.md, Every line (an end condition) · repeat of —
  landed in —

### 2026-11-20: fast path

The user's verdicts, 2026-11-20: all six proposals as written, proposal 1 moved to the change skill. L30–L35 are this run's proposals 1–6; L30 is L7 in the user's words. Signal d55b11a0 waits for the next weekly run.

- L30 edit · rule line → repo doc · repo · recommended yes
  Change skill, Rules, beside L31's line: a speed-up runs the same checks faster (more workers or shards, a quicker setup), never fewer or weaker ones; cutting checks for speed was offered and turned down twice (empire-cleaning's seed tests, 2026-11-05; less coverage, 2026-11-06). Supersedes L7, which never landed; empire-cleaning's docs/testing.md gets nothing · signals 62682c83, d9c6b040, bdbe241a, 937818b5 · caught by no rule · repeat of —
  The user dropped "locally too", and moved the line: "does this really only apply to empire cleaning?" It's about every repo (curation principle 1), so the change skill, generalised, its reason dates kept; the quick-tests/ADR-0026 clause dropped (it contradicted the change skill's §4). The placement override counts against "rule line → repo doc" (D19d) · landed in —
- L31 yes · rule line → change skill · skill · recommended yes
  Change skill, Rules: each test a change adds or edits earns its place (no other test checks the same thing at the same level; it goes red when its code is broken by hand; a bug fix's red test counts); the change reviewer's hunt 1 points there: "A test is a copy too (the change skill's Rules, "earns its place")" · signals cb2a0c8c · caught by no rule (only a test harness's copies, a removed feature's tests and a bug fix's red test were checked) · repeat of —
  landed in —
- L32 yes · skill → dotfiles · skill · recommended yes
  A `test-sweep` skill, started by the weekly review beside the token review (token-review.md, Running a review; usage.mjs's reminder and its case in change-hooks.test.mjs): about 2 slices a week across every repo, picked by what changed since each slice's last sweep (`~/.claude/process/test-sweep.json`, local); duplicate and weak tests as the change skill's "earns its place" says, weak ones proved by breaking code by hand, stale and slow-but-covered tests; the report as main-session.md's "When you ask me to decide something" says; approved items land as one PR per repo through the change skill, with coverage before and after, naming no repo's coverage script · signals cb2a0c8c, 9681a7aa · caught by no rule · repeat of —
  The user's shape: ~2 slices a week whatever the number of repos, picked by recent change, weak tests proved by hand only for suspects, no mutation tool · landed in —
- L33 yes · principle → process.md · global · recommended yes
  Curation principle 2: background upkeep scales with activity, not with how many things exist · signals 9681a7aa · caught by no rule · repeat of —
  Approved in conversation 2026-11-20 (D5) · landed in —
- L34 yes · rule line → process.md · global · recommended yes
  The curator reads whole the global files and the guidance of the repos its signals come from, and searches every other repo's for each lesson's words (principle 2): process.md, The curator, and curator.md's step 1; prunes process.md's "it reads everything" and curator.md's heading "Read everything" (now "Read what's in play") · signals 9681a7aa · caught by no rule (follows from L33) · repeat of —
  landed in —
- L35 yes · rule line → agent type · skill · recommended yes
  curator.md, Output: the template's "Recommend: yes | no" becomes "make this change | don't make this change", and a pointer to main-session.md's "When you ask me to decide something" line, with its event ("Recommend: no" read as "remove", 2026-11-19); the log keeps "recommended yes|no" · signals 8590036a, 5e05e68f · caught by main-session message, "When you ask me to decide something" (L2), which agents never get · repeat of L2
  landed in —

### 2026-11-19: history

The user's verdicts, 2026-11-19: "approve all", each item as recommended, proposal 2 in the user's own words. L1–L9 are the run's proposals 1–9, L10 is .dotfiles#24's item 2, and L11–L29 are its existing lines 1–19.

- L1 yes · rule line → global CLAUDE.md · global · recommended yes
  Evidence: what Claude says about where work stands (an issue open or done, a PR merged, mergeable or green, a run going, a change live) is checked live as it's said, never from the conversation, memory or a handover · signals 65bd05d1, 88b01e9a, 8e5a7efe, 257eff2d, ffc4529d, 1211a89a, 25b096d0, 05980f47, 7a7f2ae5, dc12b180, e18564a0, ef8d05e4, e5e0ea1c, 0818a5df, 74e69899, 29a39449, a05583b1, b9dd0884, 52dce6de, bcb034de, 91525fee, 470cb358, 88746a2e, ad01566b, 3eb4f387, 436a776d, fb7df06a, 537fe869, 45601a2d, c95acad2, a0ba520c · caught by global CLAUDE.md, Evidence (88746a2e, 537fe869, c95acad2, a0ba520c broke it after 11-07); the rest no rule · repeat of —
  landed in —
- L2 edit · rule line → main-session message · global · recommended yes
  A question or choice put to the user stands on its own, and a question of theirs is answered first, in the form asked · signals 78ced742, 66154981, a940ffec, bd06d445, 881122db, 5447341a, dcf12929, 254b52ca, a303fe44, e60eea71, 2db7abcf, df6f0e2d, d19f523c, caf81f0c, e901e0fd, 86f7149c, e4f2e2b1, 515012c3, ace9c7f6 · caught by no rule · repeat of —
  The user's words, written in main-session.md from the user's side: "When I ask you to decide something: plain words, and any term you haven't used gets explained; say what each option does, how they differ, and why I'm asking, so you can answer without asking back. When you ask me a question, I answer it first, in the form you asked, before suggesting anything else." · landed in —
- L3 yes · hook → dotfiles · global · recommended yes
  `hooks/red-checks.mjs`, async at SessionStart: one line for each open PR whose checks failed and each workflow whose latest run on the default branch failed, nothing when all are green; "No red tests" points to it · signals 04962774, 0aa655c6, 5f3383fc, 34b1010a, 1d80e9ca, 3d773f10, e6370ca6, 0b5b3c0f, 9130bfa2, 13f1d7e6 · caught by global CLAUDE.md, Working with me, "No red tests" (3d773f10, 0b5b3c0f, 13f1d7e6 broke it) · repeat of —
  landed in —
- L4 yes · rule line → global CLAUDE.md · global · recommended yes
  Evidence: the vendor-guide check covers any plan that leans on a third-party service or library (its setup, or a way of using it), against the vendor's own current guide · signals bdc6cbad, 2176a8ef, 1f0df19a, bae4d1c4, 351d8648, 98b22a1b, 0cdc19a9, edb471f7, f4aa30f7, aafa384e, 9782eb2b, 7897f4f9 · caught by no rule (the line named setup plans only) · repeat of —
  landed in —
- L5 yes · rule line → dotfiles CLAUDE.md · repo · recommended yes
  A new hook, gate or command starts from how often its case has happened (with dates) and the simplest thing that would hold, says its cost, and adds nothing unasked · signals 0cb3492e, 4e2bdfe1, 7eed0554, 5935a0eb, a052d994, c2b63f76, cfe6bb8b · caught by no rule · repeat of —
  landed in —
- L6 yes · rule line → change skill · skill · recommended yes
  Rules, after Ratchet: a removal deletes what only it used (props, states, words, stories, guards, endpoints, tests) in the same change; .dotfiles#24's item 1 · signals 39bf448d, 2c80d17a · caught by no rule (knip catches unused files and exports only) · repeat of —
  "Close #24 with those verdicts" (L6 and L10) · landed in —
- L7 yes · rule line → repo doc · repo · recommended yes
  empire-cleaning docs/testing.md, Time budgets: a speed-up runs the same checks faster, never fewer or weaker ones, locally too · signals 62682c83, d9c6b040, bdbe241a, 937818b5 · caught by no rule · repeat of —
  landed in —
- L8 no · rule line → global CLAUDE.md · global · recommended no
  Working with me: what Claude starts (a dev server, watcher, background run) ends with its work; no change, since nothing came in after .dotfiles#8 · signals 18225ecf, 84bcb72e, 9cc06455 · caught by no rule · repeat of —
  landed in —
- L9 no · none → change skill · skill · recommended no
  No change: the dictated and prototype rules name the change flow's only skips, and the rule has held since · signals de542e9e · caught by change skill, Rules, "Every change" · repeat of —
  landed in —
- L10 no · rule line → agent type · skill · recommended no
  .dotfiles#24's item 2: the change reviewer opens each site before listing it; one false lead in one round · signals — · caught by no rule · repeat of —
  landed in —
- L11 yes · remove → global CLAUDE.md · global · recommended yes
  Change: the PR body's parts are cut to "and writes the PR's body" (the change skill's step 5 holds them), and the line cites its reasons (2a47494, 11-04; 525f08b9, 11-10) · signals — · caught by process.md, Every line (one copy, a reason) · repeat of —
  landed in —
- L12 yes · rule line → global CLAUDE.md · global · recommended yes
  Evidence cites its reason (23a0253, 11-07); empire-cleaning docs/testing.md keeps its `ps` line and points here for Windows' CPU; the change skill's and change-reviewer's copies stay for cloud sessions · signals — · caught by process.md, Every line (one copy, a reason) · repeat of —
  landed in —
- L13 yes · rule line → global CLAUDE.md · global · recommended yes
  Cite dates: No red tests 10-27 and 11-07, Quality 11-09, A long wait 11-10, Sent as me 10-31, Installing 10-25, No GUI 11-04 · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —
- L14 yes · snag → settings.json · global · recommended yes
  autoMode.environment names CristianCrane/*; the global workaround for blocked `gh` writes goes only once that's shown to work · signals 2e53ce6f, db299755, df5c778a · caught by process.md, Form (a snag is fixed at its source) · repeat of —
  "yes, try it": the sentence goes only if a real `gh issue comment` on an empire-cleaning issue then goes through in auto mode; if not, it stays · landed in —
- L15 yes · remove → dotfiles CLAUDE.md · repo · recommended yes
  "Leave the user's uncommitted changes" stays in the global CLAUDE.md only · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L16 yes · remove → global CLAUDE.md · global · recommended yes
  This machine: the "linked to its working tree" sentence is cut (the dotfiles CLAUDE.md holds it), the pointer stays · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L17 yes · rule line → global CLAUDE.md · global · recommended yes
  One-off scripts: kept, citing "no `python3` until .dotfiles#5" · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —
- L18 yes · snag → global CLAUDE.md · global · recommended yes
  Opening a URL: a dotfiles issue for `wslview` (wslu), shown opening the browser before the lines change; :25's end names that issue, not .dotfiles#5; :24's `ls` clause ends with .dotfiles#23 too · signals ec43dbf6, 604a557c · caught by process.md, Every line (an end condition) and Form (a snag) · repeat of —
  Try `nix shell nixpkgs#wslu` and show it first; if it fails, keep the lines and say so. It failed: nixpkgs removed wslu on 2026-04-08 (discontinued, repo archived), so the PowerShell line stays, ending with .dotfiles#31, which now proposes a `wslview` of our own · landed in —
- L19 yes · remove → global CLAUDE.md · global · recommended yes
  Merged work goes by itself: the catch-up sentence is cut (catch-up.mjs and the dotfiles CLAUDE.md hold it) · signals — · caught by process.md, Every line (one copy, the right place) · repeat of —
  landed in —
- L20 yes · remove → dotfiles CLAUDE.md · repo · recommended yes
  The PR bullet keeps its rule (only the user merges), points to process.md, Landing, for the batch exception, cuts its copies, and cites ee4d56be (11-19) · signals — · caught by process.md, Every line (one copy, a reason) · repeat of —
  landed in —
- L21 yes · rule line → dotfiles CLAUDE.md · repo · recommended yes
  Installers cite c6e2f391 (11-08) and 35203268 (11-13); the session-start hook line cites 8dad2b9 (11-09) · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —
- L22 yes · remove → repo CLAUDE.md · repo · recommended yes
  empire-cleaning: the triage label list is cut (docs/agents/triage-labels.md holds it), the pointer stays · signals — · caught by process.md, Every line (one copy) · repeat of —
  landed in —
- L23 yes · rule line → repo CLAUDE.md · repo · recommended yes
  empire-cleaning: "follow the newest ADR" is kept and cites a reason (added 3b2b9817, 11-04) · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —
- L24 yes · rule line → repo CLAUDE.md · repo · recommended yes
  empire-cleaning: the business Gmail cites 11-17 and "a newer push cancels" 10-27; "Merging is the user's" becomes "a merge waits for the user's word", citing that the user often hands a merge over · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —
- L25 yes · remove → main-session message · global · recommended yes
  Tokens and Few turns are cut to the command (`usage.mjs --agent <its id>`), freeing room for L2; Tokens cites c597fab1 and 410df00b (11-09) · signals — · caught by process.md, Every line (one copy, a reason) · repeat of —
  landed in —
- L26 yes · rule line → main-session message · global · recommended yes
  Cite reasons: Finish the issue first a3bcf40a (11-04); Make a note 4b85471b (10-26); Iterating on a look its source (moved from memory 2026-11-08, dc19182); URLs bare 2026-11-02, links that wouldn't open on ctrl+click · signals — · caught by process.md, Every line (a reason) · repeat of —
  landed in —
- L27 yes · place → memory · memory · recommended yes
  empire-cleaning current-work.md: the Nav, prototype-branch and force-push lines go, drizzle-kit's rename moves to packages/server/README.md, and the two stale items go · signals — · caught by process.md, Place (memory holds no lasting rule) · repeat of —
  landed in —
- L28 yes · place → memory · memory · recommended yes
  empire-cleaning nixos-home-manager.md: `pg` scripts under packages/server go to packages/server/README.md, `--project=phone` before a spec path to packages/web/README.md, Testing; the memory and its index line go · signals — · caught by process.md, Place (memory holds no lasting rule) · repeat of —
  landed in —
- L29 yes · place → memory · memory · recommended yes
  empire-cleaning logo-pending.md is renamed logo-files.md (the logo has been in since 11-02) · signals — · caught by process.md, Every line (a stale name) · repeat of —
  landed in —
