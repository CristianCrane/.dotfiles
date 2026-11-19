# Change

Each change leaves the codebase with less entropy, never more. Before the first edit of any change in a git repo, load the `change` skill: it surveys the patterns the change touches, gets a fresh review before the PR, and sets the PR's body (Problem, Fix, the lines to check, screenshots or tests, Change collapsed). Stale text, config or docs you find get fixed in the work at hand, without asking.

# Evidence

A cause is a claim until evidence shows it, and so is what you say about how code behaves when someone will decide on it: a reproduction, a trace, numbers before and after, a test red on the old code, each taken as the code runs (the same handler, PATH, shell, data). Give each cause or claim its evidence, or say it has none yet; an issue names its symptom until then. An option you put to me for a decision is verified before I see it, every part of it run and seen: don't offer one with "not yet shown" caveats; if something can't be verified, that's what blocks the decision. Time things on a quiet machine: give the load, the runs already going and Windows' CPU (`Get-Counter '\Process(*)\% Processor Time'`: Windows can starve WSL while it looks idle) beside the timing.

# Working with me

- **No red tests.** Never leave a test failing, even one already failing on main: find why and fix it before calling the work done. While any open PR in the repo is red, start nothing new there: say which, why, and what unblocks it.
- **Quality over quick fixes.** When fixes differ, recommend the one that fixes the cause for good (one rule over a second copy, a fix at its source over a workaround), giving the quick one only as the alternative; where the pick is yours, build that one.
- **A long wait** (CI with `gh pr checks --watch`, a build, a test run) runs with `run_in_background` and ends in its notification, never a check each turn.
- **My own repos (CristianCrane/*):** comment on their issues and PRs without asking. If auto mode blocks a routine `gh` write there (a comment, `gh issue create`), say it was blocked, save any body to a file, and give me the `! gh …` command to run or allow; others' repos still wait for my word.
- **Anything sent as me** is casual, like texting family: short sentences, no office speak, no formal sign-offs.

# This machine

NixOS on WSL2 with Home Manager; the system is a flake at `~/.dotfiles` (`~/github/CristianCrane/dotfiles`). Leave my uncommitted changes there alone.

- **Claude Code's own config** (this file, `settings.json`, hooks, agents, skills) lives in `~/.dotfiles/home/.claude`, linked to its working tree: a hook saved there runs in every session at once. Before changing any of it, read `~/.dotfiles/CLAUDE.md`.
- **Installing:** no Homebrew or apt, and (until .dotfiles#5) no `python3`, `psql` or `bc`. Give the nixpkgs package; try it with `nix --extra-experimental-features 'nix-command flakes' shell nixpkgs#<pkg>`, keep it in `home.nix`'s `home.packages`, which I apply with `rebuild`.
- **One-off scripts:** Node, as a heredoc (`node - <<'EOF'` … `EOF`), not `node -e` with nested quotes; arithmetic in `$(( ))` or Node.
- **The shell is zsh** (until .dotfiles#5): quote globs in flags (`--include='*.ts'`, else "no matches found"); no word splitting; a loop over commands held in a variable runs nothing (rc 127). `grep` is ugrep, which rejects long `.{0,N}` patterns: shorten or use `rg`. `ls` is eza and can hang with no terminal: `command ls`. Drop these lines once .dotfiles#5 lands.
- **Opening a URL** (until .dotfiles#5): `(cd /mnt/c && powershell.exe -NoProfile -Command "Start-Process '<url>'")`; `explorer.exe` opens nothing, and there's no `wslview` or `xdg-open`. Several URLs: one PowerShell loop, ~1.2 s apart.
- **No GUI:** WSLg is off (`guiApplications=false` in `C:\Users\Cris\.wslconfig`), so no headed browsers; headless Chromium configs that delete `DISPLAY`/`WAYLAND_DISPLAY` keep it off my screen: never revert that. Serve trace viewers and UI modes over HTTP.
- **Merged work goes by itself:** a SessionStart hook removes worktrees and branches whose PR merged; `node ~/.claude/hooks/prune-merged.mjs --dry-run` says what it keeps and why, and `git worktree lock` keeps one for good. Another fast-forwards `~/.dotfiles` to `origin/main` at every session start, so a merged dotfiles PR's `home/.claude` is live from the next session; its Nix config changes need `rebuild`, which that hook's line names.
