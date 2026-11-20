# Process

How the guidance agents follow learns from the user. Nothing the user corrects, or agrees is important, gets lost: each **signal** is captured raw, a **curator** decides what it teaches with every rules file in view, the user gives a **verdict**, and the change lands in the right form and place. The user designed it in a grilling session, 2026-11-19; each decision (`D<n>`) is in [process-decisions.md](process-decisions.md), and the verdicts in [process-log.md](process-log.md).

This file is the curator's brief, and the change reviewer's when a diff touches guidance (D30). Changes to it, its principles included, always go to the user (D5).

## Policy

### Guidance

**Guidance** is everything an agent reads or obeys that we own (D1): the global CLAUDE.md (`home/.claude/CLAUDE.md`), this repo's CLAUDE.md, each repo's CLAUDE.md and the docs it says to read first, memory (`~/.claude/projects/*/memory`), our skills, agent types and hooks (`home/.claude/`), `settings.json`, and the session-start messages (`home/.claude/hooks/main-session.md`). A third-party plugin's skill counts only as on or off (`enabledPlugins`).

One policy and one log, here, for every repo (D4). A repo keeps only what is about it.

### Every line

Each line of guidance holds four things, and a line missing one is a finding (D29):

- **A reason:** what it prevents, with the event that showed it (a PR, an issue, a date). A line with no reason found gets "keep, cite a reason" or "remove".
- **One copy:** one meaning in one place. A copy elsewhere is cut to a pointer or removed. A repo's byte copy of the change rules (`hooks/sync.mjs`) is one copy, made by a script.
- **An end condition:** when it goes, said when it isn't "never" ("until .dotfiles#5", "while Stripe is in test mode"). A line whose end has come is removed.
- **The right place:** where its scope puts it (Place, below; principle 1).

### Place

| A line about | Goes in |
|---|---|
| how the user works, or any project | the global CLAUDE.md |
| main sessions only (updates, turns, notes) | the main-session message; agents never get it |
| Claude Code's config, the dotfiles, this layer | the dotfiles' CLAUDE.md, or a doc it points at |
| one repo's code, product or workflow | that repo's CLAUDE.md, or a doc it says to read first |
| temporary project state, or a fact about the user | memory (D12): every lasting rule lives in a versioned file |
| one kind of task, every repo | a skill, or the agent type that runs it |

### Form

Least machinery first (D11):

1. **A rule line**, by default.
2. **A hook**, when the same rule is broken twice despite its line.
3. **A skill**, when 3 or more related rules or steps cluster on one kind of task.
4. **An agent type**, only for a fresh view, limited tools, or its own model or effort.
5. **Removal**, when a line is stale or was never needed.

A **snag** (a refused command, a gate that misreads, a missing tool) is no rule at all: it's fixed at its source (the config, the hook, the package), never written down as a workaround. A workaround line that must stay meanwhile names the issue that holds the fix ("until <issue>") and goes when it lands; one whose source isn't ours says so. Before calling a snag in how Claude Code behaves not ours, check what hooks can see and do (code.claude.com/docs/en/hooks.md: `agent_id`, `agent_type`, `updatedInput`, SubagentStart's context): a gate on them fixes it at the source. A miss the review should have caught is a line for the change reviewer (`home/.claude/agents/change-reviewer.md`).

The user's verdicts tune these thresholds; a new threshold is a policy change.

### Budgets

| File | Budget |
|---|---|
| the global CLAUDE.md | 1,200 tokens |
| each repo's CLAUDE.md | 1,000 tokens |
| each memory index (`MEMORY.md`) | 400 tokens |
| the main-session message | 600 tokens |

Over budget is an item on the weekly list: trim, move, or raise. Raising a budget is a policy change (D22). Until step 2's size measure, a file's tokens are estimated as its characters over 4, and the list says so.

### Reach

What may ever change without asking (D19b): only a repo's files, one skill, or memory. The global CLAUDE.md, this policy and its principles, and a hook that gates every session always wait for the user's verdict. This policy never graduates (D5).

## Curation principles

Each is a reason the user gave when they overrode a call, written here once they approved it (D19a). Read them before every call; a call that breaks one is wrong whatever its count.

1. **Scope comes from what a rule is about, not from where it has come up so far.** A rule first met in one repo is global when it is about something every repo meets. On 2026-11-19 the context audit moved the vendor-guide check (a third-party setup plan is checked against the vendor's own guide) and the mergeable check into empire-cleaning's CLAUDE.md (f4e8764b), because they had come up there; the user moved them back the same day (2f6d152a): the vendor-guide check is about any third-party service, so global, and the mergeable check is about a dotfiles hook (`pr-conflict.mjs`).
2. **Background upkeep scales with activity, not with how many things exist.** A recurring sweep (of tests, or of guidance lines) picks its work by what changed since it last looked, under one budget that doesn't grow with the count, so a repo nobody touches costs nothing. On 2026-11-20 a weekly test sweep was proposed that rotated through a repo's whole suite; the user asked how it would hold a year on, ten projects later, and chose about 2 slices a week in all, picked by recent change across repos (the `test-sweep` skill).

## Design

```
capture ──> inbox ──> curator ──> the user's verdicts ──> log ──> applied by PR
(pass, command,       (batch, every                (yes / no / edit;   (one commit
 lessons)              rules file in view)          fast path or        per change)
                                                    weekly list)
```

### Signals

A signal is a moment that may teach something (D3, D15): the user disagrees or redirects, says "yes exactly" or "that's important", a decision is made, a claim is retracted, the user explains something twice, frustration; and from work, what it cost (corrections, redone work, review findings, red runs), and the weekly numbers.

### Capture

Capture writes raw signals and decides nothing (D8). Three routes:

- **The background pass** (step 2, not built yet): when a main session ends or compacts, a cheap fast model reads what's new and pulls out every candidate signal, wide net (D14, D15); at each session start, a catch-up for conversations that never ended cleanly. Main sessions only. It is its own script: `hooks/catch-up.mjs` is the dotfiles' fast-forward to `origin/main`, a different job.
- **In the moment** (D16): `node ~/.claude/hooks/capture.mjs`, run by the main session when the user corrects it or either side flags something as important, as the main-session message says. `--help` gives its flags and its text's labelled lines.
- **The `lessons` skill** (D20): at the end of each PR, the agent writes what the work cost, a signal per cost, with `capture.mjs --source lessons`, which also adds its line to the branch's lessons file (`- <cost> → inbox <id>`), the record the PR gate reads. It is agents' only route in: the pass reads main sessions only. Cloud sessions (D24) have neither the command nor a lasting inbox: their costs go in one issue on CristianCrane/.dotfiles, "Signals from <repo>: <branch>", in the agent's own words with no quote and no name of a client or person, since that repo is public (D13); the curator reads it as signals.

### The inbox

`~/.claude/process/inbox.jsonl`, local, never committed: its quotes can name clients (D13). One JSON object per line:

```
{"id":"<8 hex>","at":"2026-11-19T21:30:00.000Z","session":"<session id>","project":"<repo or folder>","source":"capture|pass|lessons","kind":"correction|important|decision|retraction|repeat|frustration|cost","said":"<the user's words, quoted>","proposed":"<what Claude proposed or did>","note":"<one line of context>"}
```

The session is `CLAUDE_CODE_SESSION_ID`, which Claude Code sets in every Bash command. The curator marks nothing in it; the log says which signals each entry decided, by their `id`.

### The curator

The `curator` agent type (D9): a fresh view, never the session that made the mistake; it reads everything and runs at high effort. It writes only its output, under `~/.claude/process/curator/`: the proposals, and once the verdicts are in, the log's entries. `hooks/reviewer-gate.mjs` holds it there, and to commands that read, as it holds the change reviewer. It never edits guidance or the log: an approved change is applied by an ordinary agent through the `change` skill, which commits the curator's log entries as the batch's first commit. For each signal it decides, with the inbox, this policy and every guidance file in view (D8):

- whether it teaches anything, and which signals are the same lesson (a **repeat**);
- the rule that should have caught it, or "no rule" (D23);
- the form and place (Form, Place, the principles), and the exact words;
- what the change replaces or prunes.

A signal teaches a **lesson** only when all four hold:

- **It recurs:** it would happen again in other work. A fact about one ticket, or a taste call about one screen already built, is noise.
- **It's unrecorded,** or recorded and broken: search the code, its comments, the docs (a repo's ADRs, `docs/ux.md`), git history and the guidance first. Recorded and held is noise; recorded and broken is a **repeat**, which names the line that didn't hold.
- **It changes behaviour:** it reads as "when X, do Y", with why.
- **It's foundational:** it changes how work is approached, across many changes. A slip that cost one quick fix, a fact about one helper, or a snag (Form) is no lesson, even if it recurs. Few lessons, each heavy.

**Prune** in the same change: a line the lesson replaces, contradicts or makes stale goes, as does a memory whose fact is now fixed or recorded elsewhere. Done when no two places hold one lesson.

### Verdicts

- **The fast path** (D10, D17): a lesson the user explicitly agrees to make a rule is applied then. The curator shows its place in one line ("→ global CLAUDE.md, Evidence") for the user's OK, and the change lands as a batch of one.
- **The weekly list** (D18): everything else waits for the weekly review, one review with cost and PR quality (D6; [token-review.md](token-review.md) folds in at step 3). The list is short and numbered; each item says what was seen (a short quote), the proposal, a recommendation, and the rule that should have caught it or "no rule". The user answers in one line ("1 yes, 2 no: …, 3 edit: …"). A section "done without asking" lists the automatic changes (D19c).

### Landing

One PR per repo per batch, on a branch `process-batch-<date>-<slug>` (a fast-path change is a batch of one), through the `change` skill, and each change is one commit naming the log entry it applies (`L<n>`) (D27). The entries live only here, in the dotfiles: the dotfiles' batch PR's first commit adds the run's entries to [process-log.md](process-log.md), even when the batch changes nothing else here (that PR is then the log commit alone), and a repo's batch PR names those same `L<n>`s. The dotfiles' PR merges first. The user's verdict is the approval: the agent merges once the change reviewer leaves no change finding open and CI is green (`gh pr checks`; the dotfiles' CI runs the hook tests, `.github/workflows/hooks.yml`). In the dotfiles, review-gate lets that merge through as a bare `gh pr merge` from the batch's own checkout, when its review holds with no change finding open and every commit after the first names an entry the branch's log adds with a `yes` or `edit` verdict (a PR of the log commit alone approves nothing later: each branch's approvals are read from its own first commit). Every other dotfiles PR, this layer's own included, the user merges.

### One gate for every route

The change reviewer checks every diff that touches guidance against this file and its principles, whoever wrote it: a batch, the user's own ask, any agent's PR (D30). A dictated settings change stays exempt (the `change` skill). Its hunt reads this file at `~/.dotfiles/docs/process.md`, or with no `~/.dotfiles` the public copy on GitHub.

### The log

[process-log.md](process-log.md), committed: each decision, its verdict, its kind of call, and the counts that graduate a kind. The format is there.

### Earning autonomy

The user's judgement becomes the curator's, without one wrong call cascading (D19):

- **Reasons, not a score** (D19a): each override's reason becomes a principle, above, once the user approves its words.
- **Reach** limits it (Reach, above).
- **The bar** (D19d): a kind of call (per form and per reach) goes automatic after 8 verdicts in a row that matched the curator's recommendation, over at least 4 weeks. One override sends it back to asking and restarts its count. Rare kinds stay "ask".
- **Safety** (D19c): an automatic change gets the change reviewer's check against the principles first (a disagreement goes to the user), lands as one revertible commit with its reason, and shows under "done without asking". A veto reverts it and counts as an override.

### Measures

The main measure is learning (D2, D23): **repeats per week**, signals whose lesson the curator already logged, should fall. Health: signals captured, decided, the backlog, the oldest signal's age; zero captured is a failure, never quiet. After 8 weeks, if repeats aren't falling, the design is revisited. Size, tokens per PR and PR grades are guard rails.

The whole layer costs under 3% of the plan's week (D25), measured weekly (`node ~/.claude/hooks/usage.mjs`); over it, it trims itself and says so.

### The off switch

[process.json](process.json), beside this file: `"enabled": false` stops the background pass and the curator; the inbox stays, and capture keeps writing to it (D28). A kind of call freezes to "ask" with one `freeze` line in the log.

### Build order

D26. **Step 1** (built): this policy and its decision record, the inbox and `capture.mjs`, the curator, the `lessons` skill cut to noticing, the reviewer's guidance check, the off switch, the log's format; the first curator run reads the last 30 days of main sessions (D21). Its signals came from a one-off pass, run while building step 1: a cheap model over the user's own messages in each top-level transcript (`type` user, not `isMeta`, `origin.kind` human, as lib's userMessages reads them), each with Claude's turn before it, agents' transcripts left out; step 2's pass replaces it. The curator reads signals, never transcripts (D8). **Step 2**: the background pass and the size measure. **Step 3**: the weekly review with its list, the verdict log's tracking, the learning and health numbers, the cost cap, graduation.
