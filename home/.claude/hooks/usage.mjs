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
//   time, session, agent, model and token counts, with the part of its
//   cache write that went to the 1-hour cache (cacheWrite1h): main
//   sessions write the 1-hour cache and agents the 5-minute one, which
//   costs less (every day 2026-11-09 to 11-18). A row recorded before
//   cacheWrite1h (2026-11-18) is weighed by that: an agent's write as
//   5-minute, a main session's as 1-hour
// - a "compact" row per compaction the transcript gained: its uuid as id,
//   its trigger (auto or manual) and the context it compacted (preTokens)
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
// message id, and each compaction's, once; that also absorbs a message
// appended twice by two stops at once. An agent stops up to 3 times (waiting on its own agents, then done): each
// stop reads only what's new.
//
// From the SessionStart hook (`--hook` too) it says when the weekly token
// review is due: in a main session's startup (not a resume, clear, compact
// or an agent) once 7 days have passed since both the newest entry of the
// review's log (docs/token-review.md in the dotfiles, found from this
// file's real path, so a worktree's copy reads its own) and the last time
// it said so (usage/review-offered). Once a week, then, whether or not the
// review runs; otherwise it reads two small files and prints nothing.
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
//   node ~/.claude/hooks/usage.mjs [--since <YYYY-MM-DD>]   each workstream and main session since then, in token counts and weighted (default: today)
//   node ~/.claude/hooks/usage.mjs --week [--since <YYYY-MM-DD>]   the weekly review's measures: the 7 days from then beside the 7 before (default: the 7 days before today)
//
// A workstream is an agent with every agent it started in turn (its
// change-reviewers, say).
//
// The weekly report is the same measures every week, so one week can be
// set against another. Exact: active days, context per turn, agents,
// compactions, progress summaries, and merged PRs (gh's search for the account's own,
// in every repo). Estimates: every weighted number (WEIGHTS below) and the
// tokens per 1% of a window (the Tokens line's skews, below). Weighted per
// merged PR is the week's whole spend over the PRs merged in it, so work
// with no PR (a repo with no GitHub origin) and PRs merged a week after
// their work both move it.
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
import { execFileSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { CLAUDE } from "./copy.mjs";
import { context, flagsOf, hook, lines } from "./lib.mjs";

const USAGE = join(homedir(), ".claude/usage");
const LEDGER = join(USAGE, "ledger.jsonl");
const COUNTS = ["cacheRead", "cacheWrite", "output", "input"];
// what a token of each kind costs beside an input token, at API prices: a
// cache write at the 5-minute cache's rate, and its 1-hour part at that
// cache's
const WEIGHTS = { cacheRead: 0.1, cacheWrite: 1.25, cacheWrite1h: 2, output: 5, input: 1 };
const READINGS = join(USAGE, "windows.jsonl");
// the weekly review's log, and when the hook last said a review was due
const LOG = join(CLAUDE, "../../docs/token-review.md");
const OFFERED = join(USAGE, "review-offered");
const DAY = 24 * 3600 * 1000;
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

// a row per assistant message in `text` (one message spans several lines,
// each with the same id and usage) and per compaction
const messages = (text, who) => {
  const rows = new Map();
  for (const line of lines(text)) {
    const { type, subtype, uuid, timestamp, message, compactMetadata } = JSON.parse(line);
    if (type === "system" && subtype === "compact_boundary") {
      rows.set(uuid, { kind: "compact", id: uuid, at: timestamp, ...who, trigger: compactMetadata?.trigger ?? null, preTokens: compactMetadata?.preTokens ?? null });
      continue;
    }
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
      ...(usage.cache_creation && { cacheWrite1h: usage.cache_creation.ephemeral_1h_input_tokens ?? 0 }),
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
// first row, each compaction's, and the forks and errors (a row that can't be read
// is one)
const ledger = () => {
  const agents = new Map();
  const sessions = new Map();
  const counted = new Map();
  const compactions = new Map();
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
    else if (row.kind === "compact" && !compactions.has(row.id)) compactions.set(row.id, row);
    else if (row.kind === "fork") forks.push(row);
    else if (row.kind === "error") errors++;
  }
  return { agents, sessions, messages: [...counted.values()], compactions: [...compactions.values()], forks, errors };
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

// every reading of the plan's windows kept, a row that can't be read left out
const readings = () => {
  const rows = [];
  for (const line of existsSync(READINGS) ? lines(readFileSync(READINGS, "utf8")) : []) {
    try {
      rows.push(JSON.parse(line));
    } catch {}
  }
  return rows;
};

// when the plan's window `key` that resets at `resetsAt` (epoch seconds) began
const windowFrom = (key, resetsAt) => new Date((resetsAt - WINDOWS.find((window) => window.key === key).hours * 3600) * 1000);

// Each window as last read, or why it can't be used. The reading that
// counts is the one of the latest window (resets_at), and in it the highest
// used %: several sessions append, and an idle one's is older.
const windowsNow = () => {
  const rows = readings();
  return WINDOWS.map(({ key, name }) => {
    const read = rows.map((row) => row[key]).filter(Boolean);
    if (!read.length) return { why: `no reading of ${name} yet` };
    const resetsAt = Math.max(...read.map((window) => window.resetsAt));
    if (resetsAt * 1000 <= Date.now()) return { why: `${name} has reset since its last reading` };
    const used = Math.max(...read.filter((window) => window.resetsAt === resetsAt).map((window) => window.used));
    return { name, used, from: windowFrom(key, resetsAt), to: new Date(resetsAt * 1000) };
  });
};

// what a message cost, in input tokens; a row with no split (recorded
// before it) is weighed by who wrote it, as the header says
const cost = (row) =>
  COUNTS.reduce((sum, count) => sum + row[count] * WEIGHTS[count], 0) +
  (row.cacheWrite1h ?? (row.agent ? 0 : row.cacheWrite)) * (WEIGHTS.cacheWrite1h - WEIGHTS.cacheWrite);

const weighed = (rows) => rows.reduce((sum, row) => sum + cost(row), 0);

// groups of rows (each with its `rows`), each given its weighed cost, the costliest first
const costliest = (groups) => groups.map((group) => ({ ...group, cost: weighed(group.rows) })).sort((a, b) => b.cost - a.cost);

// whether a row is from `from` up to `to`
const within =
  ({ from, to }) =>
  (row) =>
    new Date(row.at) >= from && new Date(row.at) < to;

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
      const inside = within({ from, to });
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

// the workstreams and main sessions `rows` belong to, each with its label,
// its messages and how many agents it ran (none for a main session)
const workstreams = (rows, { agents, sessions }) => {
  const groups = Map.groupBy(rows, (row) => (row.agent ? lineage(agents, row.agent).at(-1) : `session ${row.session}`));
  return [...groups].map(([key, rows]) => {
    if (!key.startsWith("session ")) return { label: agents.get(key)?.description ?? key, agents: new Set(rows.map((row) => row.agent)).size, rows };
    const session = key.slice("session ".length);
    const cwd = sessions.get(session)?.cwd;
    return { label: `main ${session.slice(0, 8)}${cwd ? ` ${basename(cwd)}` : ""}`, agents: 0, rows };
  });
};

// lines of cells in columns: the first padded on the right, the rest on the left
const columns = (cells) => {
  if (!cells.length) return [];
  const widths = cells[0].map((_, i) => Math.max(...cells.map((line) => line[i].length)));
  return cells.map((line) => line.map((cell, i) => (i ? cell.padStart(widths[i]) : cell.padEnd(widths[i]))).join("  "));
};

// each workstream and main session with messages since `day`, the costliest first
const table = (day) => {
  const { agents, sessions, messages, forks, errors } = ledger();
  const from = new Date(`${day}T00:00`);
  const since = messages.filter((row) => new Date(row.at) >= from);
  const rows = costliest(workstreams(since, { agents, sessions })).map(({ label, agents, rows, cost }) => ({ label, agents: agents ? String(agents) : "", cost, ...total(rows) }));
  rows.push({ label: "total", agents: "", cost: weighed(since), ...total(since) });
  const fields = [
    ["", (row) => row.label.slice(0, 44)],
    ["turns", (row) => String(row.turns)],
    ...COUNTS.map((count) => [count.replace(/[A-Z]/, (c) => ` ${c.toLowerCase()}`), (row) => short(row[count])]),
    ["weighted", (row) => short(row.cost)],
    ["agents", (row) => row.agents],
  ];
  const summaries = forks.filter((row) => new Date(row.at) >= from).length;
  return [
    `Usage since ${day} (${LEDGER}):`,
    ...columns([fields.map(([head]) => head), ...rows.map((row) => fields.map(([, cell]) => cell(row)))]),
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

// the day `days` after `date`'s, at the same local time
const later = (date, days) => {
  const day = new Date(date);
  day.setDate(day.getDate() + days);
  return day;
};

const stamp = (date) => new Date(date).toLocaleString("sv").slice(0, 16);

const percent = (part, whole) => (whole ? `${((100 * part) / whole).toFixed(1)}%` : "-");

// the PRs the gh account's user merged in [from, to), in every repo, per
// repo; or why gh can't say
const mergedPRs = (from, to) => {
  const at = (date) => date.toISOString().replace(/\.\d+Z$/, "Z");
  try {
    const found = JSON.parse(
      execFileSync("gh", ["search", "prs", "--author=@me", "--merged-at", `${at(from)}..${at(new Date(to - 1000))}`, "--limit", "1000", "--json", "repository"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 60_000,
      }),
    );
    const repos = new Map();
    for (const { repository } of found) repos.set(repository.nameWithOwner, (repos.get(repository.nameWithOwner) ?? 0) + 1);
    return { count: found.length, repos };
  } catch (error) {
    return { why: `gh couldn't say: ${(error.stderr || error.message || "").trim().split("\n")[0]}` };
  }
};

// The weekly review's measures (the header says which are estimates): the
// 7 days from `day` beside the 7 before, then this week's merged PRs per
// repo, its costliest workstreams, its cost per agent type, and the
// plan's seven_day windows that overlap it, each with the ledger's
// weighted tokens per 1% of it.
const week = (day) => {
  const book = ledger();
  const { agents, messages, compactions, forks, errors } = book;
  const from = new Date(`${day}T00:00`);
  const periods = [
    { from, to: later(from, 7) },
    { from: later(from, -7), to: from },
  ];
  const measured = periods.map((period) => {
    const rows = messages.filter(within(period));
    const main = rows.filter((row) => !row.agent);
    const days = new Set(rows.map((row) => new Date(row.at).toLocaleDateString("sv"))).size;
    const context = main.map((row) => row.cacheRead + row.cacheWrite + row.input).sort((a, b) => a - b);
    const auto = compactions.filter(within(period)).filter((row) => row.trigger === "auto");
    const compacted = auto.map((row) => row.preTokens).filter(Number.isFinite).sort((a, b) => a - b);
    const all = weighed(rows);
    const prs = mergedPRs(period.from, period.to);
    const cells = [
      ["weighted tokens", short(all)],
      ["  per active day", days ? short(all / days) : "-"],
      ["active days", String(days)],
      ["main sessions' share", percent(weighed(main), all)],
      ["main context per turn: mean", context.length ? short(context.reduce((sum, n) => sum + n, 0) / context.length) : "-"],
      ["  p95 / max", context.length ? `${short(context[Math.floor(0.95 * context.length)])} / ${short(context.at(-1))}` : "-"],
      ["agents per active day", days ? (new Set(rows.filter((row) => row.agent).map((row) => row.agent)).size / days).toFixed(1) : "-"],
      ["auto-compactions (in agents)", `${auto.length} (${auto.filter((row) => row.agent).length})`],
      ["  context compacted, median", compacted.length ? short(compacted[Math.floor(compacted.length / 2)]) : "-"],
      ["merged PRs", prs.why ? "-" : String(prs.count)],
      ["weighted per merged PR", prs.count ? short(all / prs.count) : "-"],
      ["progress summaries not counted", String(forks.filter(within(period)).length)],
    ];
    return { rows, all, prs, cells };
  });
  const [now] = measured;
  const head = ({ from, to }) => `${stamp(from).slice(0, 10)}..${stamp(later(to, -1)).slice(0, 10)}`;
  const first = messages.map((row) => row.at).sort()[0];
  const types = Map.groupBy(now.rows, (row) => (row.agent ? (agents.get(row.agent)?.type ?? "unknown") : "main sessions"));
  // each seven_day window that overlaps this week, at its highest reading
  const windows = new Map();
  for (const reading of readings().filter((reading) => reading.seven_day)) {
    const { resetsAt, used } = reading.seven_day;
    const start = windowFrom("seven_day", resetsAt);
    if (start >= periods[0].to || resetsAt * 1000 <= from.getTime()) continue;
    const best = windows.get(resetsAt);
    if (!best || used >= best.used) windows.set(resetsAt, { start, used, at: new Date(reading.at) });
  }
  const readLines = [...windows].map(([resetsAt, { start, used, at }]) => {
    const spent = weighed(messages.filter(within({ from: start, to: at })));
    return (
      `  to ${stamp(resetsAt * 1000)}: ${used}% at ${stamp(at)}; ${short(spent)} weighted by then, ${used ? `about ${short(spent / used)}` : "-"} per 1%` +
      (first && new Date(first) > start ? " (began before the ledger: reads low)" : "")
    );
  });
  return [
    `Week of ${head(periods[0])} beside the week before (${LEDGER}; weighted numbers are estimates, see usage.mjs's header):`,
    ...columns([["", head(periods[0]), head(periods[1])], ...now.cells.map(([name], i) => [name, ...measured.map(({ cells }) => cells[i][1])])]),
    first && new Date(first) > periods[1].from && `The ledger's first row is ${stamp(first)}: the weeks before it read low.`,
    errors && `${plural(errors, "recording")} failed: the ledger's "error" rows say why.`,
    "",
    now.prs.why ? `Merged PRs: ${now.prs.why}` : `Merged PRs: ${[...now.prs.repos].map(([repo, n]) => `${repo} ${n}`).join(", ") || "none"}`,
    "",
    "Costliest workstreams this week (weighted, share):",
    ...columns(
      costliest(workstreams(now.rows, book))
        .slice(0, 5)
        .map(({ label, agents, cost }) => [`  ${label.slice(0, 60)}${agents ? ` (${plural(agents, "agent")})` : ""}`, short(cost), percent(cost, now.all)]),
    ),
    "",
    "Cost by agent type this week (weighted, share, agents):",
    ...columns(
      costliest([...types].map(([type, rows]) => ({ type, rows }))).map(({ type, rows, cost }) => [
        `  ${type}`,
        short(cost),
        percent(cost, now.all),
        type === "main sessions" ? "" : String(new Set(rows.map((row) => row.agent)).size),
      ]),
    ),
    "",
    "The plan's week (seven_day) as read, with the ledger's weighted tokens from its start to that reading:",
    ...(readLines.length ? readLines : ["  no reading"]),
  ]
    .filter((line) => typeof line === "string")
    .join("\n");
};

// At a main session's startup, a line for Claude when the weekly review is
// due (the header says when), and the time it said so
const reviewDue = (input) => {
  if (input.source !== "startup" || input.agent_id || input.agent_type) return;
  const entries = [...readFileSync(LOG, "utf8").matchAll(/^### (\d{4}-\d{2}-\d{2})/gm)].map(([, day]) => day).sort();
  const offered = existsSync(OFFERED) ? Date.parse(readFileSync(OFFERED, "utf8")) || 0 : 0;
  const last = entries.at(-1);
  if (Date.now() - Math.max(offered, last ? new Date(`${last}T00:00`).getTime() : 0) < 7 * DAY) return;
  mkdirSync(USAGE, { recursive: true });
  writeFileSync(OFFERED, new Date().toISOString());
  return context(
    "SessionStart",
    `The weekly token review is due: ${last ? `the last entry in ${LOG} is from ${last}` : `${LOG} has no entry yet`}. ` +
      `In your first reply, offer the user to run it; on their yes, start the agents that file's "Running a review" names. This is said once a week.`,
  );
};

const { values: flags } = flagsOf("usage", "[--agent <id>] [--week] [--since <YYYY-MM-DD>]", {
  options: { hook: { type: "boolean" }, status: { type: "boolean" }, agent: { type: "string" }, week: { type: "boolean" }, since: { type: "string" } },
});

if (flags.hook) hook((input) => (input.hook_event_name === "SessionStart" ? reviewDue(input) : record(input)));
else if (flags.status) status();
else if (flags.agent) {
  const line = tokensLine(flags.agent);
  console.log(line ?? `No usage recorded for agent ${flags.agent}.`);
  if (!line) process.exitCode = 1;
} else {
  // the week defaults to the 7 days before today, the table to today
  const day = flags.since ?? later(new Date(), flags.week ? -7 : 0).toLocaleDateString("sv");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(new Date(`${day}T00:00`).getTime())) {
    console.error(`usage: --since takes a day, YYYY-MM-DD, not ${day}`);
    process.exitCode = 1;
  } else console.log(flags.week ? week(day) : table(day));
}
