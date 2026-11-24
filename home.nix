{ config, pkgs, lib, inputs, ... }:

let
  dotfiles = "${config.home.homeDirectory}/.dotfiles";
  # the skill folders the flake holds (git-tracked), read at build time, so
  # a skill added or removed changes the build and claudeSettings runs again
  # on the next `rebuild`; a glob over ${dotfiles} left the build the same
  skills = builtins.attrNames
    (lib.filterAttrs (_: type: type == "directory") (builtins.readDir ./home/.claude/skills));
in

{
  home.stateVersion = "26.05";

  home.packages = with pkgs; [
    ripgrep     # fast search
    fd          # fast find
    git
    neovim
    curl
    wget 
    fzf         # fuzzy finder
    jq          # json on the command line
    zip
    unzip
    zstd        # .zst compression
    _7zz        # 7-zip: .7z, .rar, and other formats
    # stripe listen/trigger for local webhooks; nixpkgs lags upstream, so pin a newer release
    (stripe-cli.overrideAttrs (finalAttrs: old: {
      version = "1.55.6";
      src = old.src.override {
        tag = "v${finalAttrs.version}";
        hash = "sha256-AyUCdvZPsS7cQsBGUjNhiiArA037Cyin+dcJ1Z61GV4=";
      };
      vendorHash = "sha256-pgL25vTwQcpwljwqEKdUar8sjJS8YYPWpBBCnGh08+o=";
    }))
    lazygit
    inputs.herdr.packages.${pkgs.stdenv.hostPlatform.system}.default
    nodejs
    pnpm
    stdenv.cc
    pkg-config
    vtsls       # typescript lsp
    lua-language-server
    tree-sitter # cli parser generator required by nvim-treesitter
    gnumake
    cmake
    inputs.nix-claude-code.packages.${pkgs.stdenv.hostPlatform.system}.default
  ];

  fonts.fontconfig.enable = true;
  
  home.sessionVariables = {
    EDITOR = "nvim";
    EZA_COLORS = "reset:da=38;2;248;215;117:di=38;2;248;215;117:fi=0:ex=0";
  };

  programs.git = {
    enable = true;
    settings.user.name = "Cris Crane";
    settings.user.email = "12250662+CristianCrane@users.noreply.github.com";
    settings.init.defaultBranch = "main";
    # a checkout's own Claude settings reach no commit or PR, so branch-first
    # (home/.claude/hooks/lib.mjs, beforeEdit) leaves their edits alone on main
    ignores = [ ".claude/settings.local.json" ];
  };
  
  programs.eza = {
    enable = true;
    enableZshIntegration = true;
    icons = "auto";
  };

  programs.zsh = {
    enable = true;
    autosuggestion.enable = true;
    syntaxHighlighting.enable = true;
    shellAliases = {
      ".." = "cd ..";
      gs = "git status";
      ga = "git add .";
      gc = ''gc() { git commit -m "$1" }; gc'';
      push = "git push";
      pull = "git pull";
      rebuild = "~/.dotfiles/rebuild.sh";
      l = ''eza --long -F -a --group-directories-first --no-permissions --no-user --no-time --no-filesize'';
      q = "exit";
    };
    # hide the WSLg display so headless tools don't wake msrdc and steal windows focus.
    # run gui apps / headed playwright with: gui <cmd>
    initContent = ''
      unset DISPLAY WAYLAND_DISPLAY
      gui() { DISPLAY=:0 WAYLAND_DISPLAY=wayland-0 "$@" }

      # Claude Code runs no hook when ~/.claude/settings.json is damaged
      # (empty or holding null bytes, as a machine stop leaves a file) or
      # gone, and a damaged hooks/main-session.mjs can't warn of itself, so
      # this checks both first. It won't start Claude Code then, as its full
      # screen would hide a warning; `command claude` starts it anyway. Not
      # for nvim's claudecode, which runs claude with no shell.
      claude() {
        local f crash=() other=() restore=() relink=() cost on=
        for f in settings.json hooks/main-session.mjs; do
          if [[ ! -e ~/.dotfiles/home/.claude/$f ]]; then
            other+=("~/.claude/$f is deleted in ~/.dotfiles") restore+=(home/.claude/$f) on=1
          elif [[ ! -e ~/.claude/$f ]]; then
            other+=("~/.claude/$f isn't linked") relink+=("~/.claude/$f")
          elif [[ ! -s ~/.claude/$f ]]; then
            crash+=("~/.claude/$f is empty") restore+=(home/.claude/$f)
          elif [[ $(<~/.claude/$f) == *$'\0'* ]]; then
            crash+=("~/.claude/$f holds null bytes") restore+=(home/.claude/$f)
          else
            continue
          fi
          [[ $f == settings.json ]] && cost="any of your hooks"
        done
        (( $#crash + $#other )) || { command claude "$@"; return }
        local said=() it=it
        (( $#crash )) && said+=("''${(j: and :)crash}, likely from a crash")
        (( $#other )) && said+=("''${(j: and :)other}")
        print -u2 -r "Claude Code didn't start: ''${(j:, and :)said}, so it would run without ''${cost:-main-session.md's rules or its check for other damaged files}."
        (( $#restore > 1 )) && it=them
        (( $#restore )) && print -u2 -r "Restore $it from the last commit''${on:+, unless you deleted $it on purpose}:"$'\n'"  git -C ~/.dotfiles checkout HEAD -- $restore"
        (( $#relink )) && print -u2 -r "Run rebuild to link ''${(j: and :)relink} again."
        print -u2 -r "Then run claude again, or start it anyway with:" command claude ''${(q)@}
        return 1
      }
    '';
  };

  programs.starship = {
    enable = true;
  };

  home.file.".config/wezterm".source = 
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/wezterm";
  
  home.file.".config/nvim".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/nvim";

  home.file.".config/herdr".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/herdr";

  home.file.".config/starship.toml".source =
    config.lib.file.mkOutOfStoreSymlink "${dotfiles}/home/.config/starship/starship.toml";

  # Linked directly, not through home.file: Claude Code follows only one
  # symlink when it saves settings, so a hop through the read-only store
  # breaks /effort, /config and friends. The rest of ~/.claude is linked
  # the same way.
  home.activation.claudeSettings = lib.hm.dag.entryAfter [ "linkGeneration" ] ''
    run mkdir -p "$HOME/.claude/skills"
    run ln -sfn "${dotfiles}/home/.claude/settings.json" "$HOME/.claude/settings.json"
    run ln -sfn "${dotfiles}/home/.claude/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
    run ln -sfn "${dotfiles}/home/.claude/hooks" "$HOME/.claude/hooks"
    run ln -sfn "${dotfiles}/home/.claude/agents" "$HOME/.claude/agents"
    # each skill on its own, so ~/.claude/skills keeps Claude Code's own;
    # a skill's link goes when its folder does
    for link in "$HOME"/.claude/skills/*; do
      if [ -L "$link" ] && [ ! -e "$link" ] && [[ "$(readlink "$link")" == "${dotfiles}/home/.claude/skills/"* ]]; then
        run rm "$link"
      fi
    done
    ${lib.concatMapStrings (skill: ''
      run ln -sfn ${lib.escapeShellArg "${dotfiles}/home/.claude/skills/${skill}"} "$HOME/.claude/skills/"${lib.escapeShellArg skill}
    '') skills}
    # the repo's own git hooks, in .githooks (each one's header says what it
    # does); relative, so each worktree runs its own
    run ${pkgs.git}/bin/git -C "${dotfiles}" config core.hooksPath .githooks
  '';
}
