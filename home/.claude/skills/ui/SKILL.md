---
name: ui
description: UI rules for any app with screens. Use before changing a screen, or writing words a person reads (a label, a server message, an email).
---

# UI

A screen is for the person using it. Each rule here came from a screen that got in someone's way, or words that said something the code doesn't do. The repo's own UX doc, which its CLAUDE.md names, adds its screen types, layouts and words, and how a UX question is settled there.

## What a screen shows

- **Lead with what this reader, on this screen, needs.** Each screen starts from what the person looking came to see or do, and shows it first and largest. Everything else ranks below it, and what doesn't earn a place on the first view moves off it. A call carried to every screen like it, which keeps them consistent, carries that question, not one screen's answer: an empty Extras row is noise to a Client who asked for a clean, but elsewhere it can matter that nothing is there. One row's call, made a rule for every fact, buried the values on every screen it reached (empire-cleaning #490, 2026-11-20).
- **The first view stays focused.** Explanations, how a figure is worked out, history and rare actions wait behind a tap (a link, a folded section, an actions menu) until they matter. No step is shown before it applies.
- **Few words.** Rows and pages carry only what drives the decision: no subtitle that repeats the title, no help text that says what the screen already shows, no paragraph where a label will do. Offer to cut rather than add.
  These three are empire-cleaning's owner's "clear, focused, simple, peaceful" (2026-11-13), the rule for every screen type since #431.
- **Simplest option first.** Lead with the option that asks nothing new of anyone and uses what the app holds; each added step, role or signal earns its place against it (empire-cleaning #416, PR #423).
- **What loads holds its room.** A part that arrives after the page is drawn at its size first, so nothing jumps when it comes: empire-cleaning's Quote form jumped in twice as its parts loaded (#180).
- **A row's title wraps, never cuts.** A cut title hides what the row is: a payment's "Price change: 1 more hour" lost its hour at phone width, and a badge beside an address squeezed it to a word a line (empire-cleaning #436, #305).
- **One meaning per colour and per icon**, app-wide, and no colour without a visible label (empire-cleaning's UX pass, #96).

## Buttons

- **At most one primary button per page.** Two primaries means neither is.
- **Destructive actions are red.**
- **A third-party sign-in button keeps its owner's look** (their colours, logo and font); only the touch size is ours.

All three are from empire-cleaning's UX pass (#96).

## Words

- **A problem says what's wrong, then how to fix it**, in two short sentences at most, never how the system works, and no codes. When nothing can be done, it says what happened. A field that's too long says its limit, since the number is what fixes it (empire-cleaning #336).
- **Words that state a rule are checked against the code that applies it**, never against another page's or message's wording of it: copies drift from the code together. empire-cleaning told a plan's Client a late fee was the plan's whole deposit, and its Terms of service copied it, while the code charged that clean's share (#462).

## Rules the server keeps

- **A screen shows the server's answer** to a rule the server keeps (room, what a change replaces), never a copy of the rule of its own, not even as a hint. A rule both must run lives once, in a package both import, and so does a message both show. Two browser copies of empire-cleaning's room rule drifted from the server one after the other (#356, #365).

## Reworking a screen

- **A rework drops nothing by accident.** Before a part goes (a card, a button, a notice, a component swapped for a smaller one), list what it said, when it said it (its guard), what it showed while it worked (pending), and what it read aloud as it changed (its live region, and all that's in it), and give each a place in the new screen, or a reason. empire-cleaning #432's review found three such drops, and #434's two more.
