{ config, pkgs, inputs, ... }: 

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
    lazygit
    inputs.herdr.packages.${pkgs.stdenv.hostPlatform.system}.default
    nodejs
    pnpm
    stdenv.cc
    pkg-config
    vtsls       # typescript lsp
    lua-language-server
    tree-sitter # cli parser generator required by nvim-treesitter
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
    };
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
}
