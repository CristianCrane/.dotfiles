// Edited in github.com/CristianCrane/.dotfiles (home/.claude); user-level only, never copied into repos.
//
// Writes one raw signal to the process layer's inbox,
// ~/.claude/process/inbox.jsonl (the dotfiles' docs/process.md, Capture):
// the user corrected Claude, either side flagged something as important,
// or (from the `lessons` skill) something a piece of work cost. It decides
// nothing; the curator does, in a batch. The inbox is local and never
// committed: a quote can name a client.
//
//   node ~/.claude/hooks/capture.mjs --kind <kind> --said "<the user's words>"
//     [--proposed "<what Claude proposed or did>"] [--note "<context>"]
//     [--source capture|lessons]
//
// It takes --said or --note, or both: a cost the lessons skill notices may
// have no words of the user's. The session is CLAUDE_CODE_SESSION_ID, which
// Claude Code sets in every Bash command; the project is the checkout's
// folder (a worktree counts as its main checkout's), or the cwd's. Each
// signal gets an id, which the curator's proposals and the log cite. It
// writes whatever docs/process.json says: the off switch stops the curator
// and the background pass, and the inbox keeps what comes in meanwhile.
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { flagsOf, git } from "./lib.mjs";

const KINDS = ["correction", "important", "decision", "retraction", "repeat", "frustration", "cost"];
const SOURCES = ["capture", "lessons"];
const USAGE = `--kind <${KINDS.join("|")}> --said "<the user's words>" [--proposed "<what Claude proposed>"] [--note "<context>"] [--source ${SOURCES.join("|")}]`;

const { values } = flagsOf("capture", USAGE, {
  options: {
    kind: { type: "string" },
    said: { type: "string" },
    proposed: { type: "string" },
    note: { type: "string" },
    source: { type: "string", default: "capture" },
    help: { type: "boolean" },
  },
});
if (values.help) {
  console.log(`Usage: node ~/.claude/hooks/capture.mjs ${USAGE}`);
  process.exit(0);
}
const wrong = [
  !KINDS.includes(values.kind) && `--kind is one of ${KINDS.join(", ")}`,
  !SOURCES.includes(values.source) && `--source is one of ${SOURCES.join(", ")}`,
  !values.said?.trim() && !values.note?.trim() && "--said or --note says what happened",
].filter(Boolean);
if (wrong.length) {
  console.error(`capture: ${wrong.join("; ")}.\nUsage: node ~/.claude/hooks/capture.mjs ${USAGE}`);
  process.exit(1);
}

// the checkout's folder, a worktree's being its main checkout's; the cwd's
// name outside one
const project = () => {
  try {
    return basename(dirname(git(process.cwd(), "rev-parse", "--path-format=absolute", "--git-common-dir")));
  } catch {
    return basename(process.cwd());
  }
};

const inbox = join(homedir(), ".claude/process/inbox.jsonl");
mkdirSync(dirname(inbox), { recursive: true });
const signal = {
  id: randomBytes(4).toString("hex"),
  at: new Date().toISOString(),
  session: process.env.CLAUDE_CODE_SESSION_ID ?? "",
  project: project(),
  source: values.source,
  kind: values.kind,
  said: values.said ?? "",
  proposed: values.proposed ?? "",
  note: values.note ?? "",
};
appendFileSync(inbox, JSON.stringify(signal) + "\n");
const count = readFileSync(inbox, "utf8").split("\n").filter(Boolean).length;
console.log(`captured ${values.kind} signal ${signal.id} in ${inbox} (${count} there now)`);
