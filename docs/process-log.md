# Process log

The process layer's decisions ([process.md](process.md)): each proposal the curator made, the user's verdict on it, and what landed. The inbox (`~/.claude/process/inbox.jsonl`, local) holds the raw signals; this log holds no quotes that could name a client. Entries are newest first. How a batch's PR carries its entries: [process.md](process.md), Landing.

## Format

An entry, under its run's heading (`### <date>: weekly | fast path | history | audit`):

```
- L<n> <verdict> · <kind of call> · <reach> · recommended <yes|no>
  <the proposal, in a line> · signals <the inbox `id`s it decided> · caught by <the rule that should have, or "no rule"> · repeat of <L<m>, or "—">
  <the user's words, when they said more than yes or no> · landed in <repo>@<sha>, or "—"
```

- **verdict:** yes, no, or edit (the user's own words follow).
- **kind of call:** the form and the place, as the policy names them: `rule line → global CLAUDE.md`, `hook → dotfiles`, `remove → repo CLAUDE.md`, `place → memory`.
- **reach:** `global` (the global CLAUDE.md, this policy, a hook that gates every session: never automatic), or `repo`, `skill`, `memory` (D19b).
- **matched:** the verdict equals the recommendation. Graduation counts matching verdicts in a row per kind of call and reach (D19d).

A freeze, at the top of Counts: `- <date> freeze <kind of call> · <reach>: <why>` (D28).

## Counts

Kept from step 3 on: per kind of call and reach, the matching verdicts in a row, since when, and whether it asks or is automatic.

| Kind of call | Reach | In a row | Since | Mode |
|---|---|---|---|---|

## Entries

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
