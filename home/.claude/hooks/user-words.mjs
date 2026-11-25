// Gives the ux-reviewer what the user has said lately (its Read first,
// item 4), at its start: the user's own words from the process layer's
// inbox (~/.claude/process/inbox.jsonl), this project's, of the last 14
// days, for a correction, a decision or what they said matters. Only
// `said`: `note` and `proposed` are Claude's words, often about the very
// work under review, which a cold read leaves unread; a Grep of the inbox
// returned every field (dotfiles review F12, 2026-11-23: 174 lines,
// ~31k tokens, two thirds of them Claude's). The words go to a file in the
// agent's own scratch folder, which the context names, so a hook's
// context stays under its 10,000
// characters (code.claude.com/docs/en/hooks, JSON output). The inbox is
// local and never committed: a quote can name a client, so the reviewer
// cites a signal by its id alone.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { context, hook, projectOf } from "./lib.mjs";

const DAYS = 14;
const KINDS = new Set(["correction", "decision", "important"]);
const SOURCES = new Set(["capture", "pass"]);

hook((input) => {
  const { agent_id: agent, agent_type: type, scratchpad_dir: root, cwd } = input;
  if (type !== "ux-reviewer" || !agent || !root || !cwd) return;
  const inbox = join(homedir(), ".claude/process/inbox.jsonl");
  if (!existsSync(inbox)) return;
  const project = projectOf(cwd);
  const since = new Date(Date.now() - DAYS * 86400000).toISOString();
  const words = readFileSync(inbox, "utf8")
    .split("\n")
    .flatMap((line) => {
      try {
        const signal = JSON.parse(line);
        const fits = signal.project === project && signal.at >= since && KINDS.has(signal.kind) && SOURCES.has(signal.source) && signal.said;
        return fits ? [`${signal.id} (${signal.at.slice(0, 10)}, ${signal.kind}): ${signal.said.replace(/\s*\n\s*/g, " ")}`] : [];
      } catch {
        return [];
      }
    });
  if (!words.length) return;
  const own = join(root, "agents", agent);
  mkdirSync(own, { recursive: true });
  const file = join(own, "user-words.txt");
  writeFileSync(file, words.join("\n") + "\n");
  return context(
    "SubagentStart",
    `What the user has said lately (${project}, the last ${DAYS} days, ${words.length} signals, their own words only): ${file}. Read it first (ux-reviewer.md, Read first, item 4).`,
  );
});
