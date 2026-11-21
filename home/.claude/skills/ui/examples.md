# Worked examples

Two screens of empire-cleaning, a cleaning business's app, settled with the user in review on 2026-11-20 and 21. Every pick and its why is in empire-cleaning #493's comments: [the Cleaner's Job](https://github.com/CristianCrane/empire-cleaning/issues/493#issuecomment-7066321804) and [the Office's Job](https://github.com/CristianCrane/empire-cleaning/issues/493#issuecomment-7067307937). Read them for how the mechanics in SKILL.md decide a screen, not as rules: another screen's reader and moment give other answers.

## A Cleaner's Job (six review passes)

The reader: a cleaner, on a phone, between jobs, deciding yes or no to an offered job, then working it.

- **Relevance.** An offer shows no directions, door code or client's number, and doesn't draw them locked or blurred. Three layouts tried that, and each was turned down ("why go through the pageantry?"). The client's name stays, since it's harmless; only the number waits until they've confirmed. The reader isn't drawn in the crew until they've confirmed.
- **Rank.** The header holds only what the yes or no rests on: the date, the time range and the address. One divider sits under it, and none between the details. The crew (faces, names, ticks) was too much for a detail row, so it got a section of its own below the details. Extras show as "8" over "Extras" among the details, with the list in its own section below: the count is the signpost that leads to the list.
- **Order.** On a phone, the decision is pinned at the bottom, read after the facts it rests on. On a desktop, it's top right, where the eye lands after the title and details. An outlined secondary button in the primary's place said two ranks at once.
- **Words.** "Available", the cleaner's side, not the office's "Offered". "How long", not "On site".
- **Compact.** A tick alone says confirmed: no word beside it, no hourglass for not yet. A detail is "8" over "Extras", not "8 extras" over "Listed below". Getting in is one fact but long, so it goes last and full width, where it can't push the short facts out of view. "First to confirm gets it" was noise.
- **Consistency.** Every case uses one action control, the split button, not a split button in one case and a button plus "More actions" in another. The crew card's title sits where every section's does. A brand-coloured avatar for "you" meant nothing, so it went, and "You" and "Open" looked too alike for things that mean different things.
- **A mark says what it means.** A cleaner still needed was first drawn as an empty circle, which says nothing. A faint person in a dashed ring says someone's missing.
- **Habits.** A bottom bar is a phone's. On a desktop, the actions sit in the header, which sticks once scrolled past.

The verdict: "a human can glance at this for a mere second and understand the entire picture … not a single piece of information has been lost: we may have even gained info."

## The Office's Job (the agent made every call; graded "professional grade")

The reader: the owner, mostly at a desk, opening a job at one of seven moments: short of cleaners, booked, a move asked for, on the day, done, couldn't get in, or cancelled. Listing the moments first gave each call its reason.

What held: the header card holds the date, the time range, the address and the client's name, which is how she identifies a job. One status badge, from her side, with none for the usual booked job. Cleaning hours show because they're her concern, unlike the cleaner's, but only for a crew of more than one, where they differ from how long. Money is one line per fact.

What failed once drawn, and why:
- An alert holding its own action put a weaker action (Move) in the primary's place while a move request waited. The next step is the primary; the alert only explains it.
- An ended job's lead retold History: each fact once.
- Folding the header card on an ended job hid which job it was. The header is identity, the first rank.
- Cleaning hours beside how long, for a crew of one, said one fact twice.
- An alert listing price changes repeated the list under it. The badge ("To review") carries the state, the button the step, and the list the what.
- An overcorrection: History was trimmed so that no fact showed twice, and it was put back. A log the reader opens on purpose stays whole: Money says where the money stands, and History says when it moved.

What the user caught:
- History in a side column competed with the content, so the page went to one column with History last.
- A History entry's time was inline in some entries and below in others.
- In a narrow column, the title, badge and split button wrapped, leaving a ragged title line and an empty band. A header row fixed it, with the badge giving way first.
- Giving a laptop window under 1024 px the phone's frame to make room: a phone's habits belong on a phone. The room came from the desktop's own habit instead, a sidebar folded to icons.
