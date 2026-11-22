---
name: teaching-loop
description: Hand a way of judging something (what makes a screen good, a test worth keeping, a price fair) from the user to Claude, or from Claude to the user, through real cases, until the learner's calls on new cases match the teacher's. Use when either says they want to teach or learn how to judge something, or when a review's corrections turn to the why behind them. Not for settling one plan's decisions (the `grilling` skill) or a course on a topic (`/teach`).
---

# Teaching loop

A way of judging lives in cases more than in rules, and it has been handed over when the learner makes the teacher's calls on cases neither has seen. The user and Claude built this loop over empire-cleaning's UX, 2026-11-20 and 21, so the user could "impart the 15 years of experience ive gained … so im no longer the bottleneck without sacrificing user experience. its the only way this scales".

The **teacher** holds the judgement and the **learner** is taking it on; either can be the user or Claude. Each step says what each does. Where Claude teaches, a step is drawn from the UX round by symmetry and is untried until its first round (2026-11-22). Each step is a default with its reason: a narrow way of judging may close in one case and need no step 7, and a step bends where its reason doesn't hold, said out loud when it does.

`grilling` settles one plan's decisions and ends when nothing in the plan is left open; this loop ends when the learner settles cases the teacher never saw, and a decision is only the case it learns from. `/teach` builds a course on a topic from outside sources; this loop hands over judgement one of you already has, inside real work.

**How the steps run.** Steps 1 to 3 go round per case, and 4 runs throughout. The transfer test (6) is what lets the teacher call a round complete, and the write-up (5) closes it. Step 7 starts the next round from the write-up, its gaps going through 2 to 5 again. The root (8) is named once the cases show it, and trust (9) widens across rounds. The UX round ran: the Cleaner's Job (1 to 3, six passes), the Office's Job as the transfer test (6), the consolidation (5), the screen audit (7) with its 25 calls, the root (8) and their consolidation (5), then "proceed without asking" (9).

## 1. Start from real cases, not principles

A principle stated before its cases gets read wider or narrower than it was meant, and a case shows where it stops. Eight UI rules written from one screen's review on 2026-11-20 (process log L85 to L92) were reworded the next day, and one, "hidden until later looks hidden", turned around once three layouts drawn with locks had been turned down (L95).

- **Teacher:** puts real work in front of the learner, or judges the learner's attempts at it.
- **Learner:** attempts the case (a draft, a prototype, a call), with a few versions where the answer is open: the Cleaner's Job went through layouts A to D.
- **Where Claude teaches:** it picks cases from the user's own work, and the user makes the call before Claude says its own.
- **Done:** each case has the teacher's verdict.

## 2. Every correction carries its why

A verdict settles one case, and its why is what carries to the next: "whats most important to me here is getting a shared understanding of the why, and the high level mechanics that explain the why" (2026-11-20).

- **Teacher:** gives the why with each yes and no: "why go through the pageantry of showing what's locked again? … is this stuff even relevant to this page?"
- **Learner:** asks for the why when a verdict comes without one, and treats the case's fix as the example, not the lesson.
- **Done:** every verdict in the round has its why.

## 3. The learner says it back

A summary the teacher confirms shows that the why was taken in, not only the answer, and a corrected one is the cheapest correction in the round.

- **Learner:** after a few cases, sums up the why in their own words, numbered, flagging what they're unsure of.
- **Teacher:** confirms, corrects, or settles the unsure point. Claude's six points after the Cleaner's Job drew "beautiful summary. precisely"; its unsure point (does "8 extras" repeat the list below it?) was settled as "keep both", since the count is a signpost to the list (2026-11-20 and 21).
- **Where Claude teaches:** it asks the user to explain a call back ("why is this a good idea?") rather than restating it for them.
- **Done:** the teacher has confirmed the summary, and no unsure point is left.

## 4. Capture everything, and write no rules until the teacher says the round is complete

A judgement still forming, written as rules partway, freezes its first wording, and a yes to a point isn't a yes to a rule. On 2026-11-20 a "yes to all three" mid-review set off a batch of rules, and the user stopped it: "refrain from jumping the gun and writing rules until the feedback is complete … Let the curator curate."

- **Learner, when it's Claude:** captures each correction, confirmation and settled point as it comes (the dotfiles' `docs/process.md`, Capture), and talks: no rule wording, landing or fast path in the meantime.
- **Teacher:** says when the feedback is complete.
- **Where Claude teaches:** it captures each correction the user makes to how it teaches, and holds back a summary sheet until the user can make the calls (step 1's reason).
- **Done:** the round's signals are all in the inbox, and the teacher has called the round complete.

## 5. A fresh mind consolidates, and examples stay examples

The session that learned something keeps one case's answers as rules and puts them in the nearest file; a fresh view with every rules file in sight finds the groups, the repeats and the place. The UX consolidation read 75 signals into 26 groups and kept the two screens in an examples file of their own, so one screen's answers wouldn't harden into rules (2026-11-21).

- **Learner, when it's Claude:** has the curator run over the round's signals, at the teacher's ask (`docs/process.md`, The curator and Verdicts), and puts its list to the teacher.
- **Teacher:** answers the list.
- **Where Claude teaches:** once the round is complete, it writes the round up for the user, the why first and the cases as examples; the user's own summary (step 3) is the check, and where they keep it is theirs.
- **Done:** the verdicts are in and the batch has landed (`docs/process.md`, Landing), or, where Claude teaches, the user has the write-up.

## 6. A transfer test

A confirmed summary shows the why was heard; only a new case, called by the learner alone, shows it carries.

- **Teacher:** hands over a case they haven't judged ("this time - you make all the calls. lets see what weve learned") and grades the result.
- **Learner:** makes every call with its why, checks each against the case as it really is (drawn, run, tried), and says which failed and why. Each failure, and each one the teacher catches, is a signal (step 4).
- **Example:** on the Office's Job five of the agent's calls failed once drawn and the user caught four more (the `ui` skill's examples.md); the grade, "100% passing grade … professional grade ux", is what let the user call the round complete (empire-cleaning #493, 2026-11-21).
- **Done:** the teacher's grade, with each failure captured with its why.

## 7. Apply it at scale to find the gaps

Two cases can't show where a judgement runs out; applying the write-up to the whole field does. A recommendation on each gap is a small transfer test of its own, and it lets the teacher answer in a word.

- **Learner:** applies the write-up across the field and brings back each place where it gives no answer, or two, as a numbered question with their recommended call and its why.
- **Teacher:** answers each one; a correction there is a signal like any other.
- **Example:** the audit of every screen found 112 problems and 25 places where the `ui` skill gave no answer, or two. After one correction the next five picks drew "100% agree. i think you've got it" (empire-cleaning #493, 2026-11-21).
- **Done:** every gap answered, and the answers consolidated (step 5).

## 8. The root comes last

Named before the cases, a root is one more abstract line; named after them, it explains each call, and the lines it explains shrink to what's their own.

- **Learner:** when the answers keep turning on one question, proposes it as the root, with the calls it decided.
- **Teacher:** confirms or reframes it. "it depends (as most things do) on the goal of the person on that page" was confirmed as "the root of the skill", and it's now the `ui` skill's first line (2026-11-21).
- **Done:** the teacher agrees, and the write-up leads with it.

## 9. Trust is earned in steps

Speed handed over before the calls match costs what the teacher is protecting; held back after they match, it keeps the teacher the bottleneck. The process layer earns its autonomy the same way (`docs/process.md`, Earning autonomy).

- **Teacher:** widens what the learner calls alone as their calls match: every detail reviewed, then one case's calls, then "i trust your judgement at this point. proceed without asking, but please keep checking in" (2026-11-21).
- **Learner:** waits for speed to be offered rather than asking for it (offering to leave three fixes for the build, Claude heard "i have no desire to rush the details here"), and leaves with the teacher what wasn't handed over: a call that reaches every screen, a merge.
- **Done:** the teacher has said what the learner now decides alone, recorded where its scope puts it (one project's state goes in memory: `docs/process.md`, Place).
