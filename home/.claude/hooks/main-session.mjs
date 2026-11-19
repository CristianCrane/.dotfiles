// At session start, adds main-session.md, the rules only the main session
// needs, to its context. Agents never get SessionStart output (0 of 700
// agent transcripts held any, 2026-11-19), so it costs them nothing; it is
// sent again after a clear or a compaction.
import { readFileSync } from "node:fs";
import { context, hook } from "./lib.mjs";

hook(() => context("SessionStart", readFileSync(new URL("./main-session.md", import.meta.url), "utf8")));
