// Writes one raw signal to the process layer's inbox,
// ~/.claude/process/inbox.jsonl (the dotfiles' docs/process.md, Capture):
// the user corrected Claude, either side flagged something as important,
// or (from the `lessons` skill) something a piece of work cost. It decides
// nothing; the curator does, in a batch. The inbox is local and never
// committed: a quote can name a client.
//
//   node ~/.claude/hooks/capture.mjs --kind <kind> [--source capture|lessons] <<'EOF'
//   said: <the user's words>
//   proposed: <what Claude proposed or did>
//   note: <context>
//   EOF
//
// The text comes on stdin, from a quoted heredoc, which the shell leaves
// alone: the user's words are full of backtick code spans and dollar signs,
// which a double-quoted flag would run and expand. Each field starts a line
// with its label, and the lines after it carry on until the next label.
// Any may be left out but said or note: a cost the lessons skill notices
// may have no words of the user's. The session is CLAUDE_CODE_SESSION_ID,
// which Claude Code sets in every Bash command; the project is the
// checkout's folder (a worktree counts as its main checkout's), or the
// cwd's. Each signal gets an id, which the curator's proposals and the log
// cite. It writes whatever docs/process.json says: the off switch stops the
// curator and the background pass, and the inbox keeps what comes in
// meanwhile.
//
// From the `lessons` skill (--source lessons) it also adds the cost's line,
// `- <cost> → inbox <id>`, to the branch's lessons file (lib's stateFile),
// the record review-gate reads before a PR leaves draft.
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { flagsOf, git, stateFile, workOf } from "./lib.mjs";

const KINDS = ["correction", "important", "decision", "retraction", "repeat", "frustration", "cost"];
const SOURCES = ["capture", "lessons"];
const FIELDS = ["said", "proposed", "note"];
const USAGE = [
  `--kind <${KINDS.join("|")}> [--source ${SOURCES.join("|")}] <<'EOF'`,
  "said: <the user's words>",
  "proposed: <what Claude proposed or did>",
  "note: <context>",
  "EOF",
].join("\n");

const { values } = flagsOf("capture", USAGE, {
  options: {
    kind: { type: "string" },
    source: { type: "string", default: "capture" },
    help: { type: "boolean" },
  },
});
if (values.help) {
  console.log(`Usage: node ~/.claude/hooks/capture.mjs ${USAGE}`);
  process.exit(0);
}

// the labelled fields of the text on stdin (none from a terminal)
const text = Object.fromEntries(FIELDS.map((name) => [name, ""]));
const LABEL = new RegExp(String.raw`^(${FIELDS.join("|")}):\s?(.*)$`);
let field;
for (const line of (process.stdin.isTTY ? "" : readFileSync(0, "utf8")).split("\n")) {
  const label = line.match(LABEL);
  if (label) {
    field = label[1];
    text[field] = label[2];
  } else if (field) text[field] += `\n${line}`;
}
for (const name of FIELDS) text[name] = text[name].trim();

const wrong = [
  !KINDS.includes(values.kind) && `--kind is one of ${KINDS.join(", ")}`,
  !SOURCES.includes(values.source) && `--source is one of ${SOURCES.join(", ")}`,
  !text.said && !text.note && "the text on stdin needs a said: or note: line saying what happened",
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
  ...text,
};
appendFileSync(inbox, JSON.stringify(signal) + "\n");
const count = readFileSync(inbox, "utf8").split("\n").filter(Boolean).length;
console.log(`captured ${values.kind} signal ${signal.id} in ${inbox} (${count} there now)`);

if (values.source === "lessons") {
  // the branch's lessons file; outside a checkout, or on a detached HEAD,
  // there's none, and the signal stands alone
  let file;
  try {
    const work = workOf(process.cwd(), { session_id: signal.session });
    if (work) file = stateFile(process.cwd(), "lessons", work.key);
    if (file && !existsSync(file)) appendFileSync(file, `Signals for ${work.branch}:\n`);
  } catch {
    file = undefined;
  }
  if (file) {
    appendFileSync(file, `- ${(text.note || text.said).replace(/\s+/g, " ")} → inbox ${signal.id}\n`);
    console.log(`and its line in ${file}`);
  }
}
