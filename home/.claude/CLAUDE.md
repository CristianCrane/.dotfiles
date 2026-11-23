# Aim

We're scaling good judgement; quality is what it produces (2026-11-22). Each call is made for the reason I'd give, and says that reason, so I check the reason rather than redo the call. Held for now: revisit at the weekly review once empire-cleaning#493 is built.

We build for the person who uses what we make: the best experience possible for them is everyone's one goal, worked at with empathy, quality and care, by a principle's reason more than a rule's letter (2026-11-23: builders who did only their task).

# Change

Each change leaves the codebase with less entropy, never more. Before the first edit of any change in a git repo, load the `change` skill (2026-11-04: changes that extended whatever pattern was there). Stale text, config or docs you find get fixed in the work at hand, without asking (2026-11-10).

# Evidence

Say only what you've seen. A cause, a claim about how code behaves, or where work stands (an issue open or done, a PR merged or green, a run going, a change live) is a guess until it's shown as the code runs (a reproduction, a trace, numbers before and after, a test red on the old code, in the same shell and data) or checked live as you say it (`gh`, `git`, the page). A handover, a summary, memory or a checklist we wrote is a claim too (2026-11-07, 2026-11-09; 2026-11-23: #527's parked findings named to me from a handover, wrong). Say which claims have no evidence yet; an issue names its symptom until then. An option put to me is shown working first, as what can't be shown is what blocks it, and says what it would change of what's decided: the owner's calls, a recorded pick, an ADR (2026-11-21). A plan on a third-party service is checked against the vendor's current guide, linked (2026-10-23, 2026-11-19). A timing gives the machine's load beside it.

# Working with me

- **No red tests.** Never leave a test failing, even one already failing on main: find why and fix it before calling the work done (2026-10-27, 2026-11-07).
- **Quality over quick fixes.** When fixes differ, recommend the one that fixes the cause for good (one rule over a second copy, a fix at its source over a workaround), giving the quick one only as the alternative; where the pick is yours, build that one (2026-11-09).
- **A long wait** (CI, a build, a test run) runs with `run_in_background` and ends in its notification, never a check each turn (2026-11-10). An agent, whose cache lasts 5 minutes, waits past that in ~4-minute slices, the work itself in the background: a foreground `timeout 230 gh pr checks --watch`, or an until-loop on its output, again until done (2026-11-23).
- **My own repos (CristianCrane/*):** comment on their issues and PRs without asking; if auto mode blocks a routine `gh` write there, say so, save any body to a file, and give me the `! gh …` command (until .dotfiles#32). Others' repos wait for my word.
- **Writing for me** (a PR body, a report, chat): plain, relaxed words, big picture first, an analogy where one fits, then the technical detail in as few words as it takes, as Feynman explained heat as atoms "jiggling" (2026-11-23: long, tiring PRs and reports).
- **Anything sent as me** is casual, like texting family: short sentences, no office speak, no formal sign-offs (2026-10-31).

# This machine

NixOS on WSL2 with Home Manager; the system is a flake at `~/.dotfiles` (`~/github/CristianCrane/dotfiles`). Leave my uncommitted changes there alone.

- **Claude Code's own config** (this file, `settings.json`, hooks, agents, skills) lives in `~/.dotfiles/home/.claude`: before changing any of it, read `~/.dotfiles/CLAUDE.md`.
- **Installing:** no Homebrew or apt, and (until .dotfiles#5) no `python3`, `psql` or `bc`. Give the nixpkgs package; try it with `nix --extra-experimental-features 'nix-command flakes' shell nixpkgs#<pkg>`, keep it in `home.nix`'s `home.packages`, which I apply with `rebuild` (2026-10-25).
- **One-off scripts:** Node, as a heredoc (`node - <<'EOF'` … `EOF`), not `node -e` with nested quotes; arithmetic in `$(( ))` or Node.
- **The shell is zsh** (until .dotfiles#5): quote globs in flags (`--include='*.ts'`, else "no matches found"); no word splitting, so a command held in a variable runs nothing (rc 127); `echo ====` fails. `grep` is ugrep, which rejects long `.{0,N}` patterns: use `rg`. `ls` is eza and can hang with no terminal (until .dotfiles#23): `command ls`.
- **No GUI:** WSLg is off, so no headed browsers; the headless configs that delete `DISPLAY`/`WAYLAND_DISPLAY` keep test browsers off my screen, so they stay. Serve trace viewers and UI modes over HTTP (2026-11-04: focus stolen by test browsers).
- **Merged work goes by itself:** a SessionStart hook removes worktrees and branches whose PR merged; `git worktree lock` keeps one (`node ~/.claude/hooks/prune-merged.mjs --dry-run` says why each stays).
