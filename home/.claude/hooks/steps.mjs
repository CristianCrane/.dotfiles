// Where one agent's time and tokens went, step by step, from its
// transcript: usage.mjs records it at each of the agent's stops and puts an
// agent's tree of them together after its Tokens line; reads.mjs uses
// `reads` to see a builder's reads go one per step.
//
// A step is one assistant message (one message spans several transcript
// lines with the same id and usage: `counted` takes each once). At each
// step the model reads its whole context again, then calls tools or
// replies, so a step's cost is mostly its context, and the number of steps
// an agent takes decides what it costs.
// - Kind: what a step did, by its first tool call (a Bash command by what
//   it mostly is, `kindOf`); a step that calls nothing replies.
// - Cost: a step's tokens, weighed by the caller's `cost` (usage.mjs's
//   WEIGHTS). `held` puts the cost of rereading the context down to what
//   put it there: the step whose output and tool results grew it (the next
//   step's context less this one's), for every later step it stays in, up
//   to a compaction; the agent's start (system prompt, tools, its brief)
//   and a compaction's summary hold the rest. So "reading: held 34%" says
//   34% of the cost went to rereading what reads brought in.
// - Time: the model's is the gap before each of its lines under 5 minutes;
//   a call's is from the call to its result (a step's calls run side by
//   side, so a step's tool time is its longest); a compaction's is its
//   compactMetadata.durationMs; a wait is a gap of 5 minutes or more that
//   ends in a message no tool sent (a task notification).
// - Stage: the `change` skill's, by the order of the agent's own calls, not
//   their wording: survey, then plan review (a change- or critical-reviewer
//   started before build), build (the first edit outside a git dir and
//   /tmp once plan review has started), review (a reviewer started after
//   build) and PR (`gh pr create`).
// - A single read is a step whose one call reads (`reads`): the change
//   skill asks for a step's reads in one turn.
import { readFileSync } from "node:fs";
import { jsonLines } from "./lib.mjs";

const GAP = 5 * 60 * 1000;

// A call that only reads, as the 2026-11-22 usage audit counts it
// (~/.claude/process/audit/2026-11-22-usage/metrics.mjs), word for word,
// so a share of single reads here sits beside its 47% builder baseline:
// Read, Grep, Glob, or a Bash command (past a leading `cd`) that starts
// with a reading command and chains no pnpm or git write.
const RO = /^(sed -n|rg|grep|cat|head|tail|command ls|ls|wc|git (show|log|diff|status|grep|blame)|gh (issue|pr) view|find|jq)\b/;
export const reads = ({ name, input }) => {
  if (["Read", "Grep", "Glob"].includes(name)) return true;
  const command = String(input?.command ?? "")
    .replace(/^cd [^;&]+(;|&&)\s*/, "")
    .trim();
  return name === "Bash" && RO.test(command) && !/[;&|]\s*(pnpm|git (commit|push|merge))/.test(command);
};

// a Bash command that doesn't only read: the first kind whose rule
// matches, heredoc bodies included (a node script that writes a file is an
// edit). A loop waiting on a test's log (`until rg -q '^rc=' log`) is the
// test's time
const BASH = [
  ["CI", /\bgh\s+(pr\s+checks|run\s+(watch|view))\b/],
  ["tests", /\buntil\b[\s\S]*\b(rc|RC)=|\b(vitest|playwright|test:change|test:quick|pr:shots|node\s+--test|pnpm\s+(-\S+\s+)*test)\b/],
  ["waits", /\buntil\b|\bsleep\s+\d|\bwait\b/],
  ["checks", /\b(lint|tsc|typecheck|prettier|eslint|pnpm\s+(-\S+\s+)*(check|build))\b/],
  ["git", /\bgit\s+(add|commit|push|rebase|merge|cherry-pick|reset|checkout|worktree|fetch|pull)\b|\bgh\s+(pr|issue)\s+(create|edit|comment|ready|close)\b/],
  ["edits", /writeFileSync|\bsed\s+-i\b|(^|[;&|]\s*)cat\s*>|\btee\b|\bcp\b|\bmv\b|\brm\b/],
];

const TOOLS = {
  reading: ["Read", "Grep", "Glob"],
  web: ["WebFetch", "WebSearch"],
  edits: ["Edit", "Write", "MultiEdit", "NotebookEdit"],
  agents: ["Agent", "Task", "SendMessage", "TaskStop", "TaskOutput"],
  setup: ["Skill", "ToolSearch"],
  waits: ["Monitor"],
};

export const kindOf = (call) =>
  reads(call)
    ? "reading"
    : call.name === "Bash"
      ? (BASH.find(([, rule]) => rule.test(String(call.input?.command ?? "")))?.[0] ?? "other bash")
      : (Object.entries(TOOLS).find(([, names]) => names.includes(call.name))?.[0] ?? "other tools");

// a message's usage as the ledger's token counts; cacheWrite1h only when
// the usage splits its cache writes (usage.mjs's `cost` weighs a row
// without one by who wrote it)
export const tokensOf = (usage) => ({
  cacheRead: usage.cache_read_input_tokens ?? 0,
  cacheWrite: usage.cache_creation_input_tokens ?? 0,
  ...(usage.cache_creation && { cacheWrite1h: usage.cache_creation.ephemeral_1h_input_tokens ?? 0 }),
  output: usage.output_tokens ?? 0,
  input: usage.input_tokens ?? 0,
});

// the context a message read: everything sent, cached or not
export const contextOf = (tokens) => tokens.input + tokens.cacheRead + tokens.cacheWrite;

// a step whose one call reads: the change skill asks for a step's reads in one turn
export const single = (step) => step.calls.length === 1 && reads(step.calls[0]);

// a transcript line of an assistant message with its tokens counted (Claude
// Code's own `<synthetic>` replies cost nothing)
export const counted = (row) => row.type === "assistant" && Boolean(row.message?.usage) && row.message.model !== "<synthetic>";

export const STAGES = ["survey", "plan review", "build", "review", "PR"];
const REVIEWERS = ["change-reviewer", "critical-reviewer"];

// the stage a call starts, given the stages already started
const stageAt = ({ name, input }, started) => {
  // a phase run as a fresh agent (the change skill's Phases): the build's
  // reading the plan review, and a reviewer named a diff review's output
  if (name === "Read" && !started.has("build") && /\/claude\/plan-review-/.test(String(input?.file_path))) return "plan review";
  if (name === "Agent" && REVIEWERS.includes(input?.subagent_type) && /\/claude\/review-/.test(String(input?.prompt))) return "review";
  if (name === "Agent" && REVIEWERS.includes(input?.subagent_type)) return started.has("build") ? "review" : "plan review";
  if (TOOLS.edits.includes(name) && started.has("plan review") && !/\/\.git\/|^\/tmp\//.test(String(input?.file_path))) return "build";
  if (name === "Bash" && /\bgh\s+pr\s+create\b/.test(String(input?.command))) return "PR";
};

const group = () => ({ steps: 0, calls: 0, modelMs: 0, toolMs: 0, cost: 0, held: 0 });
const bump = (groups, key) => (groups[key] ??= group());
// a profile's numbers as whole numbers, for a ledger row
const whole = (groups) => Object.fromEntries(Object.entries(groups).map(([key, numbers]) => [key, Object.fromEntries(Object.entries(numbers).map(([name, n]) => [name, Math.round(n)]))]));

// One agent's profile from its transcript's rows: its span, steps, time,
// cost (by `cost`, a function of a message's token counts), single reads,
// by kind of step and by stage, its stages' starts, and the agents it
// started by type.
export const profileOf = (rows, cost) => {
  const steps = [];
  const byId = new Map();
  const calls = new Map();
  let last = null;
  let compacted = false;
  const span = { from: null, to: null, waitMs: 0, compactions: 0, compactMs: 0 };
  for (const row of rows) {
    const at = Date.parse(row.timestamp);
    if (Number.isNaN(at)) continue;
    const gap = last === null ? 0 : at - last;
    last = at;
    span.from ??= at;
    span.to = at;
    if (row.type === "system" && row.subtype === "compact_boundary") {
      compacted = true;
      span.compactions++;
      span.compactMs += row.compactMetadata?.durationMs ?? gap;
      continue;
    }
    if (row.type === "user") {
      const content = row.message?.content;
      const results = Array.isArray(content) ? content.filter((part) => part.type === "tool_result") : [];
      for (const part of results) {
        const call = calls.get(part.tool_use_id);
        if (call && call.ms === undefined) call.ms = at - call.at;
      }
      if (!results.length && gap >= GAP) span.waitMs += gap;
      continue;
    }
    if (!counted(row)) continue;
    let step = byId.get(row.message.id);
    if (!step) {
      const { output, ...tokens } = tokensOf(row.message.usage);
      step = {
        at,
        modelMs: 0,
        calls: [],
        afterCompaction: compacted,
        context: contextOf(tokens),
        reread: cost({ ...tokens, output: 0 }),
        output: cost({ input: 0, cacheWrite: 0, cacheWrite1h: 0, cacheRead: 0, output }),
      };
      compacted = false;
      byId.set(row.message.id, step);
      steps.push(step);
    }
    if (gap < GAP) step.modelMs += gap;
    for (const part of row.message.content ?? [])
      if (part.type === "tool_use") {
        const call = { name: part.name, input: part.input, at };
        call.kind = kindOf(call);
        calls.set(part.id, call);
        step.calls.push(call);
      }
  }
  const kinds = {};
  const stages = {};
  const started = new Map();
  const agents = {};
  let origin = {};
  let singleReads = 0;
  const total = group();
  steps.forEach((step, i) => {
    step.kind = step.calls[0]?.kind ?? "replies";
    if (single(step)) singleReads++;
    for (const call of step.calls) {
      const stage = stageAt(call, started);
      if (stage && !started.has(stage)) started.set(stage, call.at);
      if (call.name === "Agent") {
        const type = call.input?.subagent_type ?? "general-purpose";
        agents[type] = (agents[type] ?? 0) + 1;
      }
    }
    // what the context holds, by the kind of step that put it there; the
    // agent's start stays through a compaction, and the rest after one is
    // its summary and what it re-attaches
    if (i === 0) origin = { start: step.context };
    else if (step.afterCompaction) origin = { start: Math.min(steps[0].context, step.context), "compaction summaries": Math.max(0, step.context - steps[0].context) };
    else {
      const before = steps[i - 1];
      const added = step.context - before.context;
      if (added > 0) origin = { ...origin, [before.kind]: (origin[before.kind] ?? 0) + added };
      else if (added < 0) {
        // a context that shrank with no compaction (a cleared tool result): each part scaled down
        const held = Object.values(origin).reduce((a, b) => a + b, 0) || 1;
        origin = Object.fromEntries(Object.entries(origin).map(([kind, n]) => [kind, (n * step.context) / held]));
      }
    }
    const context = Object.values(origin).reduce((a, b) => a + b, 0) || 1;
    for (const [kind, n] of Object.entries(origin)) bump(kinds, kind).held += (step.reread * n) / context;
    bump(kinds, step.kind).held += step.output;
    const toolMs = Math.max(0, ...step.calls.map((call) => call.ms ?? 0));
    const stage = [...started].filter(([, at]) => at <= step.at).at(-1)?.[0] ?? "survey";
    for (const into of [bump(kinds, step.kind), bump(stages, stage), total]) {
      into.steps++;
      into.modelMs += step.modelMs;
      into.cost += step.reread + step.output;
    }
    bump(stages, stage).toolMs += toolMs;
    total.toolMs += toolMs;
    for (const call of step.calls) {
      const own = bump(kinds, call.kind);
      own.calls++;
      own.toolMs += call.ms ?? 0;
    }
  });
  const { steps: count, modelMs, toolMs, cost: spent } = total;
  return {
    ...span,
    steps: count,
    modelMs,
    toolMs,
    cost: Math.round(spent),
    singleReads,
    kinds: whole(kinds),
    stages: whole(stages),
    starts: Object.fromEntries(started),
    agents,
  };
};

export const profileOfFile = (transcript, cost) => profileOf(jsonLines(readFileSync(transcript, "utf8")).rows, cost);
