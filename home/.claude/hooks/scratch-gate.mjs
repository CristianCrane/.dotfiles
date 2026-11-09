// Edited in github.com/CristianCrane/.dotfiles (home/.claude); user-level only, never copied into repos.
//
// Each subagent keeps its scratch files in a folder of its own,
// `<scratchpad>/agents/<agent_id>`. Claude Code gives every agent of a
// session the session's one scratchpad, so agents running at once wrote
// the same names there (test-change.log, check.log), and one nearly cited
// another branch's test run as its own (CristianCrane/.dotfiles#14, #18).
//
// SubagentStart makes the folder and names it to the agent. PreToolUse
// turns down a subagent's write to a path in the scratchpad outside its
// folder, and any command or Monitor that names such a path: what a
// command writes can't all be read from its text, so a command names the
// scratchpad one way, by the agent's own folder (lib's header says why).
// The Read tool isn't gated, so a parent's file in the scratchpad is still
// read there, or copied into the agent's folder for a command to use.
// The main session's calls carry no agent_id and go through.
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { context, deny, hook } from "./lib.mjs";

// the scratchpad's path in a command, up to a character that ends a word
const mentions = (command, root) =>
  command.match(new RegExp(`${root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\s'"\`;&|()<>]*`, "g")) ?? [];

const inside = (path, dir) => path === dir || path.startsWith(dir + "/");

hook((input) => {
  const { agent_id: agent, scratchpad_dir: root } = input;
  if (!agent || !root) return;
  const own = join(root, "agents", agent);
  mkdirSync(own, { recursive: true });
  const route = `Read a file elsewhere in the scratchpad (one your caller left) with the Read tool; when a command needs it, Write a copy into your folder and run the command on the copy.`;

  if (input.hook_event_name === "SubagentStart")
    return context(
      "SubagentStart",
      `Your own scratch folder is ${own}. Keep every scratch file there (logs, scripts, drafts, checkouts), never elsewhere in the scratchpad: the other agents of this session share it, so a file there of the same name can be theirs. A hook turns down writes in the scratchpad outside this folder, and commands that name a path there. ${route}`,
    );

  const { file_path, notebook_path, command } = input.tool_input ?? {};
  const path = file_path ?? notebook_path;
  const named = path ? [path] : command ? mentions(command, root) : [];
  const stray = named.map((found) => resolve(found)).find((found) => inside(found, root) && !inside(found, own));
  if (stray)
    return deny(
      `${stray} is in the scratchpad, outside this agent's own scratch folder, ${own}. The other agents of this session share the scratchpad, so a file there can be theirs: keep your scratch files in your folder, and name it in commands (\`S=${own}\`). ${route}`,
    );
});
