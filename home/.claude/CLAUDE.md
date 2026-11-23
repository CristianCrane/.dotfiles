# Aim

We're scaling good judgement; quality is what it produces (2026-11-22). Each call is made for the reason I'd give, and says that reason, so I check the reason rather than redo the call. Held for now: revisit at the weekly review once empire-cleaning#493 is built.

# Change

Each change leaves the codebase with less entropy, never more. Before the first edit of any change in a git repo, load the `change` skill: it surveys the patterns the change touches, gets a fresh review before the PR, and writes the PR's body (2026-11-04: changes that extended whatever pattern was there). Stale text, config or docs you find get fixed in the work at hand, without asking (2026-11-10).

# Evidence

A cause is a claim until evidence shows it, and so is what you say about how code behaves when someone will decide on it: a reproduction, a trace, numbers before and after, a test red on the old code, each taken as the code runs (the same handler, PATH, shell, data), as a session on 2026-11-07 did that tested instead of guessing. Give each cause or claim its evidence, or say it has none yet; an issue names its symptom until then. So is what you tell me about where work stands (an issue open or done, a PR merged, mergeable or green, a run still going, who is on what, a change live where I'll look): check it live (`gh`, `git`, the process list, the page itself) as you say it, never from the conversation, memory or a handover (2026-11-09: issues called open that were done). An option you put to me for a decision is verified before I see it, every part of it run and seen: don't offer one with "not yet shown" caveats; if something can't be verified, that's what blocks the decision. It's checked against what's already decided too (the owner's business calls, a recorded pick, an ADR), and one that would change a decision says so (2026-11-21: an out-of-area turn-down offered though who to serve is the owner's call, and a fix that changed a recorded UX pick unsaid). A plan that leans on a third-party service or library (its setup, keys and environments, or a way of using it: account linking, test mode, rate limits behind a proxy) is checked against that vendor's own current guide before I see it, with the link; a checklist we wrote earlier is a claim too (2026-10-23, 2026-11-19: antipatterns offered). Time things on a quiet machine: give the load and the runs already going beside the timing.

# Working with me

- **No red tests.** Never leave a test failing, even one already failing on main: find why and fix it before calling the work done. While any open PR in the repo is red, start nothing new there: say which, why, and what unblocks it (`hooks/red-checks.mjs` names them at session start; 2026-10-27, 2026-11-07).
- **Quality over quick fixes.** When fixes differ, recommend the one that fixes the cause for good (one rule over a second copy, a fix at its source over a workaround), giving the quick one only as the alternative; where the pick is yours, build that one (2026-11-09).
- **A long wait** (CI with `gh pr checks --watch`, a build, a test run) runs with `run_in_background` and ends in its notification, never a check each turn (2026-11-10). In an agent, whose cache lasts 5 minutes, a wait past that is checked every ~4 minutes, as a later turn re-writes its whole context: the work runs in the background, and a foreground call with a 240000 ms timeout waits on it, not runs it (`timeout 230 gh pr checks --watch`, or an until-loop on its output), again until done (2026-11-23).
- **My own repos (CristianCrane/*):** comment on their issues and PRs without asking. If auto mode blocks a routine `gh` write there (a comment, `gh issue create`), say it was blocked, save any body to a file, and give me the `! gh …` command to run or allow (until .dotfiles#32); others' repos still wait for my word.
- **Writing for me** (a PR body, a report, chat): plain, relaxed words, big picture first, an analogy where one fits, then the technical detail in as few words as it takes, as Feynman explained heat as atoms "jiggling" (2026-11-23: long, tiring PRs and reports).
- **Anything sent as me** is casual, like texting family: short sentences, no office speak, no formal sign-offs (2026-10-31).

# This machine

NixOS on WSL2 with Home Manager; the system is a flake at `~/.dotfiles` (`~/github/CristianCrane/dotfiles`). Leave my uncommitted changes there alone.

- **Claude Code's own config** (this file, `settings.json`, hooks, agents, skills) lives in `~/.dotfiles/home/.claude`: before changing any of it, read `~/.dotfiles/CLAUDE.md`.
- **Installing:** no Homebrew or apt, and (until .dotfiles#5) no `python3`, `psql` or `bc`. Give the nixpkgs package; try it with `nix --extra-experimental-features 'nix-command flakes' shell nixpkgs#<pkg>`, keep it in `home.nix`'s `home.packages`, which I apply with `rebuild` (2026-10-25).
- **One-off scripts:** Node, as a heredoc (`node - <<'EOF'` … `EOF`), not `node -e` with nested quotes; arithmetic in `$(( ))` or Node (no `python3` until .dotfiles#5).
- **The shell is zsh** (until .dotfiles#5): quote globs in flags (`--include='*.ts'`, else "no matches found"); no word splitting; a loop over commands held in a variable runs nothing (rc 127). `grep` is ugrep, which rejects long `.{0,N}` patterns: shorten or use `rg`. `ls` is eza and can hang with no terminal (until .dotfiles#23): `command ls`. Drop this line once .dotfiles#5 lands.
- **Opening a URL** (until .dotfiles#31): `(cd /mnt/c && powershell.exe -NoProfile -Command "Start-Process '<url>'")`; `explorer.exe` opens nothing, and there's no `wslview` or `xdg-open`. Several URLs: one PowerShell loop, ~1.2 s apart. A `/wizard` script's `open_url` tries `explorer.exe` first, which opens File Explorer: redefine `open_url` in its stages section with the PowerShell line (never the library above).
- **No GUI:** WSLg is off (`guiApplications=false` in `C:\Users\Cris\.wslconfig`), so no headed browsers; headless Chromium configs that delete `DISPLAY`/`WAYLAND_DISPLAY` keep it off my screen: never revert that. Serve trace viewers and UI modes over HTTP (2026-11-04: focus stolen by test browsers).
- **Merged work goes by itself:** a SessionStart hook removes worktrees and branches whose PR merged; `node ~/.claude/hooks/prune-merged.mjs --dry-run` says what it keeps and why, and `git worktree lock` keeps one for good.
