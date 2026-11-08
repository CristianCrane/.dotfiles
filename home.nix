{ config, pkgs, lib, inputs, ... }:

let
  dotfiles = "${config.home.homeDirectory}/.dotfiles";
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
    # each skill on its own, so ~/.claude/skills keeps Claude Code's own
    for skill in "${dotfiles}"/home/.claude/skills/*; do
      run ln -sfn "$skill" "$HOME/.claude/skills/$(basename "$skill")"
    done
  '';
}
