// Edited in github.com/CristianCrane/.dotfiles (home/.claude); user-level only, never copied into repos.
//
// Records the tokens each agent and main session spends, so a finished
// workstream's update can say what it cost, and an audit still has the
// numbers once Claude Code deletes the transcripts (cleanupPeriodDays, 30
// days by default; keeping them longer costs disk: 917M of them in 19 days).
// From the SubagentStop and Stop hooks (`--hook`) it appends to
// ~/.claude/usage/ledger.jsonl, never a prompt or a reply:
// - a "message" row per assistant message the transcript gained since its
//   last stop (each transcript's offset is kept in usage/offsets/): its id,
//   time, session, agent, model and token counts
// - an "agent" row per agent stop: its parent, depth, type, description,
//   effort and cwd, from the input and the meta.json beside its transcript;
//   a "session" row per main session stop, with its cwd
// - a "fork" row per stop of Claude Code's own progress summary: while a
//   background agent works, every ~30 s it forks the agent for one turn to
//   summarize it (forkLabel "agent_summary", skipTranscript, in 2.1.308's
//   bundle), and that fork stops with agent_type "" and a transcript path
//   never written (seen live 2026-11-10). Its tokens are in no transcript,
//   so the report counts the forks and can't sum them. A fork names no
//   parent, so its row keeps the ids of the agents running as it stopped
//   (the input's background_tasks, ids only): one of them is the one it
//   summarized
// - an "error" row when recording fails, with the event and agent type, which
//   the report counts: a record lost can't be rebuilt once the transcript is
//   gone
// A resumed or forked session's transcript repeats the earlier one's
// messages under its own id (523 of 19,271 message ids sat in two of
// empire-cleaning's transcripts, 2026-11-10), so the report counts each
// message id once; that also absorbs a message appended twice by two stops
// at once. An agent stops up to 3 times (waiting on its own agents, then
// done): each stop reads only what's new.
//
// It is also the status line (`--status`, settings.json's statusLine): the
// model, how full the context is and its tokens, from the input Claude Code
// gives a status line. That input carries the plan's two windows too
// (`rate_limits`: five_hour and seven_day, each a used_percentage and a
// resets_at in epoch seconds; absent until a session's first reply, seen in
// 2.1.308), and each reading that differs from the last is appended to
// ~/.claude/usage/windows.jsonl.
//
// By hand:
//
//   node ~/.claude/hooks/usage.mjs --agent <id>             one workstream's Tokens line: its share of each window
//   node ~/.claude/hooks/usage.mjs [--since <YYYY-MM-DD>]   each workstream and main session since then, in token counts (default: today)
//
// A workstream is an agent with every agent it started in turn (its
// change-reviewers, say).
//
// The Tokens line is an estimate, and says "about" at each number. The readings are the
// account's, so nothing gives a workstream's own share: it is the
// workstream's ledger tokens inside the window, over all the ledger's
// tokens inside it, times the window's used %. Shares add up to the used %
// by construction, so nothing here checks the estimate yet: windows.jsonl
// keeps every reading so that two in one window can be set against the
// ledger's tokens between them. What is known to skew it:
// - WEIGHTS takes the plan to count tokens as API prices do, which nobody
//   has confirmed, and leaves the model out: a Haiku workstream beside an
//   Opus ledger would read about 5 times high. Small while one model is
//   nearly all of the ledger (claude-opus-5-5 was 98.3% of its weighted
//   tokens on 2026-11-11).
// - Use on other devices is in the used % and not in the ledger, so every
//   share here reads high by that much.
// - A session or agent still running has no rows for its tokens since its
//   last stop, so a share read while others work reads high.
// - Progress summaries are in the used % and in no transcript, and only
//   agents have them, so a workstream reads low beside a main session.
// - A window that began before the ledger's first row (2026-11-09) reads
//   high: the tokens before it are in the used % only.
import { appendFileSync, closeSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { flagsOf, hook, lines } from "./lib.mjs";

const USAGE = join(homedir(), ".claude/usage");
const LEDGER = join(USAGE, "ledger.jsonl");
const COUNTS = ["cacheRead", "cacheWrite", "output", "input"];
// what a token of each kind costs beside an input token, at API prices. A
// cache write is the 1-hour cache's (2; the 5-minute cache's is 1.25): the
// ledger doesn't keep which, and every cache write in empire-cleaning's
// transcripts was 1-hour (178.5M tokens to 0, 2026-11-11).
const WEIGHTS = { cacheRead: 0.1, cacheWrite: 2, output: 5, input: 1 };
const READINGS = join(USAGE, "windows.jsonl");
// the plan's windows as the status line's input names them, in the Tokens
// line's order
const WINDOWS = [
  { key: "seven_day", hours: 7 * 24, name: "the week" },
  { key: "five_hour", hours: 5, name: "this 5-hour window" },
];

const append = (rows, file = LEDGER) => {
  mkdirSync(USAGE, { recursive: true });
  appendFileSync(file, rows.map((row) => JSON.stringify(row) + "\n").join(""));
};

// the transcript's whole lines after `from` (from the start, if it has
// since shrunk), and the offset just past them
const unread = (transcript, from) => {
  const fd = openSync(transcript, "r");
  try {
    const { size } = fstatSync(fd);
    const start = from <= size ? from : 0;
    const buffer = Buffer.alloc(size - start);
    readSync(fd, buffer, 0, buffer.length, start);
    const end = buffer.lastIndexOf(10) + 1;
    return { text: buffer.subarray(0, end).toString("utf8"), to: start + end };
  } finally {
    closeSync(fd);
  }
};

// a row per assistant message in `text`: one message spans several lines,
// each with the same id and usage
const messages = (text, who) => {
  const rows = new Map();
  for (const line of lines(text)) {
    const { type, timestamp, message } = JSON.parse(line);
    if (type !== "assistant" || !message?.usage || message.model === "<synthetic>" || rows.has(message.id)) continue;
    const usage = message.usage;
    rows.set(message.id, {
      kind: "message",
      id: message.id,
      at: timestamp,
      ...who,
      model: message.model,
      cacheRead: usage.cache_read_input_tokens ?? 0,
      cacheWrite: usage.cache_creation_input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      input: usage.input_tokens ?? 0,
    });
  }
  return [...rows.values()];
};

const record = (input) => {
  const at = new Date().toISOString();
  const { session_id: session, agent_id: agent = null, agent_type: type, cwd } = input;
  if (agent && type === "") {
    const running = (input.background_tasks ?? []).filter((task) => task.type === "subagent" && task.status === "running");
    return append([{ kind: "fork", at, session, agent, running: running.map((task) => task.id) }]);
  }
  try {
    const transcript = agent ? input.agent_transcript_path : input.transcript_path;
    const offsetFile = join(USAGE, "offsets", `${session}-${agent ?? "main"}`);
    const { text, to } = unread(transcript, existsSync(offsetFile) ? Number(readFileSync(offsetFile, "utf8")) : 0);
    const meta = transcript.replace(/\.jsonl$/, ".meta.json");
    const { parentAgentId, spawnDepth, description } = agent && existsSync(meta) ? JSON.parse(readFileSync(meta, "utf8")) : {};
    append([
      ...messages(text, { session, agent }),
      agent
        ? {
            kind: "agent",
            at,
            session,
            agent,
            parent: parentAgentId ?? null,
            depth: spawnDepth ?? null,
            type,
            description: description ?? null,
            effort: input.effort?.level ?? null,
            cwd,
          }
        : { kind: "session", at, session, cwd },
    ]);
    mkdirSync(dirname(offsetFile), { recursive: true });
    writeFileSync(offsetFile, String(to));
  } catch (error) {
    append([{ kind: "error", at, session, agent, event: input.hook_event_name, type, error: error.message }]);
  }
};

// the ledger: each agent's and session's latest row, each message id's
// first row, and the forks and errors (a row that can't be read is one)
const ledger = () => {
  const agents = new Map();
  const sessions = new Map();
  const counted = new Map();
  const forks = [];
  let errors = 0;
  for (const line of existsSync(LEDGER) ? lines(readFileSync(LEDGER, "utf8")) : []) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      errors++;
      continue;
    }
    if (row.kind === "agent") agents.set(row.agent, row);
    else if (row.kind === "session") sessions.set(row.session, row);
    else if (row.kind === "message" && !counted.has(row.id)) counted.set(row.id, row);
    else if (row.kind === "fork") forks.push(row);
    else if (row.kind === "error") errors++;
  }
  return { agents, sessions, messages: [...counted.values()], forks, errors };
};

// the agents up from `agent` to the one the main session started
const lineage = (agents, agent) => {
  const up = [agent];
  while (agents.get(up.at(-1))?.parent) up.push(agents.get(up.at(-1)).parent);
  return up;
};

const total = (rows) =>
  rows.reduce(
    (sum, row) => {
      sum.turns++;
      for (const count of COUNTS) sum[count] += row[count];
      return sum;
    },
    { turns: 0, cacheRead: 0, cacheWrite: 0, output: 0, input: 0 },
  );

// Each window as last read, or why it can't be used. The reading that
// counts is the one of the latest window (resets_at), and in it the highest
// used %: several sessions append, and an idle one's is older.
const windowsNow = () => {
  const rows = [];
  for (const line of existsSync(READINGS) ? lines(readFileSync(READINGS, "utf8")) : []) {
    try {
      rows.push(JSON.parse(line));
    } catch {}
  }
  return WINDOWS.map(({ key, hours, name }) => {
    const read = rows.map((row) => row[key]).filter(Boolean);
    if (!read.length) return { why: `no reading of ${name} yet` };
    const resetsAt = Math.max(...read.map((window) => window.resetsAt));
    if (resetsAt * 1000 <= Date.now()) return { why: `${name} has reset since its last reading` };
    const used = Math.max(...read.filter((window) => window.resetsAt === resetsAt).map((window) => window.used));
    return { name, used, from: new Date((resetsAt - hours * 3600) * 1000), to: new Date(resetsAt * 1000) };
  });
};

const weighed = (rows) => rows.reduce((sum, row) => sum + COUNTS.reduce((cost, count) => cost + row[count] * WEIGHTS[count], 0), 0);

const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// One workstream, the agent and every agent below it, as its share of each
// of the plan's windows (the header says how far to trust it). A window
// with no reading to go by is left out and the line says why; with
// neither, the line gives the counts.
const tokensLine = (id) => {
  const { agents, messages, forks } = ledger();
  const own = messages.filter((row) => row.agent && lineage(agents, row.agent).includes(id));
  if (!own.length) return null;
  const ids = new Set(own.map((row) => row.agent));
  // forks while one of its agents ran; with others running too, the fork
  // may have summarized one of them
  const summaries = forks.filter((row) => row.running?.some((agent) => ids.has(agent))).length;
  const windows = windowsNow();
  const shares = windows
    .filter((window) => !window.why)
    .map(({ name, used, from, to }) => {
      const inside = (row) => new Date(row.at) >= from && new Date(row.at) < to;
      const mine = weighed(own.filter(inside));
      if (!mine) return `none of ${name}`;
      const share = (mine / weighed(messages.filter(inside))) * used;
      // most workstreams are under 1% of a week (a PR's whole one was 0.55%), so a share under 10% keeps a decimal
      return `${share < 0.1 ? "under 0.1%" : `about ${share < 9.95 ? share.toFixed(1) : Math.round(share)}%`} of ${name}`;
    });
  const sum = total(own);
  return (
    (shares.length
      ? `Tokens: ${shares.join(", ")}`
      : `Tokens: ${short(sum.cacheRead)} cache read, ${short(sum.cacheWrite)} cache write, ${short(sum.output)} output, ` +
        `${short(sum.input)} input over ${plural(sum.turns, "turn")}`) +
    ` (this agent${ids.size > 1 ? ` and the ${ids.size - 1} it started` : ""})` +
    windows.map((window) => (window.why ? `; ${window.why}` : "")).join("") +
    (summaries ? `; not counted: up to ${summaries} progress ${summaries === 1 ? "summary" : "summaries"} Claude Code forked while it ran` : "")
  );
};

// each workstream and main session with messages since `day`, the costliest first
const table = (day) => {
  const { agents, sessions, messages, forks, errors } = ledger();
  const from = new Date(`${day}T00:00`);
  const groups = new Map();
  for (const row of messages.filter((row) => new Date(row.at) >= from)) {
    const key = row.agent ? lineage(agents, row.agent).at(-1) : `session ${row.session}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const label = (key) => {
    if (key.startsWith("session ")) {
      const session = key.slice("session ".length);
      const cwd = sessions.get(session)?.cwd;
      return `main ${session.slice(0, 8)}${cwd ? ` ${basename(cwd)}` : ""}`;
    }
    return agents.get(key)?.description ?? key;
  };
  const rows = [...groups].map(([key, rows]) => ({
    label: label(key),
    agents: key.startsWith("session ") ? "" : String(new Set(rows.map((row) => row.agent)).size),
    ...total(rows),
  }));
  rows.sort((a, b) => COUNTS.reduce((d, count) => d + b[count] - a[count], 0));
  rows.push({ label: "total", agents: "", ...total(messages.filter((row) => new Date(row.at) >= from)) });
  const columns = [
    ["", (row) => row.label.slice(0, 44)],
    ["turns", (row) => String(row.turns)],
    ...COUNTS.map((count) => [count.replace(/[A-Z]/, (c) => ` ${c.toLowerCase()}`), (row) => short(row[count])]),
    ["agents", (row) => row.agents],
  ];
  const summaries = forks.filter((row) => new Date(row.at) >= from).length;
  const cells = [columns.map(([head]) => head), ...rows.map((row) => columns.map(([, cell]) => cell(row)))];
  const widths = columns.map((_, i) => Math.max(...cells.map((line) => line[i].length)));
  return [
    `Usage since ${day} (${LEDGER}):`,
    ...cells.map((line) => line.map((cell, i) => (i ? cell.padStart(widths[i]) : cell.padEnd(widths[i]))).join("  ")),
    summaries &&
      `Not counted: ${summaries} progress ${summaries === 1 ? "summary" : "summaries"} Claude Code forked from background agents, whose tokens no transcript holds.`,
    errors && `${plural(errors, "recording")} failed: the ledger's "error" rows say why.`,
  ]
    .filter(Boolean)
    .join("\n");
};

// printf's %.0f: a half goes to the even number, where toFixed rounds it up
const wholeHalfEven = (n) => {
  const rounded = Math.round(n);
  return Math.abs(n % 1) === 0.5 && rounded % 2 ? rounded - 1 : rounded;
};

// the plan's windows in a status line's input, as a row of windows.jsonl
// keeps them; null when it has none
const reading = (limits) => {
  const row = {};
  for (const { key } of WINDOWS) {
    const { used_percentage: used, resets_at: resetsAt } = limits?.[key] ?? {};
    if (typeof used === "number" && typeof resetsAt === "number") row[key] = { used, resetsAt };
  }
  return Object.keys(row).length ? row : null;
};

// The status line: the model in cyan, how full the context is, and its
// tokens. Input that can't be read still prints the line's frame and exits
// 1, as the jq one-liner this replaced did. The line is printed before the
// reading is saved, and a save that fails costs only the reading: the
// Tokens line then says the window has no reading, or has reset.
const status = () => {
  let input = null;
  try {
    const parsed = JSON.parse(readFileSync(0, "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) input = parsed;
  } catch {}
  const context = input?.context_window;
  const model = input ? (input.model?.display_name ?? "unknown") : "";
  const tokens = input ? (context?.total_input_tokens ?? 0) + (context?.total_output_tokens ?? 0) : "";
  process.stdout.write(`\x1b[36m${model}\x1b[0m | ctx: ${wholeHalfEven(context?.used_percentage ?? 0)}% | tokens: ${tokens}`);
  if (!input) process.exitCode = 1;
  try {
    const row = reading(input?.rate_limits);
    if (!row) return;
    // the last row, from the file's end: the status line runs after every
    // reply, and the file gains a row each time a window's used % moves
    const last = existsSync(READINGS) ? lines(unread(READINGS, Math.max(0, statSync(READINGS).size - 1024)).text).at(-1) : null;
    if (last?.replace(/^\{"at":"[^"]*",/, "{") !== JSON.stringify(row)) append([{ at: new Date().toISOString(), ...row }], READINGS);
  } catch {}
};

const { values: flags } = flagsOf("usage", "[--agent <id>] [--since <YYYY-MM-DD>]", {
  options: { hook: { type: "boolean" }, status: { type: "boolean" }, agent: { type: "string" }, since: { type: "string" } },
});

if (flags.hook) hook(record);
else if (flags.status) status();
else if (flags.agent) {
  const line = tokensLine(flags.agent);
  console.log(line ?? `No usage recorded for agent ${flags.agent}.`);
  if (!line) process.exitCode = 1;
} else {
  const day = flags.since ?? new Date().toLocaleDateString("sv");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(new Date(`${day}T00:00`).getTime())) {
    console.error(`usage: --since takes a day, YYYY-MM-DD, not ${day}`);
    process.exitCode = 1;
  } else console.log(table(day));
}
