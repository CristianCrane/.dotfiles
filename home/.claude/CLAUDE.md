# Change

Each change leaves the codebase with less entropy, never more. Before the first edit of any change in a git repo, load the `change` skill: it surveys the patterns the change touches, gets a fresh review before the PR, and sets the PR's Change section. Hooks hold to it: edits wait for the survey and its plan review, `gh pr create` waits for a review with no open change findings, and a PR leaves draft once its lessons are written (the `lessons` skill).

# Evidence

A cause is a claim until evidence shows it, and so is what you say about how code behaves when someone will decide on it: a reproduction, a trace, numbers before and after, a test red on the old code, each taken as the code runs (the same handler, PATH, shell, data). Give each cause or claim its evidence, or say it has none yet; an issue names its symptom until then. Time things on a quiet machine: check the load and the test runs already going first, and give those numbers beside the timing. In long work, a line now and then says what's running, what it waits on, and the numbers so far.

That a build leaves something out (test-only code kept out of production) is a claim too: build it as the host does and count a marker in both builds' output, while building; tree-shaking guessed at was wrong three times in one day. When load order changes, check the first paint too, throttled.

# Working with me

- **No red tests.** Never leave a test failing, even one already failing on main: find why and fix it before calling the work done. While any open PR in the repo is red, start nothing new there: say which, why, and what unblocks it.
- **Finish the issue first.** Every box of the current issue before the next one, whatever a handover says, unless I say otherwise.
- **While I'm iterating on a look,** edit only: no test runs, commits or pushes per tweak. Do the full pass once I say it's right.
- **"Make a note"** while testing a ticket means a comment on its issue (what was seen, the options, "Not acted on yet."), not a code change; a bigger idea becomes its own issue, and the note points at it. Before finishing the ticket, say where each note went (a commit, or its own issue).
- **My own repos (CristianCrane/*):** comment on their issues and PRs without asking. If auto mode blocks a routine `gh` write there (a comment, `gh issue create`), say it was blocked, save any body to a file, and give me the `! gh …` command to run or allow; others' repos still wait for my word.
- **Anything sent as me** is casual, like texting family: short sentences, no office speak, no formal sign-offs.
- **A PR's checks:** a PR that conflicts with its base runs no `pull_request` CI at all, so a short list (only CodeQL's) passing means nothing; check `gh pr view <n> --json mergeable`, merge the base in, watch again.

# This machine

NixOS on WSL2 with Home Manager; the system is a flake at `~/.dotfiles` (`~/github/CristianCrane/dotfiles`). Changes there go straight to `main` once the change skill's reviews are clean, no PR. Leave my uncommitted changes there alone.

- **Installing:** no Homebrew or apt, and (until dotfiles#5) no `python3`, `psql` or `bc`. Give the nixpkgs package; try it with `nix --extra-experimental-features 'nix-command flakes' shell nixpkgs#<pkg>`, keep it in `home.nix`'s `home.packages`, which I apply with `rebuild`.
- **Claude Code's own config** (this file, `settings.json` with its `enabledPlugins`, hooks, agents, skills) is linked from `~/.dotfiles/home/.claude`: change it there and commit, not through installers that write around it. The links point at the working tree, so a hook edited on a branch there runs in every session the moment it's saved: try a hook change first in a `git worktree` of the dotfiles, feeding it hook inputs, then bring it into `~/.dotfiles`. Before naming a new skill, agent or command, search the installed plugins (`~/.claude/plugins/cache`) for the name.
- **One-off scripts:** Node, as a heredoc (`node - <<'EOF'` … `EOF`), not `node -e` with nested quotes; arithmetic in `$(( ))` or Node.
- **The shell is zsh** (until dotfiles#5): quote globs in flags (`--include='*.ts'`, else "no matches found"); no word splitting; a loop over commands held in a variable runs nothing (rc 127). `grep` is ugrep, which rejects long `.{0,N}` patterns: shorten or use `rg`. `ls` is eza and can hang with no terminal: `command ls`. Drop these lines once dotfiles#5 lands.
- **Killing a process:** `pkill -f <pattern>` or `pgrep -f … | xargs kill` kills the tool's own shell when the pattern is in the same command (exit 144). Kill by pid from `ps -eo pid,args | grep "[p]attern"`, in a command of its own.
- **Opening a URL:** `(cd /mnt/c && powershell.exe -NoProfile -Command "Start-Process '<url>'")`; `explorer.exe` opens nothing, and there's no `wslview` or `xdg-open`. Several URLs: one PowerShell loop, ~1.2 s apart. A `/wizard` script's `open_url` tries `explorer.exe` first, which opens File Explorer: redefine `open_url` in its stages section with the PowerShell line (never the library above). Ctrl+click in Claude Code's output does nothing for me, so give bare URLs.
- **No GUI:** WSLg is off (`guiApplications=false` in `C:\Users\Cris\.wslconfig`), so no headed browsers; headless Chromium configs that delete `DISPLAY`/`WAYLAND_DISPLAY` keep it off my screen: never revert that. Serve trace viewers and UI modes over HTTP.
- **Before timing anything,** or when tests time out for no reason, check Windows' CPU from PowerShell (`Get-Counter '\Process(*)\% Processor Time'`), not only the load average: Windows can starve WSL while it looks idle (`~/.dotfiles/configuration.nix` says why).
