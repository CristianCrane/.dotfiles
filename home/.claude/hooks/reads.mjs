// A nudge when an agent's reads go one per turn. Each turn rereads the
// agent's whole context, so three reads sent one per turn cost three
// rereads where one turn with three calls costs one. The change skill asks
// for a step's reads in one turn, and builders didn't move on its line:
// single-read steps were 47% of builders' before it (the 2026-11-22 usage
// audit) and 59% and 57% after (two builders' transcripts, 2026-11-25). A
// line in a skill is read once at the start; this one comes at the moment.
//
// From PostToolUse on Read, Grep, Glob and Bash, in an agent only (the
// main session has its own rule on turns): when this call reads
// (steps.mjs's `reads`, the audit's rule), and the two steps before this
// one were each a single read (one call, and it reads), it adds one line
// to the agent's context, with what each turn rereads now. Steps come from
// the tail of the agent's transcript; the step this call belongs to isn't
// judged, as more of its calls may still run. It says so at most once in
// an agent's 10 steps (the last nudge's step, kept in the temp dir).
//
// What it costs: ~40 tokens a nudge, and ~45 ms on each matching call
// (node's start ~30 of it; a median of 15 on a 77 MB builder transcript,
// at a load of 0.7 on 12 cores, 2026-11-25), so ~75 s over a 9-hour
// builder's 1,679 Read, Grep, Glob and Bash calls. Replayed on two
// builders' transcripts it would have fired 106 times in 1,626 steps and
// 97 in 1,543, at a mean context of ~107k.
//
// Its registration in settings.json is a trial: four weeks from it, it is
// kept only if builders' single reads in `usage.mjs --week` have fallen
// under 47% (docs/token-review.md's open items).
import { closeSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { context, hook, jsonLines } from "./lib.mjs";
import { counted, reads } from "./steps.mjs";

const COOLDOWN = 10;
const STATE = join(tmpdir(), "claude-reads");

// the agent's transcript beside its session's: <session>/subagents/agent-<id>.jsonl
const transcriptOf = ({ transcript_path, agent_id }) => join(transcript_path.replace(/\.jsonl$/, ""), "subagents", `agent-${agent_id}.jsonl`);

// the last `want` steps of a transcript, oldest first, each its message id,
// its calls and its context's size; read from the end, a bigger tail each
// time, until it holds them or the whole file
const lastSteps = (transcript, want) => {
  const fd = openSync(transcript, "r");
  try {
    const { size } = fstatSync(fd);
    for (let bytes = 256 * 1024; ; bytes *= 4) {
      const length = Math.min(bytes, size);
      const buffer = Buffer.alloc(length);
      readSync(fd, buffer, 0, length, size - length);
      // a cut first line is unreadable, and jsonLines skips it
      const steps = new Map();
      for (const row of jsonLines(buffer.toString("utf8")).rows) {
        if (!counted(row)) continue;
        const usage = row.message.usage;
        const step = steps.get(row.message.id) ?? {
          id: row.message.id,
          calls: [],
          context: (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0),
        };
        for (const part of row.message.content ?? []) if (part.type === "tool_use") step.calls.push({ name: part.name, input: part.input });
        steps.set(step.id, step);
      }
      if (steps.size >= want || length === size) return [...steps.values()].slice(-want);
    }
  } finally {
    closeSync(fd);
  }
};

const single = (step) => step.calls.length === 1 && reads(step.calls[0]);

hook((input) => {
  if (!input.agent_id || !input.transcript_path || !reads({ name: input.tool_name, input: input.tool_input })) return;
  const steps = lastSteps(transcriptOf(input), COOLDOWN + 1);
  const [before2, before1, now] = steps.slice(-3);
  if (!now || !single(before2) || !single(before1)) return;
  const file = join(STATE, input.agent_id);
  let last = null;
  try {
    last = readFileSync(file, "utf8");
  } catch {}
  if (last && steps.slice(-COOLDOWN).some((step) => step.id === last)) return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, now.id);
  return context(
    "PostToolUse",
    `Your last two turns each sent one read, and every turn rereads your whole context (~${Math.round(now.context / 1000)}k tokens now): send the reads this step needs as several calls in one turn.`,
  );
});
