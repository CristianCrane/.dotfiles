// Edited in github.com/CristianCrane/.dotfiles (home/.claude); user-level only, never copied into repos.
//
// `pgrep`/`pkill` matching full command lines (-f, -af, --full …) is turned
// down in a Bash or Monitor command. Claude Code runs each command inside
// `zsh -c '… eval "<command>"'`, so the command's own text, the pattern
// included, is that shell's command line, and the pattern always matches
// it: a wait loop never ends (one ran 64 minutes, CristianCrane/.dotfiles#15)
// and a kill takes down the command's own shell (exit 144). The harness has
// ways to wait, stop and find that can't match themselves.
import { deny, hook, masked } from "./lib.mjs";

// pgrep or pkill as a word, read in the masked command so a quoted mention
// (a commit message, an echo) doesn't count
const PROCESS_TOOL = /(?:^|[^\w.-])(?:pgrep|pkill)\b/g;
// a flag cluster holding f, or --full
const FULL = /(?:^|\s)(?:-[A-Za-z]*f[A-Za-z]*|--full)(?=\s|$)/;

hook((input) => {
  const command = input.tool_input?.command;
  if (!command) return;
  const hidden = masked(command);
  for (const found of hidden.matchAll(PROCESS_TOOL)) {
    // its own arguments, up to the next command
    const args = hidden.slice(found.index + found[0].length).split(/[;&|)\n]/)[0];
    if (FULL.test(args))
      return deny(
        "`pgrep -f`/`pkill -f` match this command's own shell: Claude Code runs each command inside a shell whose command line holds the command's text, pattern included, so a wait on it never ends and a kill takes down your own shell. Instead: to wait for something you started, run it with `run_in_background` and wait for its notification (or a Monitor with a time limit); to stop it, TaskStop its task or kill the pid it started as; to find another process, `ps -eo pid,args | grep '[p]attern'` (the brackets keep the pattern from matching itself), then kill by pid in a command of its own.",
      );
  }
});
