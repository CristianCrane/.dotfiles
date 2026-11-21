---
name: ui
description: How to judge and build a screen a person uses, in any app. Use before designing, prototyping, reviewing or changing a screen, making a UX call, or writing words a person reads (a label, a server message, an email).
---

# UI

A screen is for the person using it, and its budget is their attention: everything shown spends it, as everything in a context window spends a model's, so each thing on it must pay that back. Good UX is frictionless: a glance of a second gives the whole picture because every mechanic below agrees, with little text and nothing the reader needs lost, sometimes more gained (the user's definition, empire-cleaning #493, 2026-11-21). The mechanics are terms of one equation, each as important as the others, and each came from a screen that got in someone's way. [examples.md](examples.md) takes two screens through them: read it before making the calls on a screen. The repo's own UX doc, which its CLAUDE.md names, adds its screen types, layouts and words, and how a UX question is settled there.

## Relevance: this reader, this moment

- **Lead with what this reader, on this screen, needs.** Each screen starts from what the person looking came to see or do, and shows it first and largest. Everything else ranks below it, and what doesn't earn a place on the first view moves off it. A call carried to every screen like it, which keeps them consistent, carries that question, not one screen's answer: an empty Extras row is noise to a Client who asked for a clean, but elsewhere it can matter that nothing is there. One row's call, made a rule for every fact, buried the values on every screen it reached (empire-cleaning #490, 2026-11-20).
- **Each reader sees only their own concerns.** One role's working (the Office's cleaning hours, its crew maths) never reaches another reader (the Client), even through a component both screens share (empire-cleaning's Client Quote, 2026-11-20).
- **The first view stays focused.** Explanations, how a figure is worked out, history and rare actions wait behind a tap (a link, a folded section, an actions menu) until they matter. No step is shown before it applies: what matters only once a button is pressed (which card is charged, how a deposit is held) comes after the press, not before the button (empire-cleaning's Client Quote, 2026-11-20).
  This and the first line, with "Few words, each fact once" (Compact), are empire-cleaning's owner's "clear, focused, simple, peaceful" (2026-11-13), the rule for every screen type since #431.

## Rank and order

## Compact

- **A value is only the value.** What's still to come, or why it's missing, never rides in the value after a comma ("Robin, number shows on the day"): at a glance it reads as the value and buries it. Something hidden until later looks hidden (redacted, locked), and a row with nothing this reader needs isn't shown (empire-cleaning #485, #490, 2026-11-20).
- **Few words, each fact once.** Rows and pages carry only what drives the decision, and a fact shows once on a screen: no subtitle that repeats the title, no second card that says the schedule or price again, no help text that says what the screen already shows, no paragraph where a label will do. Offer to cut rather than add (empire-cleaning's Client Quote, 2026-11-20).
- **No box in a box:** no card in a card, no alert in an alert. empire-cleaning's Client Quote nested the Office's quote card in its details card (2026-11-20), and a Card around a List read as two boxes (#94).
- **A row's title wraps, never cuts.** A cut title hides what the row is: a payment's "Price change: 1 more hour" lost its hour at phone width, and a badge beside an address squeezed it to a word a line (empire-cleaning #436, #305).
- **What loads holds its room.** A part that arrives after the page is drawn at its size first, so nothing jumps when it comes: empire-cleaning's Quote form jumped in twice as its parts loaded (#180).

## Consistency and habit

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

## Settling a screen

- **Simplest option first.** Lead with the option that asks nothing new of anyone and uses what the app holds; each added step, role or signal earns its place against it (empire-cleaning #416, PR #423).

## Reworking a screen

- **A rework drops nothing by accident.** Before a part goes (a card, a button, a notice, a component swapped for a smaller one), list what it said, when it said it (its guard), what it showed while it worked (pending), and what it read aloud as it changed (its live region, and all that's in it), and give each a place in the new screen, or a reason. empire-cleaning #432's review found three such drops, and #434's two more.
