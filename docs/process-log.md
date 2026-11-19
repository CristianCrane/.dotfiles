# Process log

The process layer's decisions ([process.md](process.md)): each proposal the curator made, the user's verdict on it, and what landed. The inbox (`~/.claude/process/inbox.jsonl`, local) holds the raw signals; this log holds no quotes that could name a client. Entries are newest first. How a batch's PR carries its entries: [process.md](process.md), Landing.

## Format

An entry, under its run's heading (`### <date>: weekly | fast path | history`):

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
